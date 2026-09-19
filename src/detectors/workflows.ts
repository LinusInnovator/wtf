import type { FilePatch, Finding } from '../types.js';

export function detectWorkflowChanges(patches: FilePatch[]): {
  findings: Finding[];
  summaryItems: string[];
} {
  const findings: Finding[] = [];
  const workflowsChanged: string[] = [];

  for (const patch of patches) {
    if (
      patch.path.startsWith('.github/workflows/') ||
      patch.path === '.gitlab-ci.yml' ||
      patch.path === 'Jenkinsfile' ||
      patch.path.startsWith('.circleci/')
    ) {
      workflowsChanged.push(patch.path);

      let hasSecretReference = false;
      let hasPullRequestTarget = false;

      for (const hunk of patch.hunks) {
        for (const line of hunk.lines) {
          if (line.startsWith('+')) {
            if (/secrets\.[A-Z0-9_]+/i.test(line)) {
              hasSecretReference = true;
            }
            if (/pull_request_target/i.test(line)) {
              hasPullRequestTarget = true;
            }
          }
        }
      }

      if (hasPullRequestTarget) {
        findings.push({
          id: `workflow-pr-target-${patch.path}`,
          category: 'SECURITY',
          title: `Security sensitive workflow trigger in ${patch.path}`,
          description: `pull_request_target trigger modified or added. Ensure untrusted PRs cannot execute with write permissions.`,
          file: patch.path,
          evidenceTier: 'OBSERVED',
          severity: 'CRITICAL',
        });
      } else if (hasSecretReference) {
        findings.push({
          id: `workflow-secret-${patch.path}`,
          category: 'WORKFLOW',
          title: `Secrets referenced in CI workflow: ${patch.path}`,
          description: `New or modified secret references detected in workflow ${patch.path}`,
          file: patch.path,
          evidenceTier: 'OBSERVED',
          severity: 'WARN',
        });
      }
    }
  }

  const summaryItems: string[] = [];
  if (workflowsChanged.length > 0) {
    summaryItems.push(`⚡ ${workflowsChanged.length} CI/CD workflow${workflowsChanged.length === 1 ? '' : 's'} updated`);
  }

  return { findings, summaryItems };
}
