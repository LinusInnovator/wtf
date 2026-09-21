import { calculateChangeSummary, collectPatches, getGitContext } from './git.js';
import { detectAuthChanges } from '../detectors/auth.js';
import { detectDatabaseChanges } from '../detectors/db.js';
import { detectDependencyChanges } from '../detectors/deps.js';
import { detectEnvironmentChanges } from '../detectors/env.js';
import { detectTestChanges } from '../detectors/tests.js';
import { detectHygieneIssues } from '../detectors/hygiene.js';
import { detectWorkflowChanges } from '../detectors/workflows.js';
import {
  getUnverifiedTargetsV0,
  runVerificationV0,
  toLegacyVerificationItem,
} from '../verify/runner.js';
import type {
  CanonicalEvidenceDocumentV0,
  ChangeEvidence,
  ChangeOperation,
  DiagnosticEvidence,
  DiagnosticItem,
  FileChangeItem,
  RelationEvidence,
  RelationItem,
  UnknownEvidence,
  UnknownItem,
  VerificationEvidence,
} from './protocol-v0.js';
import type {
  AnalyzeOptions,
  Finding,
  WTFReceipt,
} from '../types.js';

export interface AnalyzeResult {
  evidence: CanonicalEvidenceDocumentV0;
  // Legacy presentation compatibility fields (derived strictly from canonical evidence):
  receipt: WTFReceipt;
  alsoSummary: string[];
}

/**
 * Analyze a repository working tree and compile canonical Protocol v0 evidence.
 *
 * Invariant:
 * Canonical evidence is the sole internal truth. Formatters, terminal display,
 * and JSON views originate directly from CanonicalEvidenceDocumentV0.
 *
 * Legacy WTFReceipt is generated strictly via an external compatibility adapter.
 */
export function analyzeRepo(
  cwd: string = process.cwd(),
  options: AnalyzeOptions & { verify?: boolean } = {}
): AnalyzeResult {
  const ctx = getGitContext(cwd);
  const { patches, status } = collectPatches(ctx, options);
  const changeSummary = calculateChangeSummary(patches, status, ctx);

  // 1. Compile CHANGE primitive
  const fileChangeItems: FileChangeItem[] = patches.map((p) => {
    let op: ChangeOperation = 'MODIFIED';
    if (p.status === 'added') op = 'CREATED';
    else if (p.status === 'deleted') op = 'DELETED';
    else if (p.status === 'renamed') op = 'RENAMED';
    return {
      file: p.path,
      operation: op,
      additions: p.added,
      deletions: p.deleted,
      oldPath: p.oldPath,
      isMechanical: p.isMechanical,
      provenance: 'OBSERVED',
    };
  });

  const changeEvidence: ChangeEvidence = {
    status: changeSummary.isClean ? 'none observed' : 'observed',
    files: fileChangeItems,
    meaningfulLines: changeSummary.meaningfulLines,
    provenance: 'OBSERVED',
  };

  // 2. Run deterministic detectors
  const authFindings = detectAuthChanges(patches);
  const dbFindings = detectDatabaseChanges(patches);
  const { findings: depFindings, summaryItems: depSummary } = detectDependencyChanges(patches, ctx.root, options);
  const { findings: envFindings, summaryItems: envSummary } = detectEnvironmentChanges(patches);
  const { findings: testFindings, summaryItems: testSummary } = detectTestChanges(patches);
  const { findings: hygieneFindings, summaryItems: hygieneSummary } = detectHygieneIssues(patches);
  const { findings: workflowFindings, summaryItems: workflowSummary } = detectWorkflowChanges(patches);

  // 3. Compile RELATION primitive (mechanical facts only)
  const relationItems: RelationItem[] = [];

  for (const f of authFindings) {
    relationItems.push({
      predicate: 'intersects_auth_surface',
      statement: f.title,
      subject: { type: 'path', identifier: f.file || '', file: f.file, line: f.line },
      object: { type: 'change', identifier: 'auth_surface' },
      provenance: 'OBSERVED',
    });
  }

  for (const f of dbFindings) {
    relationItems.push({
      predicate: 'declares_schema_operation',
      statement: f.title,
      subject: { type: 'path', identifier: f.file || '', file: f.file, line: f.line },
      object: { type: 'change', identifier: 'schema' },
      provenance: 'OBSERVED',
    });
  }

  for (const f of testFindings) {
    if (f.id.includes('test-skipped') || f.id.includes('test-only')) {
      relationItems.push({
        predicate: 'declares_skipped_test',
        statement: f.title,
        subject: { type: 'path', identifier: f.file || '', file: f.file, line: f.line },
        object: { type: 'change', identifier: 'test_suite' },
        provenance: 'OBSERVED',
      });
    }
  }

  for (const f of depFindings) {
    relationItems.push({
      predicate: 'declares_dependency',
      statement: f.title,
      subject: { type: 'path', identifier: f.file || '', file: f.file, line: f.line },
      object: { type: 'change', identifier: 'dependency_manifest' },
      provenance: 'OBSERVED',
    });
  }

  for (const f of workflowFindings) {
    relationItems.push({
      predicate: 'triggers_workflow',
      statement: f.title,
      subject: { type: 'path', identifier: f.file || '', file: f.file, line: f.line },
      object: { type: 'change', identifier: 'workflow_trigger' },
      provenance: 'OBSERVED',
    });
  }

  const relationEvidence: RelationEvidence = {
    status: relationItems.length > 0 ? 'established' : 'none',
    items: relationItems,
    provenance: 'MECHANICALLY_DERIVED',
  };

  // 4. Compile DIAGNOSTIC primitive (reported compiler/hygiene items)
  const diagnosticItems: DiagnosticItem[] = [];

  for (const f of hygieneFindings) {
    diagnosticItems.push({
      tool: 'hygiene',
      message: f.title,
      file: f.file,
      line: f.line,
      level: 'note',
      rawText: f.description,
      provenance: 'REPORTED',
    });
  }

  const diagnosticEvidence: DiagnosticEvidence = {
    status: diagnosticItems.length > 0 ? 'reported' : 'none',
    items: diagnosticItems,
    provenance: 'REPORTED',
  };

  // 5. Compile VERIFICATION primitive (truthful lifecycle)
  const verifItems = options.verify
    ? runVerificationV0(ctx.root)
    : getUnverifiedTargetsV0(ctx.root);

  let verifStatus: VerificationEvidence['status'] = 'none';
  if (options.verify) {
    const anyVerified = verifItems.some((v) => v.tier === 'VERIFIED');
    verifStatus = anyVerified ? 'verified' : 'unverified';
  }

  const verificationEvidence: VerificationEvidence = {
    status: verifStatus,
    items: verifItems,
  };

  // 6. Compile UNKNOWN primitive (first-class epistemic boundary)
  const unknownItems: UnknownItem[] = [
    {
      category: 'task_intent_correctness',
      statement:
        'Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)',
      provenance: 'UNKNOWN',
    },
  ];

  if (!options.verify) {
    unknownItems.push({
      category: 'verification_status',
      statement: 'Verification: not run in this invocation (run `wtf verify` or `wtf check`)',
      provenance: 'UNKNOWN',
    });
  } else {
    for (const v of verifItems) {
      if (v.status === 'TIMEOUT') {
        unknownItems.push({
          category: 'verification_timeout',
          statement: `${v.name || 'verification'}: timed out (${v.durationMs}ms) · test suite completion unknown`,
          provenance: 'UNKNOWN',
        });
      } else if (v.lifecycle === 'INVOCATION_FAILED') {
        unknownItems.push({
          category: 'invocation_failed',
          statement: `${v.name || 'verification'}: command binary could not be spawned · execution unknown`,
          provenance: 'UNKNOWN',
        });
      } else if (v.lifecycle === 'COMMAND_UNKNOWN') {
        unknownItems.push({
          category: 'command_unknown',
          statement: `${v.name || 'verification'}: no deterministic verification contract discovered`,
          provenance: 'UNKNOWN',
        });
      }
    }
  }

  const unknownEvidence: UnknownEvidence = {
    items: unknownItems,
    provenance: 'UNKNOWN',
  };

  // 7. Assemble Canonical Protocol v0 Document
  const evidence: CanonicalEvidenceDocumentV0 = {
    spec: 'wtf/protocol-v0',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    repo: {
      root: ctx.root,
      branch: ctx.branch,
      head: ctx.headSha,
      clean: changeSummary.isClean,
    },
    change: changeEvidence,
    diagnostic: diagnosticEvidence,
    relation: relationEvidence,
    verification: verificationEvidence,
    unknown: unknownEvidence,
  };

  // 8. ALSO summary lines for compact display
  const alsoSummary: string[] = [
    ...depSummary,
    ...envSummary,
    ...testSummary,
    ...hygieneSummary,
    ...workflowSummary,
  ];

  // 9. Legacy Presentation Adapter (strictly external compatibility)
  const receipt = toLegacyReceipt(
    evidence,
    patches,
    changeSummary,
    authFindings,
    dbFindings,
    depFindings,
    envFindings,
    testFindings,
    hygieneFindings,
    workflowFindings,
    alsoSummary
  );

  return { evidence, receipt, alsoSummary };
}

/**
 * Legacy Compatibility Adapter:
 * Derives legacy WTFReceipt from canonical Protocol v0 evidence.
 *
 * ATTENTION(n) / payAttention is a deprecated compatibility field derived from mechanically
 * observed relations. It does not represent severity, risk, failure, correctness, or
 * canonical WTF policy. Canonical code must never consume ATTENTION as truth.
 *
 * Invariant:
 * Data flows strictly from Canonical Evidence -> Legacy Adapter -> WTFReceipt.
 * Never from legacy structures into canonical truth.
 */
export function toLegacyReceipt(
  evidence: CanonicalEvidenceDocumentV0,
  patches: any[],
  changeSummary: any,
  authFindings: Finding[],
  dbFindings: Finding[],
  depFindings: Finding[],
  envFindings: Finding[],
  testFindings: Finding[],
  hygieneFindings: Finding[],
  workflowFindings: Finding[],
  alsoSummary: string[]
): WTFReceipt {
  const allFindings = [
    ...authFindings,
    ...dbFindings,
    ...testFindings.filter((f) => f.id.includes('test-skipped') || f.id.includes('test-only')),
    ...hygieneFindings.filter((f) => f.id.includes('destructive')),
    ...workflowFindings.filter((f) => f.id.includes('workflow-pr-target')),
    ...depFindings.filter((f) => f.severity === 'CRITICAL'),
  ];

  const payAttention: Finding[] = [];
  const seenTitles = new Set<string>();

  for (const f of allFindings) {
    if (!seenTitles.has(f.title)) {
      payAttention.push(f);
      seenTitles.add(f.title);
    }
  }

  const alsoFindings: Finding[] = [
    ...testFindings.filter((f) => !f.id.includes('test-skipped') && !f.id.includes('test-only')),
    ...depFindings.filter((f) => f.severity !== 'CRITICAL'),
    ...envFindings,
    ...hygieneFindings.filter((f) => !f.id.includes('destructive')),
    ...workflowFindings.filter((f) => !f.id.includes('workflow-pr-target')),
  ];

  const legacyVerification = evidence.verification.items.map(toLegacyVerificationItem);

  const observed: string[] = [];
  const verified: string[] = [];
  const reported: string[] = [];
  const unknown: string[] = [];

  if (evidence.repo.clean) {
    observed.push('Working tree is clean; no uncommitted changes detected.');
  } else {
    observed.push(
      `${changeSummary.totalFiles} files changed: +${changeSummary.linesAdded} / -${changeSummary.linesDeleted} (${changeSummary.meaningfulLines} meaningful lines)`
    );
  }

  for (const f of payAttention) {
    observed.push(`[${f.category}] ${f.title}${f.file ? ` (${f.file})` : ''}`);
  }
  for (const s of alsoSummary) {
    observed.push(s);
  }

  for (const v of legacyVerification) {
    if (v.tier === 'VERIFIED' && v.status === 'PASSED') {
      verified.push(`${v.name}: passed (${v.summary || 'exit 0'}${v.durationMs ? `, ${v.durationMs}ms` : ''})`);
    } else if (v.tier === 'VERIFIED' && v.status === 'FAILED') {
      verified.push(`${v.name}: FAILED (${v.details || 'exit non-zero'})`);
    } else if (v.status === 'TIMEOUT') {
      unknown.push(`${v.name}: TIMEOUT (${v.details || 'execution timed out'})`);
    } else if (v.status === 'INVOCATION_FAILED') {
      unknown.push(`${v.name}: INVOCATION_FAILED (${v.details || 'command could not be spawned'})`);
    } else if (v.lifecycle === 'COMMAND_UNKNOWN' || v.status === 'UNKNOWN') {
      unknown.push(`${v.name}: command unknown (${v.details || 'no runner discovered'})`);
    } else {
      unknown.push(`${v.name}: not verified (run 'wtf verify')`);
    }
  }

  for (const u of evidence.unknown.items) {
    if (!unknown.includes(u.statement)) {
      unknown.push(u.statement);
    }
  }

  const files = patches.map((p) => ({
    path: p.path,
    added: p.added,
    deleted: p.deleted,
    isMechanical: p.isMechanical,
    status: p.status,
  }));

  return {
    spec: 'wtf/0.1',
    timestamp: evidence.timestamp,
    repo: {
      root: evidence.repo.root,
      branch: evidence.repo.branch,
      head: evidence.repo.head,
    },
    change: changeSummary,
    files,
    payAttention,
    also: alsoFindings,
    verification: legacyVerification,
    reported,
    observed,
    verified,
    unknown,
  };
}
