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
  name: string; // e.g. 'tests', 'typecheck', 'build', 'lint'
  command: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'NOT_RUN';
  summary?: string; // e.g. '183/183'
  details?: string;
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
