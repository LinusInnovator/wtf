import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Validates a git revision (commit hash, branch name, tag, or range).
 * Prevents flag injection (leading '-') and shell metacharacters.
 */
export function sanitizeGitRef(ref: string): string {
  if (!ref || typeof ref !== 'string') {
    throw new Error('Invalid git revision: reference cannot be empty');
  }

  const trimmed = ref.trim();

  // Flag injection check: cannot start with '-'
  if (trimmed.startsWith('-')) {
    throw new Error(`Security violation: git revision cannot start with '-': ${trimmed}`);
  }

  // Range and ref syntax whitelist:
  // Allows alphanumeric, dots, underscores, dashes, slashes, carets, tildes, colons, at signs.
  // Strictly disallows spaces, quotes, backticks, semicolons, null bytes, dollar signs, pipes, ampersands.
  const SAFE_REF_PATTERN = /^[a-zA-Z0-9_\.\/\^~@:\-]+$/;
  if (!SAFE_REF_PATTERN.test(trimmed)) {
    throw new Error(`Security violation: invalid characters in git reference: ${trimmed}`);
  }

  // Prevent multiple consecutive slashes or paths escaping git namespace
  if (trimmed.includes('//')) {
    throw new Error(`Security violation: malformed git reference: ${trimmed}`);
  }

  return trimmed;
}

/**
 * Checks whether a path escapes the parent directory either lexically (e.g. '../../')
 * or via filesystem symlinks pointing outside parentDir.
 */
export function isSymlinkOrPathEscaping(parentDir: string, targetPath: string): boolean {
  const resolvedParent = path.resolve(parentDir);
  const resolvedTarget = path.resolve(parentDir, targetPath);

  // 1. Lexical boundary check
  if (
    resolvedTarget !== resolvedParent &&
    !resolvedTarget.startsWith(resolvedParent + path.sep)
  ) {
    return true;
  }

  // 2. Realpath check (resolves symlink targets)
  try {
    if (fs.existsSync(resolvedTarget)) {
      const realParent = fs.realpathSync(resolvedParent);
      const realTarget = fs.realpathSync(resolvedTarget);
      if (
        realTarget !== realParent &&
        !realTarget.startsWith(realParent + path.sep)
      ) {
        return true; // Symlink points outside parentDir!
      }
    }
  } catch {
    // If realpath fails (e.g. broken symlink or permission denied), treat as unsafe
    return true;
  }

  return false;
}

/**
 * Validates that a target file path resolves strictly inside the allowed parent directory.
 * Prevents directory traversal attacks and external symlink escapes.
 */
export function isPathInside(parentDir: string, targetPath: string): boolean {
  return !isSymlinkOrPathEscaping(parentDir, targetPath);
}

/**
 * Baseline Git configuration overrides prepended to all safeGit executions.
 * Neutralizes repository-controlled external drivers, fsmonitors, hooks, and pagers.
 */
const SAFE_GIT_CONFIG_OVERRIDES: string[] = [
  '-c', 'core.fsmonitor=false',
  '-c', 'diff.external=',
  '-c', 'core.hooksPath=/dev/null',
  '-c', 'pager.diff=false',
  '-c', 'pager.show=false',
  '-c', 'pager.status=false',
];

export interface SafeGitResult {
  stdout: string;
  stderr: string;
  status: number | null;
  error?: Error;
}

/**
 * Safe process execution for Git commands.
 * Strictly disables shell evaluation (shell: false) and enforces execution timeouts and buffer limits.
 * Injects safe configuration overrides to neutralize repository-controlled hooks and drivers.
 */
export function safeGit(
  args: string[],
  cwd: string,
  maxBuffer: number = 50 * 1024 * 1024,
  timeoutMs: number = 30000
): SafeGitResult {
  // Validate that no argument contains null bytes
  for (const arg of args) {
    if (arg.includes('\0')) {
      throw new Error('Security violation: null byte detected in git argument');
    }
  }

  const finalArgs = [...SAFE_GIT_CONFIG_OVERRIDES];

  if (args.length > 0) {
    const subCmd = args[0];
    finalArgs.push(subCmd);

    // For diff and show, strictly neutralize external diff drivers and textconv filters
    if (subCmd === 'diff' || subCmd === 'show') {
      if (!args.includes('--no-ext-diff')) {
        finalArgs.push('--no-ext-diff');
      }
      if (!args.includes('--no-textconv')) {
        finalArgs.push('--no-textconv');
      }
    }

    finalArgs.push(...args.slice(1));
  }

  try {
    const res = spawnSync('git', finalArgs, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      maxBuffer,
      timeout: timeoutMs,
      shell: false, // CRITICAL: Never evaluate in shell
    });

    return {
      stdout: res.stdout || '',
      stderr: res.stderr || '',
      status: res.status,
      error: res.error,
    };
  } catch (err: any) {
    return {
      stdout: '',
      stderr: err.message || '',
      status: 1,
      error: err,
    };
  }
}

/**
 * Safely reads a file with size limits and symlink-aware path boundary enforcement.
 * Will NOT read symlinks pointing outside repoRoot.
 */
export function safeReadRepoFile(
  repoRoot: string,
  relPath: string,
  maxSizeBytes: number = 5 * 1024 * 1024
): string | null {
  if (!isPathInside(repoRoot, relPath)) {
    return null;
  }

  const fullPath = path.resolve(repoRoot, relPath);
  try {
    const lstat = fs.lstatSync(fullPath);
    if (lstat.isSymbolicLink()) {
      // Re-verify realpath resolution
      const realParent = fs.realpathSync(repoRoot);
      const realTarget = fs.realpathSync(fullPath);
      if (
        realTarget !== realParent &&
        !realTarget.startsWith(realParent + path.sep)
      ) {
        return null;
      }
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() || stat.size > maxSizeBytes) {
      return null;
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Truncates line content before regex pattern matching to prevent ReDoS on massive lines.
 */
export function truncateLineForRegex(line: string, maxLength: number = 2000): string {
  if (line.length <= maxLength) return line;
  return line.slice(0, maxLength);
}

/**
 * Sanitizes untrusted strings (file paths, diff hunks, code snippets) before outputting to terminal.
 * Strips ANSI escape sequences, OSC/DCS sequences, Unicode Bidi overrides, and dangerous control characters.
 */
export function sanitizeForTerminal(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // Strip ANSI CSI escape sequences: \x1b[ ... [a-zA-Z]
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, '')
    // Strip OSC escape sequences: \x1b] ... (\x07|\x1b\\)
    .replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, '')
    // Strip other escape sequences (\x1b followed by any character)
    .replace(/\x1b[PX^_][^\x1b]*\x1b\\/g, '')
    .replace(/\x1b./g, '')
    // Strip Unicode Bidi override controls (Trojan Source: LRO, RLO, LRE, RLE, PDF, LRI, RLI, FSI, PDI)
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
    // Replace carriage return and backspace (prevent overwriting line on terminal)
    .replace(/[\r\b]/g, '')
    // Replace non-printable ASCII control characters (preserving tab and newline)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}
