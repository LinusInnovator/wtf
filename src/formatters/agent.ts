import type { AnalyzeResult } from '../core/evidence.js';
import type { CanonicalEvidenceDocumentV0 } from '../core/protocol-v0.js';
import { sanitizeForTerminal } from '../core/security.js';

/**
 * Agent Formatter: Deterministic, token-dense, zero-ANSI output designed for coding agents.
 * Exposes repository reality and verification status in a single turn across strict epistemic tiers:
 * - VERIFIED / FAILED (automated test execution)
 * - OBSERVED (factual diff, file changes, and mechanical relations)
 * - UNKNOWN (explicit boundary: intent correctness is unverified)
 * - WTF-RECEIPT (one-line deterministic summary receipt)
 *
 * Epistemic Invariants:
 * 1. Derives directly from CanonicalEvidenceDocumentV0.
 * 2. Neutral evidence organization replaces policy-driven "PAY ATTENTION".
 * 3. Never claims application behavior changed based on mechanical token/path matches alone.
 */
export function formatAgent(input: AnalyzeResult | CanonicalEvidenceDocumentV0): string {
  const doc: CanonicalEvidenceDocumentV0 = 'evidence' in input ? input.evidence : input;
  const legacyReceipt = 'receipt' in input ? input.receipt : undefined;
  const alsoSummary = 'alsoSummary' in input ? input.alsoSummary : [];

  const { change, verification, relation, diagnostic, unknown, repo } = doc;
  const lines: string[] = [];

  const verifItems = verification.items;
  const hasVerification = verifItems.length > 0;
  const anyFailed = verifItems.some(
    (v) => v.status === 'FAILED' || v.lifecycle === 'TESTS_FAILED' || v.lifecycle === 'BUILD_FAILED'
  );

  // 1. VERIFIED / FAILED Section
  if (anyFailed) {
    lines.push('## FAILED');
  } else {
    lines.push('## VERIFIED');
  }

  if (!hasVerification || (verifItems.length === 1 && verifItems[0].lifecycle === 'COMMAND_UNKNOWN')) {
    lines.push('○ No verification targets discovered in repository');
  } else {
    for (const v of verifItems) {
      const name = sanitizeForTerminal(v.name || 'verification');
      const cmd = sanitizeForTerminal(v.command);
      if (v.status === 'PASSED') {
        const summary = v.summary ? ` (${sanitizeForTerminal(v.summary)})` : '';
        const dur = v.durationMs ? ` in ${v.durationMs}ms` : '';
        lines.push(`✓ ${name}: passed${summary}${dur} [${cmd}]`);
      } else if (v.status === 'FAILED' || v.lifecycle === 'TESTS_FAILED' || v.lifecycle === 'BUILD_FAILED') {
        lines.push(`✗ ${name}: FAILED [${cmd}]`);
        if (v.details) {
          const detailLines = sanitizeForTerminal(v.details)
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
            .slice(0, 4);
          for (const dl of detailLines) {
            lines.push(`  > ${dl}`);
          }
        }
      } else if (v.status === 'TIMEOUT' || v.lifecycle === 'TIMEOUT') {
        lines.push(`? ${name}: TIMEOUT [${cmd}]`);
        if (v.details) {
          lines.push(`  > ${sanitizeForTerminal(v.details)}`);
        }
      } else if (v.lifecycle === 'INVOCATION_FAILED') {
        lines.push(`? ${name}: INVOCATION_FAILED [${cmd}]`);
        if (v.details) {
          lines.push(`  > ${sanitizeForTerminal(v.details)}`);
        }
      } else if (v.lifecycle === 'NOT_RUN') {
        lines.push(`○ ${name}: not run [${cmd}]`);
      } else if (v.lifecycle === 'COMMAND_UNKNOWN' || v.status === 'UNKNOWN') {
        lines.push(`○ ${name}: command unknown [${cmd}]`);
      } else {
        lines.push(`○ ${name}: unverified [${cmd}]`);
      }
    }
  }
  lines.push('');

  // 2. OBSERVED (Repository, Working Tree, Mechanical Relations, and Diagnostics)
  lines.push('## OBSERVED');
  if (change.status === 'none observed' || change.files.length === 0) {
    lines.push('Working tree clean; no uncommitted changes.');
  } else {
    const isProtocolConfig = (f: { file: string; isMechanical?: boolean }) =>
      Boolean(f.isMechanical) &&
      /(^|\/)(AGENTS\.md|CLAUDE\.md|\.cursorrules|\.github\/copilot-instructions\.md)$/i.test(f.file);

    const appFiles = change.files.filter((f) => !isProtocolConfig(f));
    const protocolFiles = change.files.filter((f) => isProtocolConfig(f));

    const totalLinesAdded = change.files.reduce((acc, f) => acc + f.additions, 0);
    const totalLinesDeleted = change.files.reduce((acc, f) => acc + f.deletions, 0);

    if (appFiles.length > 0) {
      const meaningfulStr = change.meaningfulLines !== undefined ? ` (${change.meaningfulLines} meaningful lines)` : '';
      lines.push(
        `${appFiles.length} application ${appFiles.length === 1 ? 'file' : 'files'} changed: +${totalLinesAdded} / -${totalLinesDeleted}${meaningfulStr}`
      );
      for (const f of appFiles.slice(0, 8)) {
        const p = sanitizeForTerminal(f.file);
        lines.push(`  • ${p} (+${f.additions}/-${f.deletions})`);
      }
      if (appFiles.length > 8) {
        lines.push(`  ... and ${appFiles.length - 8} more files`);
      }
    } else if (protocolFiles.length > 0) {
      lines.push('Working tree contains only WTF agent protocol configuration.');
      for (const f of protocolFiles) {
        lines.push(`  • [protocol] ${sanitizeForTerminal(f.file)} (+${f.additions}/-${f.deletions})`);
      }
    }

    // Mechanical Relations (neutral observed facts)
    if (relation.items.length > 0) {
      lines.push('');
      lines.push('Observed relations:');
      for (const rel of relation.items.slice(0, 10)) {
        const tag =
          rel.predicate === 'intersects_auth_surface'
            ? 'auth-surface'
            : rel.predicate === 'declares_schema_operation'
            ? 'schema'
            : rel.predicate === 'declares_skipped_test'
            ? 'test-skip'
            : rel.predicate === 'declares_dependency'
            ? 'dependency'
            : rel.predicate === 'triggers_workflow'
            ? 'workflow'
            : 'relation';
        const loc = rel.subject?.file
          ? ` (${sanitizeForTerminal(rel.subject.file)}${rel.subject.line ? `:${rel.subject.line}` : ''})`
          : '';
        lines.push(`  • [${tag}] ${sanitizeForTerminal(rel.statement)}${loc}`);
      }
      if (relation.items.length > 10) {
        lines.push(`  ... and ${relation.items.length - 10} more relations`);
      }
    }

    // Informational summary lines if present
    if (alsoSummary && alsoSummary.length > 0) {
      for (const item of alsoSummary.slice(0, 5)) {
        lines.push(`  ${sanitizeForTerminal(item)}`);
      }
    }
  }
  lines.push('');

  // 3. UNKNOWN (Preserve epistemic humility)
  lines.push('## UNKNOWN');
  for (const u of unknown.items) {
    lines.push(`- ${sanitizeForTerminal(u.statement)}`);
  }
  lines.push('');

  // 4. RECEIPT (One-line deterministic summary receipt)
  const baseSha = (repo.head || 'unknown').slice(0, 7);
  const totalVerif = verifItems.length;
  const passedVerif = verifItems.filter((v) => v.status === 'PASSED').length;
  const failedVerif = verifItems.filter(
    (v) => v.status === 'FAILED' || v.lifecycle === 'TESTS_FAILED' || v.lifecycle === 'BUILD_FAILED'
  ).length;

  let verifStatusStr = 'NO_CHECKS';
  if (totalVerif > 0) {
    if (failedVerif > 0) {
      verifStatusStr = `FAILED (${failedVerif}/${totalVerif})`;
    } else if (passedVerif === totalVerif) {
      verifStatusStr = `VERIFIED (${passedVerif}/${totalVerif})`;
    } else {
      verifStatusStr = `PARTIAL (${passedVerif}/${totalVerif})`;
    }
  }

  // -------------------------------------------------------------------------
  // RECEIPT COMPATIBILITY BOUNDARY:
  // ATTENTION(n) is a deprecated compatibility field derived from mechanically
  // observed relations. It does not represent severity, risk, failure,
  // correctness, or canonical WTF policy. Canonical code must never consume
  // ATTENTION as truth.
  //
  // Future Protocol v0 direction (planned canonical receipt):
  // WTF-RECEIPT: protocol-v0 | base:${baseSha} | VERIFIED (${passedVerif}) | RELATIONS (${relation.items.length}) | OBSERVED (+${totalLinesAdded}/-${totalLinesDeleted}, ${totalFiles}f) | UNKNOWN (${unknown.items.length})
  // -------------------------------------------------------------------------
  const notableRelationsCount = relation.items.filter((r) =>
    ['intersects_auth_surface', 'declares_schema_operation', 'declares_skipped_test'].includes(r.predicate)
  ).length;
  const attentionCount = legacyReceipt ? legacyReceipt.payAttention.length : notableRelationsCount;

  const totalFiles = change.files.length;
  const totalLinesAdded = change.files.reduce((acc, f) => acc + f.additions, 0);
  const totalLinesDeleted = change.files.reduce((acc, f) => acc + f.deletions, 0);

  const attentionStr = `ATTENTION (${attentionCount})`;
  const observedStr =
    change.status === 'none observed' || totalFiles === 0
      ? 'OBSERVED (clean)'
      : `OBSERVED (+${totalLinesAdded}/-${totalLinesDeleted}, ${totalFiles}f)`;

  lines.push(`WTF-RECEIPT: v0.1 | base:${baseSha} | ${verifStatusStr} | ${attentionStr} | ${observedStr}`);

  return lines.join('\n');
}
