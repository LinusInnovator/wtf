/**
 * WTF Evidence Protocol v0 — Canonical Types
 *
 * Strict deterministic evidence model based on:
 * - docs/research/WTF_EVIDENCE_PROTOCOL_V0.md
 * - docs/research/WTF_FIRST_PRINCIPLES_ARCHITECTURE.md
 *
 * Epistemic Invariants:
 * 1. Every statement must either have deterministic provenance or be represented as UNKNOWN.
 * 2. No probabilistic confidence scores or heuristic likelihoods.
 * 3. RELATION expresses only spatial, mechanical, or inventory facts—never semantic causality.
 * 4. Verification outcomes prove only that the executed command ran; they never imply task correctness.
 * 5. Missing or ambiguous verification metrics must be UNKNOWN, never defaulted to 0 or false.
 */

// ---------------------------------------------------------------------------
// 1. Epistemic Provenance
// ---------------------------------------------------------------------------

/**
 * Epistemic Provenance tracks how a piece of evidence was obtained.
 *
 * NOTE: The four truth/confidence tiers exposed to consumers are strictly:
 * REPORTED, OBSERVED, VERIFIED, UNKNOWN.
 *
 * MECHANICALLY_DERIVED is strictly a provenance descriptor indicating deterministic derivation
 * (e.g. spatial intersection, coordinate math, or string extraction from observed diffs).
 * It is NOT a fifth confidence or truth tier competing with REPORTED, OBSERVED, VERIFIED, or UNKNOWN.
 */
export type EpistemicProvenance =
  | 'REPORTED'             // Directly emitted by a tool/compiler stdout/stderr stream
  | 'OBSERVED'             // Mechanically measured from repository environment (git, filesystem)
  | 'VERIFIED'             // Deterministic outcome of an executed validation check
  | 'MECHANICALLY_DERIVED' // Spatial, coordinate, or deterministic derivation from observations
  | 'UNKNOWN';             // First-class declaration of unestablished state


// ---------------------------------------------------------------------------
// 2. CHANGE Primitive
// ---------------------------------------------------------------------------

export type ChangeOperation =
  | 'MODIFIED'
  | 'CREATED'
  | 'DELETED'
  | 'RENAMED'
  | 'REJECTED';

export interface FileChangeItem {
  file: string;
  operation: ChangeOperation;
  additions: number;
  deletions: number;
  oldPath?: string;
  isMechanical?: boolean;
  provenance: 'OBSERVED';
}

export interface ChangeEvidence {
  status: 'none observed' | 'observed';
  files: FileChangeItem[];
  meaningfulLines?: number;
  provenance: 'OBSERVED';
}

// ---------------------------------------------------------------------------
// 3. DIAGNOSTIC Primitive
// ---------------------------------------------------------------------------

export type DiagnosticLevel = 'error' | 'warning' | 'note' | 'help' | 'other';

export interface DiagnosticItem {
  tool: string;
  message: string;
  target?: string;
  file?: string;
  line?: number;
  column?: number;
  level?: DiagnosticLevel;
  rawText?: string;
  provenance: 'REPORTED';
}

export interface DiagnosticEvidence {
  status: 'none' | 'reported';
  items: DiagnosticItem[];
  provenance: 'REPORTED';
}

// ---------------------------------------------------------------------------
// 4. RELATION Primitive
// ---------------------------------------------------------------------------

/**
 * Closed set of mechanically defined relation predicates in Protocol v0.
 *
 * NOTE (Architectural UNKNOWN):
 * A generalized RelationPredicate registry or open-ended ontology is deliberately deferred.
 * Predicate standardization remains UNKNOWN until actual predicate proliferation creates
 * empirical evidence that a formal registry is necessary.
 */
export type RelationPredicate =
  | 'intersects_changed_lines'
  | 'in_changed_file_unchanged_line'
  | 'in_unchanged_file'
  | 'absent_from_observed_targets'
  | 'present_in_manifest'
  | 'exists_in_working_tree'
  | 'absent_from_workspace'
  | 'intersects_auth_surface'
  | 'declares_schema_operation'
  | 'declares_skipped_test'
  | 'declares_dependency'
  | 'triggers_workflow';

export interface RelationSubject {
  type: 'diagnostic' | 'target' | 'path';
  identifier: string; // e.g. "rustc:E0308:src/impls.rs:55" or "target:impls"
  file?: string;
  line?: number;
}

export interface RelationObject {
  type: 'change' | 'inventory' | 'file';
  identifier: string; // e.g. "change:src/impls.rs:52-58" or "observed_targets"
  file?: string;
  lineRange?: [number, number];
}

export interface RelationItem {
  predicate: RelationPredicate;
  statement: string; // Strictly mechanical fact (e.g. "diagnostic on changed line 55 in src/impls.rs")
  subject?: RelationSubject;
  object?: RelationObject;
  provenance: 'MECHANICALLY_DERIVED' | 'OBSERVED';
}

export interface RelationEvidence {
  status: 'none' | 'established';
  items: RelationItem[];
  provenance: 'MECHANICALLY_DERIVED';
}

// ---------------------------------------------------------------------------
// 5. VERIFICATION Primitive
// ---------------------------------------------------------------------------

export type VerificationLifecycleStatus =
  | 'NONE'
  | 'COMMAND_UNKNOWN'
  | 'NOT_RUN'
  | 'INVOCATION_FAILED'
  | 'TIMEOUT'
  | 'BUILD_FAILED'
  | 'TESTS_FAILED'
  | 'TESTS_PASSED'
  | 'PARTIAL_EXECUTION';

export type VerificationInvocationStatus = 'VALID' | 'FAILED' | 'UNKNOWN';
export type VerificationCompilationStatus = 'VALID' | 'FAILED' | 'SKIPPED' | 'UNKNOWN';
export type VerificationExecutionStatus = 'PASSED' | 'FAILED' | 'TIMEOUT' | 'UNKNOWN';

export interface VerificationItemV0 {
  name?: string;
  command: string;
  lifecycle: VerificationLifecycleStatus;
  invocation: VerificationInvocationStatus;
  compilation?: VerificationCompilationStatus;
  status: VerificationExecutionStatus;
  // Critical invariant: never emit 0 unless runner explicitly reports 0 executed tests
  testsExecuted: number | 'UNKNOWN';
  durationMs?: number;
  exitCode?: number | null;
  summary?: string;
  details?: string;
  tier: 'VERIFIED' | 'UNKNOWN';
  provenance: 'VERIFIED' | 'UNKNOWN';
}

export interface VerificationEvidence {
  status: 'none' | 'verified' | 'unverified';
  items: VerificationItemV0[];
}

// ---------------------------------------------------------------------------
// 6. UNKNOWN Primitive
// ---------------------------------------------------------------------------

export interface UnknownItem {
  category: string; // e.g. "task_intent_correctness" | "project_test_status" | "intended_verification_command"
  statement: string;
  provenance: 'UNKNOWN';
}

export interface UnknownEvidence {
  items: UnknownItem[];
  provenance: 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// 7. Canonical Evidence Graph (Protocol v0)
// ---------------------------------------------------------------------------

export interface CanonicalEvidenceGraph {
  spec: 'wtf/protocol-v0';
  change: ChangeEvidence;
  diagnostic: DiagnosticEvidence;
  relation: RelationEvidence;
  verification: VerificationEvidence;
  unknown: UnknownEvidence;
}

export interface CanonicalEvidenceDocumentV0 extends CanonicalEvidenceGraph {
  version: '0.1.0';
  timestamp: string;
  repo: {
    root: string;
    branch?: string;
    head?: string;
    clean: boolean;
  };
}

// ---------------------------------------------------------------------------
// 8. Action → Reality Delta Envelope
// ---------------------------------------------------------------------------

export interface ActionEnvelope {
  tool: string;
  args?: Record<string, unknown> | string;
}

export interface StateSnapshotMetadata {
  snapshotId?: string; // Git commit / tree hash / timestamp
  description?: string;
}

export interface ActionRealityDelta {
  spec: 'wtf/protocol-v0';
  envelope: {
    action: ActionEnvelope;
    stateBefore: StateSnapshotMetadata;
    stateAfter: StateSnapshotMetadata;
  };
  evidence: CanonicalEvidenceGraph;
}

// ---------------------------------------------------------------------------
// Factory Helpers (Boring deterministic constructors)
// ---------------------------------------------------------------------------

export function createEmptyCanonicalEvidenceGraph(): CanonicalEvidenceGraph {
  return {
    spec: 'wtf/protocol-v0',
    change: {
      status: 'none observed',
      files: [],
      provenance: 'OBSERVED',
    },
    diagnostic: {
      status: 'none',
      items: [],
      provenance: 'REPORTED',
    },
    relation: {
      status: 'none',
      items: [],
      provenance: 'MECHANICALLY_DERIVED',
    },
    verification: {
      status: 'none',
      items: [],
    },
    unknown: {
      items: [
        {
          category: 'task_intent_correctness',
          statement: 'Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)',
          provenance: 'UNKNOWN',
        },
      ],
      provenance: 'UNKNOWN',
    },
  };
}
