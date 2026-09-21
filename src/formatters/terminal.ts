import type { AnalyzeResult } from '../core/evidence.js';
import type { CanonicalEvidenceDocumentV0 } from '../core/protocol-v0.js';
import { sanitizeForTerminal } from '../core/security.js';

// ANSI color helpers with NO_COLOR support
const useColor = !process.env.NO_COLOR && process.stdout.isTTY !== false;

const c = {
  reset: useColor ? '\x1b[0m' : '',
  bold: useColor ? '\x1b[1m' : '',
  dim: useColor ? '\x1b[2m' : '',
  underline: useColor ? '\x1b[4m' : '',
  green: useColor ? '\x1b[32m' : '',
  yellow: useColor ? '\x1b[33m' : '',
  red: useColor ? '\x1b[31m' : '',
  cyan: useColor ? '\x1b[36m' : '',
  gray: useColor ? '\x1b[90m' : '',
  magenta: useColor ? '\x1b[35m' : '',
  blue: useColor ? '\x1b[34m' : '',
};

/**
 * Terminal Formatter: Human-facing output consuming canonical Protocol v0 evidence.
 * Answers: What happened, what was verified, and what remains unknown?
 *
 * Epistemic Invariants:
 * 1. Derives directly from CanonicalEvidenceDocumentV0.
 * 2. Replaces policy-driven "PAY ATTENTION" with neutral observed relations.
 * 3. Never strengthens mechanical token/path matches into causal behavioral claims.
 */
export function formatTerminal(input: AnalyzeResult | CanonicalEvidenceDocumentV0): string {
  const doc: CanonicalEvidenceDocumentV0 = 'evidence' in input ? input.evidence : input;
  const legacyReceipt = 'receipt' in input ? input.receipt : undefined;
  const alsoSummary = 'alsoSummary' in input ? input.alsoSummary : [];

  const { change, verification, relation, repo } = doc;
  const lines: string[] = [];

  // Title & Header
  lines.push(`${c.bold}${c.cyan}WTF${c.reset} — ${c.bold}what just happened?${c.reset}`);

  const totalFiles = change.files.length;
  const totalLinesAdded = change.files.reduce((acc, f) => acc + f.additions, 0);
  const totalLinesDeleted = change.files.reduce((acc, f) => acc + f.deletions, 0);

  if (change.status === 'none observed' || totalFiles === 0) {
    lines.push(
      `${c.dim}Working tree is clean${c.reset} · ${c.gray}HEAD at ${repo.head ? repo.head.slice(0, 7) : 'initial'}${c.reset}`
    );
  } else {
    const fileWord = totalFiles === 1 ? 'file' : 'files';
    lines.push(
      `${totalFiles} ${fileWord} changed · ${c.green}+${totalLinesAdded.toLocaleString()}${c.reset} / ${c.red}-${totalLinesDeleted.toLocaleString()}${c.reset}`
    );
  }
  lines.push('');

  // 1. VERIFIED Section
  lines.push(`${c.bold}VERIFIED${c.reset}`);
  const verifItems = verification.items;

  if (verifItems.length === 0) {
    lines.push(`  ${c.gray}○ No verification targets discovered in repo${c.reset}`);
  } else {
    const hasRun = verifItems.some((v) => v.lifecycle !== 'NOT_RUN' && v.lifecycle !== 'NONE');
    if (!hasRun) {
      lines.push(`  ${c.gray}○ Tests not yet run · Run ${c.reset}${c.cyan}wtf verify${c.reset}${c.gray} to validate${c.reset}`);
      for (const v of verifItems) {
        lines.push(`    ${c.dim}${sanitizeForTerminal(v.name || 'verification')}${c.reset} ${c.gray}(${sanitizeForTerminal(v.command)})${c.reset}`);
      }
    } else {
      for (const v of verifItems) {
        const name = sanitizeForTerminal(v.name || 'verification').padEnd(11);
        if (v.status === 'PASSED') {
          const summaryStr = v.summary ? `       ${sanitizeForTerminal(v.summary)}` : '';
          const durationStr = v.durationMs ? ` ${c.gray}(${v.durationMs}ms)${c.reset}` : '';
          lines.push(`  ${c.green}✓${c.reset} ${name}${summaryStr}${durationStr}`);
        } else if (v.status === 'FAILED' || v.lifecycle === 'TESTS_FAILED' || v.lifecycle === 'BUILD_FAILED') {
          lines.push(`  ${c.red}✗${c.reset} ${name} ${c.red}FAILED${c.reset}`);
          if (v.details) {
            const detailLines = v.details.split('\n').slice(0, 3);
            for (const dl of detailLines) {
              lines.push(`    ${c.dim}${sanitizeForTerminal(dl)}${c.reset}`);
            }
          }
        } else if (v.status === 'TIMEOUT' || v.lifecycle === 'TIMEOUT') {
          lines.push(`  ${c.yellow}?${c.reset} ${name} ${c.yellow}TIMEOUT${c.reset}`);
          if (v.details) {
            lines.push(`    ${c.dim}${sanitizeForTerminal(v.details)}${c.reset}`);
          }
        } else if (v.lifecycle === 'INVOCATION_FAILED') {
          lines.push(`  ${c.yellow}?${c.reset} ${name} ${c.yellow}INVOCATION_FAILED${c.reset}`);
          if (v.details) {
            lines.push(`    ${c.dim}${sanitizeForTerminal(v.details)}${c.reset}`);
          }
        } else {
          lines.push(`  ${c.gray}○${c.reset} ${name} ${c.gray}skipped${c.reset}`);
        }
      }
    }
  }
  lines.push('');

  // 2. FILES Section (compact changed files list)
  if (change.status !== 'none observed' && change.files.length > 0) {
    lines.push(`${c.bold}FILES${c.reset}`);
    const displayFiles = change.files.slice(0, 6);
    for (const f of displayFiles) {
      const icon = f.operation === 'CREATED' ? `${c.green}+${c.reset}` : f.operation === 'DELETED' ? `${c.red}-${c.reset}` : `${c.cyan}•${c.reset}`;
      const safePath = sanitizeForTerminal(f.file);
      const stats = `${c.green}+${f.additions}${c.reset}/${c.red}-${f.deletions}${c.reset}`;
      lines.push(`  ${icon} ${safePath.padEnd(35)} ${c.dim}${stats}${c.reset}`);
    }
    if (change.files.length > 6) {
      lines.push(`  ${c.dim}... and ${change.files.length - 6} more files. Run \`wtf show\` for full list.${c.reset}`);
    }
    lines.push('');
  }

  // 3. OBSERVED RELATIONS (Neutral mechanical classifications replacing legacy PAY ATTENTION)
  if (relation.items.length > 0) {
    lines.push(`${c.bold}OBSERVED RELATIONS${c.reset}`);
    for (const rel of relation.items.slice(0, 8)) {
      const categoryTag =
        rel.predicate === 'intersects_auth_surface'
          ? `${c.cyan}[AUTH]${c.reset}`
          : rel.predicate === 'declares_schema_operation'
          ? `${c.magenta}[DATABASE]${c.reset}`
          : rel.predicate === 'declares_skipped_test'
          ? `${c.yellow}[TESTS]${c.reset}`
          : rel.predicate === 'declares_dependency'
          ? `${c.green}[DEPS]${c.reset}`
          : rel.predicate === 'triggers_workflow'
          ? `${c.blue ? c.blue : c.cyan}[WORKFLOW]${c.reset}`
          : `${c.dim}[RELATION]${c.reset}`;

      const loc = rel.subject?.file
        ? ` ${c.dim}(${sanitizeForTerminal(rel.subject.file)}${rel.subject.line ? `:${rel.subject.line}` : ''})${c.reset}`
        : '';
      lines.push(`  • ${categoryTag} ${sanitizeForTerminal(rel.statement)}${loc}`);
    }
    if (relation.items.length > 8) {
      lines.push(`  ${c.dim}... and ${relation.items.length - 8} more observed relations.${c.reset}`);
    }
    lines.push('');
  }

  // 4. ALSO Section (compact fact summary from package managers / env / tests)
  if (alsoSummary.length > 0) {
    lines.push(`${c.bold}ALSO${c.reset}`);
    for (const item of alsoSummary) {
      if (item.startsWith('⚠')) {
        lines.push(`  ${c.yellow}${item}${c.reset}`);
      } else if (item.startsWith('+')) {
        lines.push(`  ${c.green}${item}${c.reset}`);
      } else if (item.startsWith('-')) {
        lines.push(`  ${c.red}${item}${c.reset}`);
      } else {
        lines.push(`  ${c.dim}${item}${c.reset}`);
      }
    }
    lines.push('');
  }

  // 5. Review Surface Compression
  if (change.status !== 'none observed' && totalFiles > 0) {
    const totalLinesChanged = totalLinesAdded + totalLinesDeleted;
    const meaningful = change.meaningfulLines ?? totalLinesChanged;
    const mechanicalLines = totalLinesChanged - meaningful;

    if (mechanicalLines > 0 && totalLinesChanged > 0) {
      const pct = ((mechanicalLines / totalLinesChanged) * 100).toFixed(1);
      lines.push(`${c.dim}Most changes appear mechanical/generated.${c.reset}`);
      lines.push(`${c.bold}Review surface:${c.reset}`);
      lines.push(
        `  ~${c.cyan}${c.bold}${meaningful.toLocaleString()}${c.reset} meaningful lines / ${totalLinesChanged.toLocaleString()} changed ${c.dim}(${pct}% compressed)${c.reset}`
      );
    } else {
      lines.push(`${c.bold}Review surface:${c.reset}`);
      lines.push(
        `  ~${c.cyan}${c.bold}${meaningful.toLocaleString()}${c.reset} meaningful lines across ${totalFiles} ${totalFiles === 1 ? 'file' : 'files'}`
      );
    }
    lines.push('');
  }

  // Call to action
  if (change.status !== 'none observed') {
    lines.push(`${c.dim}Run ${c.reset}${c.cyan}wtf show${c.reset}${c.dim} for evidence details.${c.reset}`);
  }

  return lines.join('\n');
}
