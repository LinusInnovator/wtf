import type { FilePatch, Finding } from '../types.js';

export function detectHygieneIssues(patches: FilePatch[]): {
  findings: Finding[];
  summaryItems: string[];
} {
  const findings: Finding[] = [];
  let debugStatementsCount = 0;
  let todoCount = 0;

  for (const patch of patches) {
    if (patch.isMechanical) continue;

    const isTestOrDocFile =
      /\.(test|spec)\.[a-z0-9]+$/i.test(patch.path) ||
      /(^|\/)tests?\//i.test(patch.path) ||
      /\.md$/i.test(patch.path) ||
      /(^|\/)bin\//i.test(patch.path) ||
      /(^|\/)cli\.[a-z]+$/i.test(patch.path) ||
      /(^|\/)\.github\//i.test(patch.path) ||
      /(^|\/)\.gitlab\//i.test(patch.path) ||
      /\.(ya?ml|json|toml|xml|lock|sum)$/i.test(patch.path) ||
      patch.path.includes('scratch');

    for (const hunk of patch.hunks) {
      let currentLineNum = hunk.newStart;

      for (const line of hunk.lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const content = line.slice(1).trim();

          // Destructive calls
          if (
            /\brm\s+-rf\s+[\/\~]|\bfs\.rmSync\(['"`]\/|\bchild_process\.exec\b/i.test(content) &&
            !isTestOrDocFile
          ) {
            findings.push({
              id: `hygiene-destructive-${patch.path}-${currentLineNum}`,
              category: 'SECURITY',
              title: `Potentially dangerous command/call in ${patch.path}`,
              description: `Potentially destructive execution detected: "${content}"`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'CRITICAL',
              snippet: content,
            });
          }

          // Debug statements in production code (not in tests, docs, or CI workflow scripts)
          if (!isTestOrDocFile) {
            if (
              /\bdebugger;?\b/.test(content) ||
              /\bconsole\.(log|debug|warn)\(/.test(content) ||
              /\bbinding\.pry\b/.test(content) ||
              /\bimport\s+pdb;\s*pdb\.set_trace\(\)/.test(content)
            ) {
              debugStatementsCount++;
              findings.push({
                id: `hygiene-debug-${patch.path}-${currentLineNum}`,
                category: 'HYGIENE',
                title: `Debug statement left in ${patch.path}`,
                description: `Debug code detected: "${content}"`,
                file: patch.path,
                line: currentLineNum,
                evidenceTier: 'OBSERVED',
                severity: 'WARN',
                snippet: content,
              });
            }
          }

          // TODO / FIXME markers: uppercase only, inside comment lines only, never in data files
          const isCommentLine = /^(\/\/|\/\*|\*|#|--|<!--)/.test(content);
          if (isCommentLine && !isTestOrDocFile && /\b(TODO|FIXME|HACK|XXX)\b/.test(content)) {
            todoCount++;
            findings.push({
              id: `hygiene-todo-${patch.path}-${currentLineNum}`,
              category: 'HYGIENE',
              title: `Unresolved marker in ${patch.path}`,
              description: `Task marker detected: "${content}"`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'INFO',
              snippet: content,
            });
          }

          currentLineNum++;
        } else if (line.startsWith(' ')) {
          currentLineNum++;
        }
      }
    }
  }

  const summaryItems: string[] = [];
  if (debugStatementsCount > 0) {
    summaryItems.push(`⚠ ${debugStatementsCount} debug statement${debugStatementsCount === 1 ? '' : 's'}`);
  }
  if (todoCount > 0) {
    summaryItems.push(`ℹ ${todoCount} TODO/FIXME marker${todoCount === 1 ? '' : 's'}`);
  }

  return { findings, summaryItems };
}
