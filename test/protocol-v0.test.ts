import { describe, it, expect } from 'vitest';
import {
  createEmptyCanonicalEvidenceGraph,
  type ActionRealityDelta,
  type CanonicalEvidenceGraph,
  type ChangeEvidence,
  type DiagnosticEvidence,
  type RelationEvidence,
  type VerificationEvidence,
  type VerificationItemV0,
  type UnknownEvidence,
} from '../src/core/protocol-v0.js';
import { compileEvidenceToCanonical } from '../src/core/evidence-compiler.js';

describe('WTF Evidence Protocol v0 — Canonical Substrate & Invariants', () => {

  it('1. Each primitive can be represented deterministically with explicit provenance', () => {
    const graph = createEmptyCanonicalEvidenceGraph();
    expect(graph.spec).toBe('wtf/protocol-v0');

    // CHANGE
    const change: ChangeEvidence = {
      status: 'observed',
      files: [
        {
          file: 'src/impls.rs',
          operation: 'MODIFIED',
          additions: 2,
          deletions: 2,
          provenance: 'OBSERVED',
        },
      ],
      meaningfulLines: 4,
      provenance: 'OBSERVED',
    };
    expect(change.provenance).toBe('OBSERVED');
    expect(change.files[0].provenance).toBe('OBSERVED');

    // DIAGNOSTIC
    const diagnostic: DiagnosticEvidence = {
      status: 'reported',
      items: [
        {
          tool: 'rustc',
          message: 'mismatched types: expected `&[u8]`, found `bool`',
          file: 'src/impls.rs',
          line: 55,
          level: 'error',
          provenance: 'REPORTED',
        },
      ],
      provenance: 'REPORTED',
    };
    expect(diagnostic.provenance).toBe('REPORTED');
    expect(diagnostic.items[0].provenance).toBe('REPORTED');

    // RELATION
    const relation: RelationEvidence = {
      status: 'established',
      items: [
        {
          predicate: 'intersects_changed_lines',
          statement: 'diagnostic on changed line 55 in src/impls.rs',
          subject: { type: 'diagnostic', identifier: 'rustc:src/impls.rs:55', file: 'src/impls.rs', line: 55 },
          object: { type: 'change', identifier: 'change:src/impls.rs' },
          provenance: 'MECHANICALLY_DERIVED',
        },
      ],
      provenance: 'MECHANICALLY_DERIVED',
    };
    expect(relation.provenance).toBe('MECHANICALLY_DERIVED');

    // VERIFICATION
    const verification: VerificationEvidence = {
      status: 'verified',
      items: [
        {
          command: 'cargo test',
          lifecycle: 'TESTS_PASSED',
          invocation: 'VALID',
          compilation: 'VALID',
          status: 'PASSED',
          testsExecuted: 183,
          tier: 'VERIFIED',
          provenance: 'VERIFIED',
        },
      ],
    };
    expect(verification.items[0].tier).toBe('VERIFIED');
    expect(verification.items[0].provenance).toBe('VERIFIED');

    // UNKNOWN
    const unknown: UnknownEvidence = {
      items: [
        {
          category: 'task_intent_correctness',
          statement: 'Task intent correctness: unverified',
          provenance: 'UNKNOWN',
        },
      ],
      provenance: 'UNKNOWN',
    };
    expect(unknown.items[0].provenance).toBe('UNKNOWN');
  });

  it('2. Provenance and epistemic status are strictly segregated without confidence scores', () => {
    const graph: CanonicalEvidenceGraph = createEmptyCanonicalEvidenceGraph();
    
    // Invariant: No confidence score or probability fields exist
    expect((graph as any).confidence).toBeUndefined();
    expect((graph.verification as any).probability).toBeUndefined();
    expect((graph.change as any).confidence).toBeUndefined();

    // Verify all allowed field provenances
    const allowedProvenances = new Set(['REPORTED', 'OBSERVED', 'VERIFIED', 'MECHANICALLY_DERIVED', 'UNKNOWN']);
    expect(allowedProvenances.has(graph.change.provenance)).toBe(true);
    expect(allowedProvenances.has(graph.diagnostic.provenance)).toBe(true);
    expect(allowedProvenances.has(graph.relation.provenance)).toBe(true);
    expect(allowedProvenances.has(graph.unknown.provenance)).toBe(true);
  });

  it('3. RELATION expresses mechanical association without causal assertions', () => {
    // A relation linking an error to a changed hunk
    const relationItem = {
      predicate: 'intersects_changed_lines' as const,
      statement: 'diagnostic at src/impls.rs:55 intersects changed lines [52-58]',
      subject: { type: 'diagnostic' as const, identifier: 'rustc:E0308', file: 'src/impls.rs', line: 55 },
      object: { type: 'change' as const, identifier: 'change:src/impls.rs', lineRange: [52, 58] as [number, number] },
      provenance: 'MECHANICALLY_DERIVED' as const,
    };

    // Invariant: The statement must not assert causality ("caused by", "root cause")
    expect(relationItem.statement).not.toMatch(/\b(caused|root\s*cause|triggered\s*by|because)\b/i);
    expect(relationItem.predicate).toBe('intersects_changed_lines');
    expect(relationItem.provenance).toBe('MECHANICALLY_DERIVED');
  });

  it('4. Verification accurately distinguishes all six lifecycle outcomes', () => {
    // Case 4a: Not run / unknown
    const notRun: VerificationItemV0 = {
      command: 'npm test',
      lifecycle: 'NOT_RUN',
      invocation: 'UNKNOWN',
      status: 'UNKNOWN',
      testsExecuted: 'UNKNOWN',
      tier: 'UNKNOWN',
      provenance: 'UNKNOWN',
    };
    expect(notRun.tier).toBe('UNKNOWN');
    expect(notRun.status).toBe('UNKNOWN');

    // Case 4b: Invocation failure (e.g. invalid target or missing binary)
    const invocationFailed: VerificationItemV0 = {
      command: 'cargo test --test non_existent_target',
      lifecycle: 'INVOCATION_FAILED',
      invocation: 'FAILED',
      status: 'UNKNOWN',
      testsExecuted: 'UNKNOWN', // Invariant: must not be 0
      tier: 'UNKNOWN',           // Invariant: invocation failure is not a verified test suite failure
      provenance: 'UNKNOWN',
    };
    expect(invocationFailed.invocation).toBe('FAILED');
    expect(invocationFailed.tier).toBe('UNKNOWN');
    expect(invocationFailed.testsExecuted).toBe('UNKNOWN');

    // Case 4c: Execution Timeout
    const timeout: VerificationItemV0 = {
      command: 'pytest',
      lifecycle: 'TIMEOUT',
      invocation: 'VALID',
      status: 'TIMEOUT',
      durationMs: 120000,
      testsExecuted: 'UNKNOWN',
      tier: 'UNKNOWN',           // Invariant: timeout is aborted execution, NOT verified test failure
      provenance: 'UNKNOWN',
    };
    expect(timeout.lifecycle).toBe('TIMEOUT');
    expect(timeout.tier).toBe('UNKNOWN');
    expect(timeout.testsExecuted).toBe('UNKNOWN');

    // Case 4d: Build failure prior to tests
    const buildFailed: VerificationItemV0 = {
      command: 'cargo test',
      lifecycle: 'BUILD_FAILED',
      invocation: 'VALID',
      compilation: 'FAILED',
      status: 'FAILED',
      testsExecuted: 'UNKNOWN', // Tests never ran
      tier: 'VERIFIED',          // Compilation failure was deterministically verified
      provenance: 'VERIFIED',
    };
    expect(buildFailed.compilation).toBe('FAILED');
    expect(buildFailed.testsExecuted).toBe('UNKNOWN');
    expect(buildFailed.tier).toBe('VERIFIED');

    // Case 4e: Tests executed and failed
    const testsFailed: VerificationItemV0 = {
      command: 'cargo test',
      lifecycle: 'TESTS_FAILED',
      invocation: 'VALID',
      compilation: 'VALID',
      status: 'FAILED',
      testsExecuted: 42,
      tier: 'VERIFIED',
      provenance: 'VERIFIED',
    };
    expect(testsFailed.status).toBe('FAILED');
    expect(testsFailed.testsExecuted).toBe(42);
    expect(testsFailed.tier).toBe('VERIFIED');

    // Case 4f: Tests executed and passed
    const testsPassed: VerificationItemV0 = {
      command: 'cargo test',
      lifecycle: 'TESTS_PASSED',
      invocation: 'VALID',
      compilation: 'VALID',
      status: 'PASSED',
      testsExecuted: 183,
      tier: 'VERIFIED',
      provenance: 'VERIFIED',
    };
    expect(testsPassed.status).toBe('PASSED');
    expect(testsPassed.testsExecuted).toBe(183);
    expect(testsPassed.tier).toBe('VERIFIED');
  });

  it('5. Passing tests do not imply task correctness or intent satisfaction', () => {
    const graph = createEmptyCanonicalEvidenceGraph();
    graph.verification = {
      status: 'verified',
      items: [
        {
          command: 'cargo test',
          lifecycle: 'TESTS_PASSED',
          invocation: 'VALID',
          compilation: 'VALID',
          status: 'PASSED',
          testsExecuted: 193,
          tier: 'VERIFIED',
          provenance: 'VERIFIED',
        },
      ],
    };

    // Invariant: Even when tests are 100% passing, task intent correctness remains strictly UNKNOWN
    const intentUnknown = graph.unknown.items.find((u) => u.category === 'task_intent_correctness');
    expect(intentUnknown).toBeDefined();
    expect(intentUnknown?.provenance).toBe('UNKNOWN');
    expect(intentUnknown?.statement).toContain('unverified');
  });

  it('6. UNKNOWN is a first-class evidence entity, not an exception or error', () => {
    const graph = createEmptyCanonicalEvidenceGraph();
    
    // UNKNOWN contains structured items with categories and provenance
    expect(Array.isArray(graph.unknown.items)).toBe(true);
    expect(graph.unknown.items.length).toBeGreaterThan(0);
    expect(graph.unknown.provenance).toBe('UNKNOWN');

    // Adding domain-specific unknowns
    graph.unknown.items.push({
      category: 'project_test_status',
      statement: 'Project test status: unverified (invocation failed before test execution)',
      provenance: 'UNKNOWN',
    });

    expect(graph.unknown.items.some((i) => i.category === 'project_test_status')).toBe(true);
  });

  it('7. Canonical structures serialize deterministically to JSON', () => {
    const delta: ActionRealityDelta = {
      spec: 'wtf/protocol-v0',
      envelope: {
        action: {
          tool: 'edit_file',
          args: { path: 'src/impls.rs', line: 55 },
        },
        stateBefore: { snapshotId: 'commit-abc123' },
        stateAfter: { snapshotId: 'commit-def456' },
      },
      evidence: createEmptyCanonicalEvidenceGraph(),
    };

    const serialized = JSON.stringify(delta);
    const parsed = JSON.parse(serialized);

    expect(parsed.spec).toBe('wtf/protocol-v0');
    expect(parsed.envelope.action.tool).toBe('edit_file');
    expect(parsed.evidence.change.status).toBe('none observed');
    expect(parsed.evidence.unknown.items[0].category).toBe('task_intent_correctness');
  });

  it('8. Evidence Compiler maps raw tool outputs to CanonicalEvidenceGraph cleanly', () => {
    const rawCompilerOutput = `   Compiling bstr v1.11.2 (/workspace)
error[E0308]: mismatched types
  --> src/impls.rs:55:12
   |
55 |         PartialEq::eq(this, other.as_bytes())
   |         ^^^^^^^^^^^^^ expected \`&[u8]\`, found \`bool\`
error: could not compile \`bstr\` (lib) due to 1 previous error
`;
    const gitDiff = `diff --git a/src/impls.rs b/src/impls.rs
--- a/src/impls.rs
+++ b/src/impls.rs
@@ -55,1 +55,1 @@
-        PartialEq::eq(this, self.as_bytes())
+        PartialEq::eq(this, other.as_bytes())
`;

    const canonical = compileEvidenceToCanonical({
      cmd: 'cargo test',
      exitCode: 101,
      stdout: rawCompilerOutput,
      stderr: '',
      gitDiff,
    });

    expect(canonical.spec).toBe('wtf/protocol-v0');
    
    // CHANGE verified
    expect(canonical.change.status).toBe('observed');
    expect(canonical.change.files[0].file).toBe('src/impls.rs');
    expect(canonical.change.files[0].provenance).toBe('OBSERVED');

    // DIAGNOSTIC verified
    expect(canonical.diagnostic.status).toBe('reported');
    expect(canonical.diagnostic.items.length).toBeGreaterThan(0);
    expect(canonical.diagnostic.items[0].file).toBe('src/impls.rs');
    expect(canonical.diagnostic.items[0].line).toBe(55);
    expect(canonical.diagnostic.items[0].provenance).toBe('REPORTED');

    // RELATION verified: coordinate intersection with diff hunk at line 55
    expect(canonical.relation.status).toBe('established');
    expect(canonical.relation.items.length).toBeGreaterThan(0);
    expect(canonical.relation.items[0].predicate).toBe('intersects_changed_lines');
    expect(canonical.relation.items[0].statement).toContain('diagnostic on changed line 55 in src/impls.rs');
    expect(canonical.relation.items[0].provenance).toBe('MECHANICALLY_DERIVED');

    // VERIFICATION verified: build failure
    expect(canonical.verification.items[0].lifecycle).toBe('BUILD_FAILED');
    expect(canonical.verification.items[0].compilation).toBe('FAILED');
    expect(canonical.verification.items[0].testsExecuted).toBe('UNKNOWN');
    expect(canonical.verification.items[0].tier).toBe('VERIFIED');

    // UNKNOWN verified: causal relationship between diagnostics and task intent
    expect(canonical.unknown.items.some((u) => u.category === 'causal_relationship_between_diagnostics')).toBe(true);
    expect(canonical.unknown.items.some((u) => u.category === 'task_intent_correctness')).toBe(true);
  });

});
