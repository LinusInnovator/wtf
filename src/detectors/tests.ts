import type { FilePatch, Finding } from '../types.js';
import { truncateLineForRegex } from '../core/security.js';

export function detectTestChanges(patches: FilePatch[]): {
  findings: Finding[];
  summaryItems: string[];
} {
  const findings: Finding[] = [];
  let testsAddedCount = 0;
  let testsRemovedCount = 0;
  let skippedTestsCount = 0;

  for (const patch of patches) {
    if (patch.isMechanical) continue;

    // Skip markdown, documentation, and config files
    if (/\.(md|markdown|txt|rst|json|ya?ml)$/i.test(patch.path) || patch.path.startsWith('docs/')) {
      continue;
    }

    const isTestFile =
      /\.(test|spec)\.[a-z0-9]+$/i.test(patch.path) ||
      /(^|\/)tests?\//i.test(patch.path) ||
      patch.path.endsWith('_test.go') ||
      patch.path.endsWith('_test.py') ||
      patch.path.startsWith('test_');

    for (const hunk of patch.hunks) {
      let currentLineNum = hunk.newStart;

      for (const line of hunk.lines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          const content = truncateLineForRegex(line.slice(1).trim());

          // Skipped / disabled tests (only in test files or source files)
          const isSkipped =
            /\b(it\.skip|test\.skip|describe\.skip|xit\(|xtest\(|xdescribe\()\b/.test(content) ||
            /@pytest\.mark\.skip/.test(content) ||
            /#\[ignore\]/.test(content) ||
            /\bt\.Skip\b/.test(content);

          const isFocusedOnly = /\b(it\.only|test\.only|describe\.only)\b/.test(content);

          if (isSkipped && !content.startsWith('//') && !content.startsWith('*')) {
            skippedTestsCount++;
            findings.push({
              id: `test-skipped-${patch.path}-${currentLineNum}`,
              category: 'TESTS',
              title: `Test skipped or disabled in ${patch.path}`,
              description: `Skipped test marker detected: "${content}"`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'WARN',
              snippet: content,
            });
          } else if (isFocusedOnly && !content.startsWith('//') && !content.startsWith('*')) {
            findings.push({
              id: `test-only-${patch.path}-${currentLineNum}`,
              category: 'TESTS',
              title: `Focused test (.only) detected in ${patch.path}`,
              description: `A focused test (.only) was left in, which suppresses other tests from running.`,
              file: patch.path,
              line: currentLineNum,
              evidenceTier: 'OBSERVED',
              severity: 'CRITICAL',
              snippet: content,
            });
          } else if (isTestFile) {
            // Count test definitions added
            if (
              /\b(it\(|test\(|def test_|func Test|#\[test\])\b/.test(content) &&
              !content.startsWith('//') &&
              !content.startsWith('#')
            ) {
              testsAddedCount++;
            }
          }

          currentLineNum++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          const content = line.slice(1).trim();
          if (isTestFile && /\b(it\(|test\(|def test_|func Test|#\[test\])\b/.test(content)) {
            testsRemovedCount++;
          }
        } else if (line.startsWith(' ')) {
          currentLineNum++;
        }
      }
    }
  }

  const summaryItems: string[] = [];
  if (testsAddedCount > 0) {
    summaryItems.push(`+ ${testsAddedCount} ${testsAddedCount === 1 ? 'test' : 'tests'}`);
  }
  if (testsRemovedCount > 0) {
    summaryItems.push(`- ${testsRemovedCount} ${testsRemovedCount === 1 ? 'test' : 'tests'}`);
  }
  if (skippedTestsCount > 0) {
    summaryItems.push(`⚠ ${skippedTestsCount} skipped ${skippedTestsCount === 1 ? 'test' : 'tests'}`);
  }

  return { findings, summaryItems };
}
