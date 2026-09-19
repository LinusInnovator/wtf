import type { AnalyzeResult } from '../core/evidence.js';
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
};

export function formatTerminal(result: AnalyzeResult): string {
  const { receipt, alsoSummary } = result;
  const { change, payAttention, verification } = receipt;
  const lines: string[] = [];

  // Title & Header
  lines.push(`${c.bold}${c.cyan}WTF${c.reset} — ${c.bold}what just happened?${c.reset}`);

  if (change.isClean) {
    lines.push(
      `${c.dim}Working tree is clean${c.reset} · ${c.gray}HEAD at ${change.headSha || 'initial'}${c.reset}`
    );
  } else {
    const fileWord = change.totalFiles === 1 ? 'file' : 'files';
    lines.push(
      `${change.totalFiles} ${fileWord} changed · ${c.green}+${change.linesAdded.toLocaleString()}${c.reset} / ${c.red}-${change.linesDeleted.toLocaleString()}${c.reset}`
    );
  }
  lines.push('');

  // 1. VERIFIED Section
  lines.push(`${c.bold}VERIFIED${c.reset}`);
  if (verification.length === 0) {
    lines.push(`  ${c.gray}○ No verification targets discovered in repo${c.reset}`);
  } else {
    const hasRun = verification.some((v) => v.status !== 'NOT_RUN');
    if (!hasRun) {
      lines.push(`  ${c.gray}○ Tests not yet run · Run ${c.reset}${c.cyan}wtf verify${c.reset}${c.gray} to validate${c.reset}`);
      for (const v of verification) {
        lines.push(`    ${c.dim}${sanitizeForTerminal(v.name)}${c.reset} ${c.gray}(${sanitizeForTerminal(v.command)})${c.reset}`);
      }
    } else {
      for (const v of verification) {
        if (v.status === 'PASSED') {
          const summaryStr = v.summary ? `       ${sanitizeForTerminal(v.summary)}` : '';
          const durationStr = v.durationMs ? ` ${c.gray}(${v.durationMs}ms)${c.reset}` : '';
          lines.push(`  ${c.green}✓${c.reset} ${sanitizeForTerminal(v.name).padEnd(11)}${summaryStr}${durationStr}`);
        } else if (v.status === 'FAILED') {
          lines.push(`  ${c.red}✗${c.reset} ${sanitizeForTerminal(v.name).padEnd(11)} ${c.red}FAILED${c.reset}`);
          if (v.details) {
            const detailLines = v.details.split('\n').slice(0, 3);
            for (const dl of detailLines) {
              lines.push(`    ${c.dim}${sanitizeForTerminal(dl)}${c.reset}`);
            }
          }
        } else {
          lines.push(`  ${c.gray}○${c.reset} ${sanitizeForTerminal(v.name).padEnd(11)} ${c.gray}skipped${c.reset}`);
        }
      }
    }
  }
  lines.push('');

  // 2. FILES Section (compact changed files list)
  if (!change.isClean && receipt.files && receipt.files.length > 0) {
    lines.push(`${c.bold}FILES${c.reset}`);
    const displayFiles = receipt.files.slice(0, 6);
    for (const f of displayFiles) {
      const icon = f.status === 'added' ? `${c.green}+${c.reset}` : f.status === 'deleted' ? `${c.red}-${c.reset}` : `${c.cyan}•${c.reset}`;
      const safePath = sanitizeForTerminal(f.path);
      if (f.isMechanical) {
        lines.push(`  ${icon} ${c.dim}${safePath.padEnd(35)} [mechanical · +${f.added}/-${f.deleted}]${c.reset}`);
      } else {
        const stats = `${c.green}+${f.added}${c.reset}/${c.red}-${f.deleted}${c.reset}`;
        lines.push(`  ${icon} ${safePath.padEnd(35)} ${c.dim}${stats}${c.reset}`);
      }
    }
    if (receipt.files.length > 6) {
      lines.push(`  ${c.dim}... and ${receipt.files.length - 6} more files. Run \`wtf show\` for full list.${c.reset}`);
    }
    lines.push('');
  }

  // 2. PAY ATTENTION Section (if any high-importance findings)
  if (payAttention.length > 0) {
    lines.push(`${c.bold}${c.yellow}PAY ATTENTION${c.reset}`);
    payAttention.slice(0, 5).forEach((f, idx) => {
      const num = `${idx + 1}.`;
      const catColor = f.severity === 'CRITICAL' ? c.red : c.yellow;
      lines.push(`  ${num} ${catColor}${c.bold}${sanitizeForTerminal(f.category)}${c.reset}`);
      lines.push(`     ${sanitizeForTerminal(f.title)}`);
      if (f.file) {
        const lineInfo = f.line ? `:${f.line}` : '';
        lines.push(`     ${c.dim}${sanitizeForTerminal(f.file)}${lineInfo}${c.reset}`);
      }
      if (f.snippet) {
        lines.push(`     ${c.gray}> ${sanitizeForTerminal(f.snippet).slice(0, 75)}${c.reset}`);
      }
    });
    if (payAttention.length > 5) {
      lines.push(`  ${c.dim}... and ${payAttention.length - 5} more items. Run \`wtf show\` to inspect.${c.reset}`);
    }
    lines.push('');
  }

  // 3. ALSO Section (compact fact summary)
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

  // 4. Review Surface Compression
  if (!change.isClean && change.totalLinesChanged > 0) {
    if (change.mechanicalLines > 0) {
      const pct = (change.compressionRatio * 100).toFixed(1);
      lines.push(`${c.dim}Most changes appear mechanical/generated.${c.reset}`);
      lines.push(`${c.bold}Review surface:${c.reset}`);
      lines.push(
        `  ~${c.cyan}${c.bold}${change.meaningfulLines.toLocaleString()}${c.reset} meaningful lines / ${change.totalLinesChanged.toLocaleString()} changed ${c.dim}(${pct}% compressed)${c.reset}`
      );
    } else {
      lines.push(`${c.bold}Review surface:${c.reset}`);
      lines.push(
        `  ${c.cyan}${c.bold}${change.meaningfulLines.toLocaleString()}${c.reset} lines to review across ${change.totalFiles} ${change.totalFiles === 1 ? 'file' : 'files'}`
      );
    }
    lines.push('');
  }

  // Call to action
  if (!change.isClean) {
    lines.push(`${c.dim}Run ${c.reset}${c.cyan}wtf show${c.reset}${c.dim} for evidence details.${c.reset}`);
  }

  return lines.join('\n');
}
