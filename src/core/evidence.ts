import { calculateChangeSummary, collectPatches, getGitContext } from './git.js';
import { detectAuthChanges } from '../detectors/auth.js';
import { detectDatabaseChanges } from '../detectors/db.js';
import { detectDependencyChanges } from '../detectors/deps.js';
import { detectEnvironmentChanges } from '../detectors/env.js';
import { detectTestChanges } from '../detectors/tests.js';
import { detectHygieneIssues } from '../detectors/hygiene.js';
import { detectWorkflowChanges } from '../detectors/workflows.js';
import { getUnverifiedTargets, runVerification } from '../verify/runner.js';
import type { AnalyzeOptions, Finding, VerificationItem, WTFReceipt } from '../types.js';

export interface AnalyzeResult {
  receipt: WTFReceipt;
  alsoSummary: string[];
}

export function analyzeRepo(
  cwd: string = process.cwd(),
  options: AnalyzeOptions & { verify?: boolean } = {}
): AnalyzeResult {
  const ctx = getGitContext(cwd);
  const { patches, status } = collectPatches(ctx, options);
  const change = calculateChangeSummary(patches, status, ctx);

  // Run detectors
  const authFindings = detectAuthChanges(patches);
  const dbFindings = detectDatabaseChanges(patches);
  const { findings: depFindings, summaryItems: depSummary } = detectDependencyChanges(patches, ctx.root);
  const { findings: envFindings, summaryItems: envSummary } = detectEnvironmentChanges(patches);
  const { findings: testFindings, summaryItems: testSummary } = detectTestChanges(patches);
  const { findings: hygieneFindings, summaryItems: hygieneSummary } = detectHygieneIssues(patches);
  const { findings: workflowFindings, summaryItems: workflowSummary } = detectWorkflowChanges(patches);

  const allFindings = [
    ...authFindings,
    ...dbFindings,
    ...testFindings.filter((f) => f.id.includes('test-skipped') || f.id.includes('test-only')),
    ...hygieneFindings.filter((f) => f.severity === 'CRITICAL'),
    ...workflowFindings.filter((f) => f.severity === 'CRITICAL'),
    ...depFindings.filter((f) => f.severity === 'CRITICAL'),
  ];

  // PAY ATTENTION: Sort by severity (CRITICAL first, then WARN)
  const payAttention: Finding[] = [];
  const seenTitles = new Set<string>();

  for (const f of allFindings) {
    if (!seenTitles.has(f.title)) {
      payAttention.push(f);
      seenTitles.add(f.title);
    }
  }

  // ALSO findings (informational items)
  const alsoFindings: Finding[] = [
    ...testFindings.filter((f) => !f.id.includes('test-skipped') && !f.id.includes('test-only')),
    ...depFindings.filter((f) => f.severity !== 'CRITICAL'),
    ...envFindings,
    ...hygieneFindings.filter((f) => f.severity !== 'CRITICAL'),
    ...workflowFindings.filter((f) => f.severity !== 'CRITICAL'),
  ];

  // ALSO compact summary lines for terminal display
  const alsoSummary: string[] = [
    ...depSummary,
    ...envSummary,
    ...testSummary,
    ...hygieneSummary,
    ...workflowSummary,
  ];

  // Verification handling
  let verification: VerificationItem[] = [];
  if (options.verify) {
    verification = runVerification(ctx.root);
  } else {
    verification = getUnverifiedTargets(ctx.root);
  }

  // 4-Tier Categorization
  const observed: string[] = [];
  const verified: string[] = [];
  const reported: string[] = [];
  const unknown: string[] = [];

  // Observed items
  if (change.isClean) {
    observed.push('Working tree is clean; no uncommitted changes detected.');
  } else {
    observed.push(
      `${change.totalFiles} files changed: +${change.linesAdded} / -${change.linesDeleted} (${change.meaningfulLines} meaningful lines)`
    );
  }

  for (const f of payAttention) {
    observed.push(`[${f.category}] ${f.title}${f.file ? ` (${f.file})` : ''}`);
  }
  for (const s of alsoSummary) {
    observed.push(s);
  }

  // Verification items
  for (const v of verification) {
    if (v.status === 'PASSED') {
      verified.push(`${v.name}: passed (${v.summary || 'exit 0'}${v.durationMs ? `, ${v.durationMs}ms` : ''})`);
    } else if (v.status === 'FAILED') {
      verified.push(`${v.name}: FAILED (${v.details || 'exit non-zero'})`);
    } else {
      unknown.push(`${v.name}: not verified (run 'wtf verify')`);
    }
  }

  if (verification.length === 0) {
    unknown.push('No test or typecheck runner discovered in repository');
  }

  const files = patches.map((p) => ({
    path: p.path,
    added: p.added,
    deleted: p.deleted,
    isMechanical: p.isMechanical,
    status: p.status,
  }));

  const receipt: WTFReceipt = {
    spec: 'wtf/0.1',
    timestamp: new Date().toISOString(),
    repo: {
      root: ctx.root,
      branch: ctx.branch,
      head: ctx.headSha,
    },
    change,
    files,
    payAttention,
    also: alsoFindings,
    verification,
    reported,
    observed,
    verified,
    unknown,
  };

  return { receipt, alsoSummary };
}
