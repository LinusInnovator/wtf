/**
 * WTF Bounded Context Viewport Engine (Phase 9.2 / Protocol v0.2)
 *
 * Deterministically extracts and formats a bounded window of lines
 * [coord - radius : coord + radius] around a specified target coordinate or failure frame,
 * annotating line numbers and highlighting the exact target coordinate with a focus indicator.
 *
 * Epistemic Invariants (Frozen in Phase 7.1 and Phase 9.1):
 * 1. Zero probabilistic or model-driven selection.
 * 2. Deterministic line clamping: startLine = max(1, centerLine - radius), endLine = min(totalLines, centerLine + radius).
 * 3. 1-indexed numbering strictly preserved.
 * 4. Fails closed cleanly on non-existent or unreadable files.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { isPathInside } from './security.js';

export interface BoundedViewportOptions {
  radius?: number;        // Number of lines before and after focus line (default: 15)
  cwd?: string;           // Workspace root directory (default: process.cwd())
  showPointer?: boolean;  // Whether to render '==>' marker on centerLine (default: true)
}

export interface BoundedViewportResult {
  ok: boolean;
  file: string;           // Relative file path within workspace
  startLine: number;      // 1-indexed start line
  endLine: number;        // 1-indexed end line
  totalLines: number;     // Total lines in file on disk
  centerLine: number;     // Target coordinate line
  formatted: string;      // Formatted viewport text with header and line numbers
  rawLines: string[];     // Array of raw line contents in the viewport
  error?: string;
}

/**
 * Renders a deterministic bounded code viewport around a specific target line.
 */
export function renderBoundedViewport(
  filePath: string,
  centerLine: number,
  options?: BoundedViewportOptions
): BoundedViewportResult {
  const cwd = options?.cwd || process.cwd();
  const radius = options?.radius !== undefined ? Math.max(1, options.radius) : 15;
  const showPointer = options?.showPointer ?? true;

  const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);

  if (!isPathInside(cwd, fullPath)) {
    return {
      ok: false,
      file: filePath,
      startLine: 0,
      endLine: 0,
      totalLines: 0,
      centerLine,
      formatted: '',
      rawLines: [],
      error: `Security violation: Path '${filePath}' escapes workspace root`,
    };
  }

  if (!fs.existsSync(fullPath)) {
    return {
      ok: false,
      file: filePath,
      startLine: 0,
      endLine: 0,
      totalLines: 0,
      centerLine,
      formatted: '',
      rawLines: [],
      error: `File not found: ${filePath}`,
    };
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return {
        ok: false,
        file: filePath,
        startLine: 0,
        endLine: 0,
        totalLines: 0,
        centerLine,
        formatted: '',
        rawLines: [],
        error: `Path is not a regular file: ${filePath}`,
      };
    }
  } catch (err) {
    return {
      ok: false,
      file: filePath,
      startLine: 0,
      endLine: 0,
      totalLines: 0,
      centerLine,
      formatted: '',
      rawLines: [],
      error: `Cannot stat file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  let content: string;
  try {
    content = fs.readFileSync(fullPath, 'utf-8');
  } catch (err) {
    return {
      ok: false,
      file: filePath,
      startLine: 0,
      endLine: 0,
      totalLines: 0,
      centerLine,
      formatted: '',
      rawLines: [],
      error: `Error reading file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const allLines = content.split(/\r?\n/);
  const totalLines = allLines.length;
  const relPath = path.relative(cwd, fullPath) || filePath;

  // Clamp centerLine within [1, totalLines]
  const clampedCenter = Math.max(1, Math.min(totalLines, centerLine));
  const startLine = Math.max(1, clampedCenter - radius);
  const endLine = Math.min(totalLines, clampedCenter + radius);

  const rawSlice = allLines.slice(startLine - 1, endLine);

  const header = `[WTF BOUNDED VIEWPORT: ${relPath} lines ${startLine} to ${endLine} (coordinate line ${clampedCenter} of ${totalLines})]:\n`;
  const renderedLines = rawSlice.map((line, idx) => {
    const lineNum = startLine + idx;
    const isTarget = lineNum === clampedCenter;
    const marker = showPointer && isTarget ? '==>' : '   ';
    return `${marker} ${lineNum.toString().padStart(4, ' ')} | ${line}`;
  });

  const formatted = header + renderedLines.join('\n');

  return {
    ok: true,
    file: relPath,
    startLine,
    endLine,
    totalLines,
    centerLine: clampedCenter,
    formatted,
    rawLines: rawSlice,
  };
}
