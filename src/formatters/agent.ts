import type { AnalyzeResult } from '../core/evidence.js';
import { sanitizeForTerminal } from '../core/security.js';

/**
 * Agent Formatter: Deterministic, token-dense, zero-ANSI output designed for coding agents.
 * Exposes repository reality and verification status in a single turn across strict epistemic tiers:
 * - VERIFIED / FAILED (automated test execution)
 * - PAY ATTENTION (critical static findings: auth, migrations, skipped tests)
 * - OBSERVED (factual diff & file changes)
 * - UNKNOWN (explicit boundary: intent correctness is unverified)
 * - WTF-RECEIPT (one-line deterministic summary receipt)
 */
export function formatAgent(result: AnalyzeResult): string {
  const { receipt, alsoSummary } = result;
  const { change, payAttention, verification, files } = receipt;
  const lines: string[] = [];

  const hasVerification = verification.length > 0;
  const anyFailed = verification.some((v) => v.status === 'FAILED');

  // 1. VERIFIED / FAILED
  if (anyFailed) {
    lines.push('## FAILED');
  } else {
    lines.push('## VERIFIED');
  }

  if (!hasVerification) {
    lines.push('○ No verification targets discovered in repository');
  } else {
    for (const v of verification) {
      const name = sanitizeForTerminal(v.name);
      const cmd = sanitizeForTerminal(v.command);
      if (v.status === 'PASSED') {
        const summary = v.summary ? ` (${sanitizeForTerminal(v.summary)})` : '';
        const dur = v.durationMs ? ` in ${v.durationMs}ms` : '';
        lines.push(`✓ ${name}: passed${summary}${dur} [${cmd}]`);
      } else if (v.status === 'FAILED') {
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
      } else if (v.status === 'SKIPPED') {
        lines.push(`○ ${name}: skipped [${cmd}]`);
      } else {
        lines.push(`○ ${name}: not run [${cmd}]`);
      }
    }
  }
  lines.push('');

  // 2. PAY ATTENTION (Critical items requiring agent notice or resolution)
  if (payAttention.length > 0) {
    lines.push('## PAY ATTENTION');
    for (const f of payAttention) {
      const cat = sanitizeForTerminal(f.category);
      const title = sanitizeForTerminal(f.title);
      const loc = f.file ? ` (${sanitizeForTerminal(f.file)}${f.line ? `:${f.line}` : ''})` : '';
      lines.push(`- [${cat}] ${title}${loc}`);
      if (f.snippet) {
        lines.push(`  > ${sanitizeForTerminal(f.snippet).trim()}`);
      }
    }
    lines.push('');
  }

  // 3. OBSERVED (Repository & Working Tree Changes)
  lines.push('## OBSERVED');
  if (change.isClean) {
    lines.push('Working tree clean; no uncommitted changes.');
  } else {
    // Separate application files from WTF-generated protocol/configuration files
    const isProtocolConfig = (f: { path: string; isMechanical: boolean }) =>
      f.isMechanical && /(^|\/)(AGENTS\.md|CLAUDE\.md|\.cursorrules|\.github\/copilot-instructions\.md)$/i.test(f.path);

    const appFiles = (files || []).filter((f) => !isProtocolConfig(f));
    const protocolFiles = (files || []).filter((f) => isProtocolConfig(f));

    if (appFiles.length > 0) {
      lines.push(
        `${appFiles.length} application ${appFiles.length === 1 ? 'file' : 'files'} changed: +${change.linesAdded} / -${change.linesDeleted} (${change.meaningfulLines} meaningful lines)`
      );
      for (const f of appFiles.slice(0, 8)) {
        const p = sanitizeForTerminal(f.path);
        const tag = f.isMechanical ? ' [mechanical]' : '';
        lines.push(`  • ${p} (+${f.added}/-${f.deleted})${tag}`);
      }
      if (appFiles.length > 8) {
        lines.push(`  ... and ${appFiles.length - 8} more files`);
      }
    } else if (protocolFiles.length > 0) {
      lines.push('Working tree contains only WTF agent protocol configuration.');
      for (const f of protocolFiles) {
        lines.push(`  • [protocol] ${sanitizeForTerminal(f.path)} (+${f.added}/-${f.deleted})`);
      }
    } else {
      lines.push(
        `${change.totalFiles} files changed: +${change.linesAdded} / -${change.linesDeleted} (${change.meaningfulLines} meaningful lines)`
      );
    }

    if (alsoSummary && alsoSummary.length > 0) {
      for (const item of alsoSummary.slice(0, 5)) {
        lines.push(`  ${sanitizeForTerminal(item)}`);
      }
    }
  }
  lines.push('');

  // 4. UNKNOWN (Preserve epistemic humility)
  lines.push('## UNKNOWN');
  lines.push('- Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)');
  if (!hasVerification) {
    lines.push('- Verification: no automated test runner discovered in repository');
  } else {
    for (const v of verification) {
      if (v.status === 'NOT_RUN') {
        lines.push(`- ${sanitizeForTerminal(v.name)}: unverified (not run)`);
      }
    }
  }
  lines.push('');

  // 5. RECEIPT (One-line deterministic summary receipt)
  const baseSha = (receipt.repo.head || 'unknown').slice(0, 7);
  const totalVerif = verification.length;
  const passedVerif = verification.filter((v) => v.status === 'PASSED').length;
  const failedVerif = verification.filter((v) => v.status === 'FAILED').length;

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

  const attentionStr = `ATTENTION (${payAttention.length})`;
  const observedStr = change.isClean
    ? 'OBSERVED (clean)'
    : `OBSERVED (+${change.linesAdded}/-${change.linesDeleted}, ${change.totalFiles}f)`;

  lines.push(`WTF-RECEIPT: v0.1 | base:${baseSha} | ${verifStatusStr} | ${attentionStr} | ${observedStr}`);

  return lines.join('\n');
}
