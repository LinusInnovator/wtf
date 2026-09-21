import type { AnalyzeResult } from '../core/evidence.js';
import type { CanonicalEvidenceDocumentV0 } from '../core/protocol-v0.js';
import { sanitizeForTerminal } from '../core/security.js';

const useColor = !process.env.NO_COLOR && process.stdout.isTTY !== false;

const c = {
  reset: useColor ? '\x1b[0m' : '',
  bold: useColor ? '\x1b[1m' : '',
  dim: useColor ? '\x1b[2m' : '',
  green: useColor ? '\x1b[32m' : '',
  yellow: useColor ? '\x1b[33m' : '',
  red: useColor ? '\x1b[31m' : '',
  cyan: useColor ? '\x1b[36m' : '',
  gray: useColor ? '\x1b[90m' : '',
};

/**
 * Show Formatter: Detailed evidence ledger consuming canonical Protocol v0 evidence.
 */
export function formatShow(input: AnalyzeResult | CanonicalEvidenceDocumentV0): string {
  const doc: CanonicalEvidenceDocumentV0 = 'evidence' in input ? input.evidence : input;
  const { repo, relation, diagnostic, verification, unknown } = doc;
  const lines: string[] = [];

  lines.push(`${c.bold}${c.cyan}WTF SHOW${c.reset} — Detailed Evidence Ledger (Protocol v0)`);
  lines.push(`${c.dim}Repo: ${sanitizeForTerminal(repo.root)} | Head: ${sanitizeForTerminal(repo.head || 'none')}${c.reset}`);
  lines.push('');

  // 1. Observed Relations
  if (relation.items.length > 0) {
    lines.push(`${c.bold}${c.cyan}═══ OBSERVED RELATIONS (${relation.items.length}) ═══${c.reset}`);
    lines.push('');
    for (let i = 0; i < relation.items.length; i++) {
      const item = relation.items[i];
      lines.push(`${c.bold}${i + 1}. ${sanitizeForTerminal(item.statement)}${c.reset}`);
      lines.push(`   ${c.dim}Predicate:${c.reset} ${sanitizeForTerminal(item.predicate)} | ${c.dim}Provenance:${c.reset} ${item.provenance}`);
      if (item.subject?.file) {
        lines.push(`   ${c.dim}Location:${c.reset}  ${sanitizeForTerminal(item.subject.file)}${item.subject.line ? `:${item.subject.line}` : ''}`);
      }
      lines.push('');
    }
  }

  // 2. Diagnostics
  if (diagnostic.items.length > 0) {
    lines.push(`${c.bold}═══ REPORTED DIAGNOSTICS (${diagnostic.items.length}) ═══${c.reset}`);
    lines.push('');
    for (const item of diagnostic.items) {
      lines.push(`• [${sanitizeForTerminal(item.tool)}] ${c.bold}${sanitizeForTerminal(item.message)}${c.reset}`);
      if (item.file) {
        lines.push(`  ${c.dim}${sanitizeForTerminal(item.file)}${item.line ? `:${item.line}` : ''}${c.reset}`);
      }
      if (item.rawText && item.rawText !== item.message) {
        lines.push(`  ${c.gray}${sanitizeForTerminal(item.rawText)}${c.reset}`);
      }
      lines.push('');
    }
  }

  // 3. Verification
  lines.push(`${c.bold}═══ VERIFICATION STATUS ═══${c.reset}`);
  for (const v of verification.items) {
    const statusColor = v.status === 'PASSED' ? c.green : v.status === 'FAILED' ? c.red : c.yellow;
    lines.push(`• ${sanitizeForTerminal(v.name || 'verification')}: ${statusColor}${v.lifecycle}${c.reset} ${c.dim}(tier: ${v.tier})${c.reset}`);
    lines.push(`  Command: ${sanitizeForTerminal(v.command)}`);
    if (v.details) {
      lines.push(`  Details: ${sanitizeForTerminal(v.details)}`);
    }
  }
  lines.push('');

  // 4. Unknown Boundaries
  if (unknown.items.length > 0) {
    lines.push(`${c.bold}═══ UNKNOWN BOUNDARIES ═══${c.reset}`);
    for (const u of unknown.items) {
      lines.push(`- ${sanitizeForTerminal(u.statement)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
