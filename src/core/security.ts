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
 * Validates that a target file path resolves strictly inside the allowed parent directory.
 * Prevents directory traversal attacks (e.g. '../../etc/passwd').
 */
export function isPathInside(parentDir: string, targetPath: string): boolean {
  const resolvedParent = path.resolve(parentDir);
  const resolvedTarget = path.resolve(parentDir, targetPath);

  return (
    resolvedTarget === resolvedParent ||
    resolvedTarget.startsWith(resolvedParent + path.sep)
  );
}

/**
 * Safe process execution for Git commands.
 * Strictly disables shell evaluation (shell: false) and enforces execution timeouts and buffer limits.
 */
export interface SafeGitResult {
  stdout: string;
  stderr: string;
  status: number | null;
  error?: Error;
}

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

  try {
    const res = spawnSync('git', args, {
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
 * Safely reads a file with size limits and path boundary enforcement.
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
    if (!fs.existsSync(fullPath)) return null;
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
