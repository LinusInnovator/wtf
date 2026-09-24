import type { AnalyzeResult } from '../core/evidence.js';
import type { CanonicalEvidenceDocumentV0 } from '../core/protocol-v0.js';
import { sanitizeForTerminal } from '../core/security.js';
import { buildPathTree, renderPathTreeMarkdown } from '../core/path-tree.js';

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
      const tree = buildPathTree(appFiles);
      const clusterNote =
        tree.clusters.length > 1 && appFiles.length > 4
          ? ` across ${tree.clusters.length} directory clusters`
          : '';
      const meaningfulStr =
        change.meaningfulLines !== undefined
          ? ` (${change.meaningfulLines} meaningful lines${clusterNote})`
          : clusterNote
          ? ` (${clusterNote.trim()})`
          : '';
      lines.push(
        `${appFiles.length} application ${appFiles.length === 1 ? 'file' : 'files'} changed: +${totalLinesAdded} / -${totalLinesDeleted}${meaningfulStr}`
      );

      const treeLines = renderPathTreeMarkdown(tree, { smallFileThreshold: 4 });
      for (const tl of treeLines) {
        lines.push(tl);
      }
    } else if (protocolFiles.length > 0) {
      lines.push('Working tree contains only WTF agent protocol configuration.');
      for (const f of protocolFiles) {
        lines.push(`  • [protocol] ${sanitizeForTerminal(f.file)} (+${f.additions}/-${f.deletions})`);
      }
    }

    // Mechanical Relations (neutral observed facts with deterministic repetition aggregation)
    if (relation.items.length > 0) {
      lines.push('');
      lines.push('Observed relations:');

      const byPredicate = new Map<string, typeof relation.items>();
      for (const rel of relation.items) {
        const list = byPredicate.get(rel.predicate) || [];
        list.push(rel);
        byPredicate.set(rel.predicate, list);
      }

      for (const [pred, items] of byPredicate.entries()) {
        const tag =
          pred === 'intersects_auth_surface'
            ? 'auth-surface'
            : pred === 'declares_schema_operation'
            ? 'schema'
            : pred === 'declares_skipped_test'
            ? 'test-skip'
            : pred === 'declares_dependency'
            ? 'dependency'
            : pred === 'triggers_workflow'
            ? 'workflow'
            : 'relation';

        if (items.length === 1) {
          const rel = items[0];
          const loc = rel.subject?.file
            ? ` (${sanitizeForTerminal(rel.subject.file)}${rel.subject.line ? `:${rel.subject.line}` : ''})`
            : '';
          lines.push(`  • [${tag}] ${sanitizeForTerminal(rel.statement)}${loc}`);
        } else if (pred === 'declares_skipped_test') {
          const fileCountMap = new Map<string, number>();
          const lineNumbers: number[] = [];
          for (const item of items) {
            if (item.subject?.file) {
              fileCountMap.set(item.subject.file, (fileCountMap.get(item.subject.file) || 0) + 1);
            }
            if (item.subject?.line) {
              lineNumbers.push(item.subject.line);
            }
          }
          const uniqueFiles = Array.from(fileCountMap.keys()).sort();
          const locStr =
            uniqueFiles.length === 1
              ? ` in ${sanitizeForTerminal(uniqueFiles[0])}${lineNumbers.length > 0 ? ` (lines ${lineNumbers.join(', ')})` : ''}`
              : ` across ${uniqueFiles.length} files`;
          lines.push(`  • [${tag}] ${items.length} skipped tests${locStr}`);
        } else if (items.length > 2 || pred === 'intersects_auth_surface') {
          // Aggregate repeated instances deterministically
          const fileCountMap = new Map<string, number>();
          for (const item of items) {
            if (item.subject?.file) {
              fileCountMap.set(item.subject.file, (fileCountMap.get(item.subject.file) || 0) + 1);
            }
          }

          const uniqueFiles = Array.from(fileCountMap.keys()).sort();
          if (pred === 'intersects_auth_surface') {
            const fileSummary =
              uniqueFiles.length <= 3
                ? uniqueFiles.map((f) => `${sanitizeForTerminal(f)} (${fileCountMap.get(f)})`).join(', ')
                : `${uniqueFiles.length} files (${uniqueFiles.slice(0, 3).map((f) => sanitizeForTerminal(f)).join(', ')}...)`;
            lines.push(`  • [${tag}] ${items.length} token matches across ${fileSummary}`);
          } else {
            const fileSummary =
              uniqueFiles.length <= 3
                ? uniqueFiles.map((f) => sanitizeForTerminal(f)).join(', ')
                : `${uniqueFiles.length} files`;
            lines.push(`  • [${tag}] ${items.length} occurrences across ${fileSummary}`);
          }
        } else {
          // <= 2 distinct items for general predicates: print directly to preserve statements
          for (const rel of items) {
            const loc = rel.subject?.file
              ? ` (${sanitizeForTerminal(rel.subject.file)}${rel.subject.line ? `:${rel.subject.line}` : ''})`
              : '';
            lines.push(`  • [${tag}] ${sanitizeForTerminal(rel.statement)}${loc}`);
          }
        }
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
