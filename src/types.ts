import type { VerificationLifecycleStatus } from './core/protocol-v0.js';
import type { TraceFrame } from './core/trace-slice.js';
export * from './core/protocol-v0.js';
export * from './core/action-normalizer.js';
export * from './core/action-compiler.js';
export * from './core/trace-slice.js';
export * from './core/viewport.js';

export type EvidenceTier = 'REPORTED' | 'OBSERVED' | 'VERIFIED' | 'UNKNOWN';

export type FindingCategory =
  | 'AUTH'
  | 'DATABASE'
  | 'SECURITY'
  | 'DEPENDENCY'
  | 'ENV'
  | 'WORKFLOW'
  | 'TESTS'
  | 'HYGIENE'
  | 'MECHANICAL'
  | 'OTHER';

export type FindingSeverity = 'CRITICAL' | 'WARN' | 'INFO';

export interface Finding {
  id: string;
  category: FindingCategory;
  title: string;
  description: string;
  file?: string;
  line?: number;
  evidenceTier: EvidenceTier;
  severity: FindingSeverity;
  snippet?: string;
}

export interface VerificationItem {
  name: string; // e.g. 'tests', 'typecheck', 'build', 'lint', 'verification'
  command: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'NOT_RUN' | 'TIMEOUT' | 'INVOCATION_FAILED' | 'UNKNOWN';
  lifecycle?: VerificationLifecycleStatus;
  summary?: string; // e.g. '183/183'
  details?: string;
  traceFrames?: TraceFrame[];
  durationMs?: number;
  tier: EvidenceTier;
}

export interface FileDiffStat {
  path: string;
  oldPath?: string;
  added: number;
  deleted: number;
  isMechanical: boolean;
  mechanicalReason?: string;
  isBinary: boolean;
  status: 'added' | 'deleted' | 'modified' | 'renamed' | 'untracked';
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[]; // with leading + / - / space
}

export interface FilePatch {
  path: string;
  oldPath?: string;
  hunks: DiffHunk[];
  added: number;
  deleted: number;
  isMechanical: boolean;
  status: 'added' | 'deleted' | 'modified' | 'renamed' | 'untracked';
}

export interface ChangeSummary {
  totalFiles: number;
  linesAdded: number;
  linesDeleted: number;
  meaningfulLines: number;
  totalLinesChanged: number;
  mechanicalLines: number;
  compressionRatio: number; // 0 to 1 (fraction of changes that are mechanical)
  stagedFiles: number;
  unstagedFiles: number;
  untrackedFiles: number;
  branch?: string;
  headSha?: string;
  isClean: boolean;
}

export interface FileSummary {
  path: string;
  added: number;
  deleted: number;
  isMechanical: boolean;
  status: 'added' | 'deleted' | 'modified' | 'renamed' | 'untracked';
}

export interface WTFReceipt {
  spec: 'wtf/0.1';
  timestamp: string;
  repo: {
    root: string;
    branch?: string;
    head?: string;
  };
  change: ChangeSummary;
  files: FileSummary[];
  /**
   * @deprecated ATTENTION(n) / payAttention is a deprecated compatibility field
   * derived from mechanically observed relations. It does not represent severity,
   * risk, failure, correctness, or canonical WTF policy. Canonical consumers
   * must not consume ATTENTION as truth.
   */
  payAttention: Finding[];
  also: Finding[];
  verification: VerificationItem[];
  reported: string[];
  observed: string[];
  verified: string[];
  unknown: string[];
}

export interface AnalyzeOptions {
  cwd?: string;
  commit?: string;
  range?: string;
  stagedOnly?: boolean;
}
