import type { AnalyzeResult } from '../core/evidence.js';

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

export function formatShow(result: AnalyzeResult): string {
  const { receipt } = result;
  const { payAttention, also, change, verification } = receipt;
  const lines: string[] = [];

  lines.push(`${c.bold}${c.cyan}WTF SHOW${c.reset} — Detailed Evidence Ledger`);
  lines.push(`${c.dim}Repo: ${receipt.repo.root} | Head: ${receipt.repo.head || 'none'}${c.reset}`);
  lines.push('');

  // Pay Attention detailed breakdown
  if (payAttention.length > 0) {
    lines.push(`${c.bold}${c.yellow}═══ PAY ATTENTION (${payAttention.length}) ═══${c.reset}`);
    lines.push('');
    for (let i = 0; i < payAttention.length; i++) {
      const item = payAttention[i];
      const badge = item.severity === 'CRITICAL' ? `${c.red}[CRITICAL]${c.reset}` : `${c.yellow}[WARN]${c.reset}`;
      lines.push(`${c.bold}${i + 1}. ${item.title}${c.reset} ${badge}`);
      lines.push(`   ${c.dim}Category:${c.reset} ${item.category} | ${c.dim}Evidence Tier:${c.reset} ${c.cyan}${item.evidenceTier}${c.reset}`);
      if (item.file) {
        lines.push(`   ${c.dim}Location:${c.reset} ${item.file}${item.line ? `:${item.line}` : ''}`);
      }
      lines.push(`   ${c.dim}Details:${c.reset}  ${item.description}`);
      if (item.snippet) {
        lines.push(`   ${c.gray}┌── diff snippet ──${c.reset}`);
        lines.push(`   ${c.gray}│${c.reset} ${item.snippet}`);
        lines.push(`   ${c.gray}└──────────────────${c.reset}`);
      }
      lines.push('');
    }
  }

  // Also findings detailed
  if (also.length > 0) {
    lines.push(`${c.bold}═══ ALSO OBSERVED (${also.length}) ═══${c.reset}`);
    lines.push('');
    for (const item of also) {
      lines.push(`• ${c.bold}${item.title}${c.reset} ${c.dim}(${item.category})${c.reset}`);
      lines.push(`  ${item.description}`);
      if (item.file) {
        lines.push(`  ${c.dim}${item.file}${item.line ? `:${item.line}` : ''}${c.reset}`);
      }
      lines.push('');
    }
  }

  // Verification
  lines.push(`${c.bold}═══ VERIFICATION STATUS ═══${c.reset}`);
  for (const v of verification) {
    const statusColor = v.status === 'PASSED' ? c.green : v.status === 'FAILED' ? c.red : c.gray;
    lines.push(`• ${v.name}: ${statusColor}${v.status}${c.reset} ${c.dim}(tier: ${v.tier})${c.reset}`);
    lines.push(`  Command: ${v.command}`);
    if (v.details) {
      lines.push(`  Details: ${v.details}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}
