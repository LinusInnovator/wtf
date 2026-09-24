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
 * Supports lossless secondary drill-down into specific paths or clusters.
 */
export function formatShow(
  input: AnalyzeResult | CanonicalEvidenceDocumentV0,
  filterPath?: string
): string {
  const doc: CanonicalEvidenceDocumentV0 = 'evidence' in input ? input.evidence : input;
  const { repo, change, relation, diagnostic, verification, unknown } = doc;
  const lines: string[] = [];

  const filterNormalized = filterPath ? filterPath.replace(/\\/g, '/').replace(/^\/+/, '') : undefined;
  const filterDesc = filterNormalized ? ` [filter: ${sanitizeForTerminal(filterNormalized)}]` : '';

  lines.push(`${c.bold}${c.cyan}WTF SHOW${c.reset} — Detailed Evidence Ledger (Protocol v0)${filterDesc}`);
  lines.push(`${c.dim}Repo: ${sanitizeForTerminal(repo.root)} | Head: ${sanitizeForTerminal(repo.head || 'none')}${c.reset}`);
  lines.push('');

  // 1. Observed Relations
  const matchedRelations = filterNormalized
    ? relation.items.filter((item) => !item.subject?.file || item.subject.file.startsWith(filterNormalized))
    : relation.items;

  if (matchedRelations.length > 0) {
    lines.push(
      `${c.bold}${c.cyan}═══ OBSERVED RELATIONS (${matchedRelations.length}${filterNormalized ? ` matching '${filterNormalized}'` : ''}) ═══${c.reset}`
    );
    lines.push('');
    for (let i = 0; i < matchedRelations.length; i++) {
      const item = matchedRelations[i];
      lines.push(`${c.bold}${i + 1}. ${sanitizeForTerminal(item.statement)}${c.reset}`);
      lines.push(`   ${c.dim}Predicate:${c.reset} ${sanitizeForTerminal(item.predicate)} | ${c.dim}Provenance:${c.reset} ${item.provenance}`);
      if (item.subject?.file) {
        lines.push(`   ${c.dim}Location:${c.reset}  ${sanitizeForTerminal(item.subject.file)}${item.subject.line ? `:${item.subject.line}` : ''}`);
      }
      lines.push('');
    }
  }

  // 2. Diagnostics
  const matchedDiagnostics = filterNormalized
    ? diagnostic.items.filter((item) => !item.file || item.file.startsWith(filterNormalized))
    : diagnostic.items;

  if (matchedDiagnostics.length > 0) {
    lines.push(
      `${c.bold}═══ REPORTED DIAGNOSTICS (${matchedDiagnostics.length}${filterNormalized ? ` matching '${filterNormalized}'` : ''}) ═══${c.reset}`
    );
    lines.push('');
    for (const item of matchedDiagnostics) {
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

  // 5. Changed Files Detail (Lossless Retrieval)
  if (change.files.length > 0) {
    const matchedFiles = filterNormalized
      ? change.files.filter((f) => f.file.startsWith(filterNormalized))
      : change.files;

    lines.push(
      `${c.bold}═══ CHANGED FILES (${matchedFiles.length}${filterNormalized ? ` matching '${filterNormalized}'` : ''}) ═══${c.reset}`
    );
    for (const f of matchedFiles) {
      lines.push(`  • ${sanitizeForTerminal(f.file)} (+${f.additions}/-${f.deletions})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

