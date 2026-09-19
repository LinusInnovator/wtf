import type { FilePatch, Finding } from '../types.js';
import { truncateLineForRegex } from '../core/security.js';

export function detectEnvironmentChanges(patches: FilePatch[]): {
  findings: Finding[];
  summaryItems: string[];
} {
  const findings: Finding[] = [];
  const envVarsAdded = new Set<string>();

  for (const patch of patches) {
    if (patch.isMechanical) continue;

    const isEnvFile = /(^|\/)\.env(\.[a-zA-Z0-9_\-]+)?$/.test(patch.path);

    for (const hunk of patch.hunks) {
      let currentLineNum = hunk.newStart;

      for (const line of hunk.lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const content = truncateLineForRegex(line.slice(1).trim());

          if (isEnvFile) {
            const match = content.match(/^([A-Z0-9_]+)\s*=/);
            if (match) {
              envVarsAdded.add(match[1]);
            }
          } else {
            // Code usage: process.env.XYZ or os.environ["XYZ"] or std::env::var("XYZ")
            const jsMatches = content.matchAll(/process\.env\.([A-Z0-9_]+)/g);
            for (const m of jsMatches) {
              envVarsAdded.add(m[1]);
            }
            const pyMatches = content.matchAll(/os\.(?:environ|getenv)\([`'"]([A-Z0-9_]+)[`'"]/g);
            for (const m of pyMatches) {
              envVarsAdded.add(m[1]);
            }
            const rustMatches = content.matchAll(/env::var\([`'"]([A-Z0-9_]+)[`'"]/g);
            for (const m of rustMatches) {
              envVarsAdded.add(m[1]);
            }
          }

          currentLineNum++;
        } else if (line.startsWith(' ')) {
          currentLineNum++;
        }
      }
    }

    if (isEnvFile && (patch.status === 'added' || patch.status === 'untracked')) {
      findings.push({
        id: `env-file-added-${patch.path}`,
        category: 'ENV',
        title: `Environment configuration file added: ${patch.path}`,
        description: `New environment file created. Verify no production secrets are committed.`,
        file: patch.path,
        evidenceTier: 'OBSERVED',
        severity: 'WARN',
      });
    }
  }

  const summaryItems: string[] = [];
  const varList = Array.from(envVarsAdded);
  if (varList.length > 0) {
    summaryItems.push(`+ ${varList.length} ${varList.length === 1 ? 'environment variable' : 'environment variables'}`);
    findings.push({
      id: 'env-vars-added',
      category: 'ENV',
      title: `Referenced / configured ${varList.length} environment ${varList.length === 1 ? 'variable' : 'variables'}`,
      description: `Environment variables detected in changes: ${varList.slice(0, 5).join(', ')}${varList.length > 5 ? ` and ${varList.length - 5} more` : ''}`,
      evidenceTier: 'OBSERVED',
      severity: 'INFO',
    });
  }

  return { findings, summaryItems };
}
