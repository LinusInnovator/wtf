import { execSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { isBinaryPath, isMechanicalPath } from './classifier.js';
import type { AnalyzeOptions, ChangeSummary, DiffHunk, FileDiffStat, FilePatch } from '../types.js';

export interface GitContext {
  isRepo: boolean;
  root: string;
  branch?: string;
  headSha?: string;
  hasCommits: boolean;
}

export function getGitContext(cwd: string = process.cwd()): GitContext {
  try {
    const isInsideWorkTree = execSync('git rev-parse --is-inside-work-tree', {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    }).trim() === 'true';

    if (!isInsideWorkTree) {
      return { isRepo: false, root: cwd, hasCommits: false };
    }

    const root = execSync('git rev-parse --show-toplevel', {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    }).trim();

    let branch: string | undefined;
    try {
      const b = execSync('git branch --show-current', {
        cwd: root,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8',
      }).trim();
      if (b) branch = b;
    } catch {
      // Detached head or older git
    }

    let headSha: string | undefined;
    let hasCommits = false;
    try {
      headSha = execSync('git rev-parse --short HEAD', {
        cwd: root,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8',
      }).trim();
      hasCommits = true;
    } catch {
      hasCommits = false;
    }

    return { isRepo: true, root, branch, headSha, hasCommits };
  } catch {
    return { isRepo: false, root: cwd, hasCommits: false };
  }
}

export interface RawGitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export function getGitStatus(cwd: string): RawGitStatus {
  try {
    const out = execSync('git status --porcelain', {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    const lines = out.split('\n');
    for (const line of lines) {
      if (!line || line.length < 3) continue;
      const x = line[0];
      const y = line[1];
      const filePart = line.slice(3).trim();
      // Handle renames: orig -> dest
      const targetPath = filePart.includes(' -> ') ? filePart.split(' -> ')[1] : filePart;

      if (x === '?' && y === '?') {
        untracked.push(targetPath);
      } else {
        if (x !== ' ' && x !== '?') {
          staged.push(targetPath);
        }
        if (y !== ' ' && y !== '?') {
          unstaged.push(targetPath);
        }
      }
    }

    return { staged, unstaged, untracked };
  } catch {
    return { staged: [], unstaged: [], untracked: [] };
  }
}

export function parseUnifiedDiff(diffOutput: string): FilePatch[] {
  const patches: FilePatch[] = [];
  if (!diffOutput.trim()) return patches;

  const rawFiles = diffOutput.split(/^diff --git /m);

  for (const raw of rawFiles) {
    if (!raw.trim()) continue;

    const lines = raw.split('\n');
    const headerLine = lines[0]; // e.g. "a/path b/path"
    const match = headerLine.match(/^a\/(.*?)\s+b\/(.*)$/);
    if (!match) continue;

    const oldPath = match[1];
    const newPath = match[2];

    let status: FilePatch['status'] = 'modified';
    if (raw.includes('\nnew file mode')) {
      status = 'added';
    } else if (raw.includes('\ndeleted file mode')) {
      status = 'deleted';
    } else if (raw.includes('\nsimilarity index') && raw.includes('\nrename from')) {
      status = 'renamed';
    }

    const { isMechanical } = isMechanicalPath(newPath);

    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let added = 0;
    let deleted = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('@@ ')) {
        // @@ -1,5 +1,6 @@
        const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (hunkMatch) {
          if (currentHunk) hunks.push(currentHunk);
          currentHunk = {
            oldStart: parseInt(hunkMatch[1], 10),
            oldLines: hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1,
            newStart: parseInt(hunkMatch[3], 10),
            newLines: hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1,
            lines: [],
          };
        }
      } else if (currentHunk) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          added++;
          currentHunk.lines.push(line);
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deleted++;
          currentHunk.lines.push(line);
        } else if (line.startsWith(' ')) {
          currentHunk.lines.push(line);
        } else if (line.startsWith('\\ No newline at end of file')) {
          // ignore
        }
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    patches.push({
      path: newPath,
      oldPath: status === 'renamed' ? oldPath : undefined,
      hunks,
      added,
      deleted,
      isMechanical,
      status,
    });
  }

  return patches;
}

export function getUntrackedFilePatches(root: string, untrackedFiles: string[]): FilePatch[] {
  const patches: FilePatch[] = [];

  for (const relPath of untrackedFiles) {
    const fullPath = path.join(root, relPath);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) continue;
      if (isBinaryPath(relPath)) {
        patches.push({
          path: relPath,
          hunks: [],
          added: 0,
          deleted: 0,
          isMechanical: false,
          status: 'untracked',
        });
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      const { isMechanical } = isMechanicalPath(relPath);

      const hunkLines = lines.map((l) => '+' + l);
      patches.push({
        path: relPath,
        hunks: [
          {
            oldStart: 0,
            oldLines: 0,
            newStart: 1,
            newLines: lines.length,
            lines: hunkLines,
          },
        ],
        added: lines.length,
        deleted: 0,
        isMechanical,
        status: 'untracked',
      });
    } catch {
      // ignore unreadable
    }
  }

  return patches;
}

export function collectPatches(
  ctx: GitContext,
  options: AnalyzeOptions = {}
): { patches: FilePatch[]; status: RawGitStatus } {
  if (!ctx.isRepo) {
    return { patches: [], status: { staged: [], unstaged: [], untracked: [] } };
  }

  const root = ctx.root;
  const status = getGitStatus(root);

  let diffCmd: string;

  if (options.range) {
    diffCmd = `git diff ${options.range}`;
  } else if (options.commit) {
    diffCmd = `git diff ${options.commit}^!`;
  } else if (options.stagedOnly) {
    diffCmd = `git diff --cached`;
  } else if (ctx.hasCommits) {
    // Shows all working tree and index changes against HEAD
    diffCmd = `git diff HEAD`;
  } else {
    // No commits yet: diff cached if any
    diffCmd = `git diff --cached`;
  }

  let diffOutput = '';
  try {
    diffOutput = execSync(diffCmd, {
      cwd: root,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024, // 50MB
    });
  } catch (err: any) {
    // In case of empty repo with no commits and no cached diff
    diffOutput = '';
  }

  const trackedPatches = parseUnifiedDiff(diffOutput);
  const trackedPathSet = new Set(trackedPatches.map((p) => p.path));

  // Include untracked files unless a specific commit/range was requested
  let untrackedPatches: FilePatch[] = [];
  if (!options.range && !options.commit && !options.stagedOnly) {
    const remainingUntracked = status.untracked.filter((p) => !trackedPathSet.has(p));
    untrackedPatches = getUntrackedFilePatches(root, remainingUntracked);
  }

  const allPatches = [...trackedPatches, ...untrackedPatches];

  return { patches: allPatches, status };
}

export function calculateChangeSummary(
  patches: FilePatch[],
  status: RawGitStatus,
  ctx: GitContext
): ChangeSummary {
  let linesAdded = 0;
  let linesDeleted = 0;
  let mechanicalLines = 0;
  let meaningfulLines = 0;

  for (const patch of patches) {
    linesAdded += patch.added;
    linesDeleted += patch.deleted;
    const patchTotal = patch.added + patch.deleted;
    if (patch.isMechanical) {
      mechanicalLines += patchTotal;
    } else {
      meaningfulLines += patchTotal;
    }
  }

  const totalLinesChanged = linesAdded + linesDeleted;
  const compressionRatio =
    totalLinesChanged > 0 ? Number((mechanicalLines / totalLinesChanged).toFixed(3)) : 0;

  return {
    totalFiles: patches.length,
    linesAdded,
    linesDeleted,
    meaningfulLines,
    mechanicalLines,
    totalLinesChanged,
    compressionRatio,
    stagedFiles: new Set(status.staged).size,
    unstagedFiles: new Set(status.unstaged).size,
    untrackedFiles: status.untracked.length,
    branch: ctx.branch,
    headSha: ctx.headSha,
    isClean: patches.length === 0,
  };
}
