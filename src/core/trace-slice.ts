/**
 * WTF Trace Slice Engine (Phase 9.2 / Protocol v0.2)
 *
 * Deterministically parses compiler diagnostics and test-runner error output (stdout/stderr)
 * across supported language ecosystems (Python, Node/TypeScript, Rust, Go), identifying the
 * exact source files, line numbers, and column offsets where failures occurred within
 * the repository workspace.
 *
 * Epistemic Invariants:
 * 1. Zero probabilistic ranking or LLM-driven filtering.
 * 2. Every returned frame must resolve to a readable file on disk inside the workspace.
 * 3. External vendor and environment directories (.venv, node_modules, /usr/) are excluded.
 * 4. No root cause speculation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { isPathInside } from './security.js';

export interface TraceFrame {
  file: string;          // Normalized relative path within workspace (e.g. "src/lib.rs")
  line: number;          // 1-indexed source line number
  column?: number;       // 1-indexed column number if present
  source: 'python' | 'node' | 'rust' | 'go' | 'generic';
  raw: string;           // Exact line matched in traceback
}

export interface TraceSliceOptions {
  ignorePatterns?: string[];
  maxFrames?: number;
}

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.venv',
  'site-packages',
  '/usr/',
  'Cellar',
  'vendor',
  '.cargo',
  'target/debug',
  'target/release',
];

interface FramePatternDef {
  regex: RegExp;
  source: 'python' | 'node' | 'rust' | 'go' | 'generic';
  fileGroup: number;
  lineGroup: number;
  colGroup?: number;
}

const FRAME_PATTERNS: FramePatternDef[] = [
  // Python: File "/path/to/file.py", line 25, in test_func
  {
    regex: /File\s+"([^"]+)",\s*line\s*(\d+)/,
    source: 'python',
    fileGroup: 1,
    lineGroup: 2,
  },
  // Rust: --> src/lib.rs:388:14
  {
    regex: /-->\s*([a-zA-Z0-9_./\\-]+\.rs):(\d+):(\d+)/,
    source: 'rust',
    fileGroup: 1,
    lineGroup: 2,
    colGroup: 3,
  },
  // Rust panic trace: at src/lib.rs:388:14
  {
    regex: /\bat\s+([a-zA-Z0-9_./\\-]+\.rs):(\d+):(\d+)/,
    source: 'rust',
    fileGroup: 1,
    lineGroup: 2,
    colGroup: 3,
  },
  // Node / V8: at Object.<anonymous> (/path/to/file.ts:25:12)
  {
    regex: /\bat\s+.*?\(([a-zA-Z0-9_./\\-]+\.(?:ts|js|jsx|tsx|mjs|cjs)):(\d+):(\d+)\)/,
    source: 'node',
    fileGroup: 1,
    lineGroup: 2,
    colGroup: 3,
  },
  // Node / V8 file URL: at file:///path/to/file.js:25:12
  {
    regex: /\bat\s+file:\/\/([a-zA-Z0-9_./\\-]+\.(?:ts|js|jsx|tsx|mjs|cjs)):(\d+):(\d+)/,
    source: 'node',
    fileGroup: 1,
    lineGroup: 2,
    colGroup: 3,
  },
  // Node / V8 plain: at /path/to/file.js:25:12
  {
    regex: /\bat\s+([a-zA-Z0-9_./\\-]+\.(?:ts|js|jsx|tsx|mjs|cjs)):(\d+):(\d+)/,
    source: 'node',
    fileGroup: 1,
    lineGroup: 2,
    colGroup: 3,
  },
  // Go test failure / panic: path/to/file_test.go:42:
  {
    regex: /(?:^|\s)([a-zA-Z0-9_./\\-]+\.go):(\d+)(?::(\d+))?/,
    source: 'go',
    fileGroup: 1,
    lineGroup: 2,
    colGroup: 3,
  },
  // Generic: path/to/file.ext:42:15 or path/to/file.ext:42
  {
    regex: /(?:^|\s)([a-zA-Z0-9_./\\-]+\.(?:py|rs|go|ts|js|jsx|tsx|mjs|cjs)):(\d+)(?::(\d+))?/,
    source: 'generic',
    fileGroup: 1,
    lineGroup: 2,
    colGroup: 3,
  },
];

/**
 * Deterministically parses process output and extracts verified source coordinates.
 */
export function extractTraceFrames(
  output: string,
  workspaceRoot: string,
  options?: TraceSliceOptions
): TraceFrame[] {
  if (!output || typeof output !== 'string') {
    return [];
  }

  const ignoreList = options?.ignorePatterns ?? DEFAULT_IGNORE_PATTERNS;
  const maxFrames = options?.maxFrames ?? 20;
  const lines = output.split(/\r?\n/);

  const frames: TraceFrame[] = [];
  const seenCoordinates = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    for (const pat of FRAME_PATTERNS) {
      const match = pat.regex.exec(trimmed);
      if (!match) continue;

      const rawFilePath = match[pat.fileGroup];
      const lineNumStr = match[pat.lineGroup];
      const colNumStr = pat.colGroup ? match[pat.colGroup] : undefined;

      const lineNum = parseInt(lineNumStr, 10);
      if (isNaN(lineNum) || lineNum <= 0) continue;

      const colNum = colNumStr ? parseInt(colNumStr, 10) : undefined;

      // Ignore matches containing known vendor/environment directories
      if (ignoreList.some((ign) => rawFilePath.includes(ign))) {
        continue;
      }

      // Resolve relative path within workspace
      let relPath: string;
      let fullPath: string;

      if (path.isAbsolute(rawFilePath)) {
        if (!isPathInside(workspaceRoot, rawFilePath)) {
          continue;
        }
        relPath = path.relative(workspaceRoot, rawFilePath);
        fullPath = rawFilePath;
      } else {
        relPath = path.normalize(rawFilePath);
        fullPath = path.resolve(workspaceRoot, relPath);
        if (!isPathInside(workspaceRoot, fullPath)) {
          continue;
        }
      }

      // Ensure file actually exists and is a regular file on disk
      try {
        if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
          continue;
        }
      } catch {
        continue;
      }

      const coordKey = `${relPath}:${lineNum}`;
      if (seenCoordinates.has(coordKey)) {
        continue;
      }
      seenCoordinates.add(coordKey);

      // Determine source ecosystem
      let source = pat.source;
      if (source === 'generic') {
        const ext = path.extname(relPath).toLowerCase();
        if (ext === '.py') source = 'python';
        else if (ext === '.rs') source = 'rust';
        else if (ext === '.go') source = 'go';
        else if (['.ts', '.js', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext)) source = 'node';
      }

      frames.push({
        file: relPath,
        line: lineNum,
        column: colNum && !isNaN(colNum) ? colNum : undefined,
        source,
        raw: trimmed,
      });

      if (frames.length >= maxFrames) {
        return frames;
      }

      // One match per line is sufficient
      break;
    }
  }

  return frames;
}
