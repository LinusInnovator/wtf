import { test, expect } from 'vitest';
import { compileEvidence, parseGitDiff } from '../src/core/evidence-compiler.js';

test('parseGitDiff correctly extracts changed files and line numbers', () => {
  const diff = `diff --git a/src/impls.rs b/src/impls.rs
index 1234..5678 100644
--- a/src/impls.rs
+++ b/src/impls.rs
@@ -1,3 +1,3 @@
-[Content of old file]
+[Content of the file with the corrected lines 55 and 56]
 unchanged line
`;
  const parsed = parseGitDiff(diff);
  expect(parsed.has('src/impls.rs')).toBe(true);
  const fileDiff = parsed.get('src/impls.rs')!;
  expect(fileDiff.changedLines.has(1)).toBe(true);
  expect(fileDiff.changedLines.has(2)).toBe(false);
});

test('compileEvidence separates changed vs unchanged diagnostics deterministically', () => {
  const rawOutput = `   Compiling bstr v1.11.2 (/workspace)
error: expected item, found \`[\`
 --> src/impls.rs:1:1
  |
1 | [Content of the file with the corrected lines 55 and 56]
  | ^ expected item

error[E0277]: \`BStr\` doesn't implement \`Debug\`
   --> src/byteset/scalar.rs:259:17
    |
259 |                 B(&search).as_bstr(),
    |                 ^^^^^^^^^^^^^^^^^^^^ \`BStr\` cannot be formatted using \`{:?}\`
`;

  const gitDiff = `diff --git a/src/impls.rs b/src/impls.rs
--- a/src/impls.rs
+++ b/src/impls.rs
@@ -1,3 +1,1 @@
-[old]
+[Content of the file with the corrected lines 55 and 56]
`;

  const compiled = compileEvidence({
    cmd: 'cargo test',
    exitCode: 101,
    stdout: rawOutput,
    stderr: '',
    gitDiff
  });

  expect(compiled).toContain('FAILURE\n  cargo test: exit 101');
  expect(compiled).toContain('DIAGNOSTICS_IN_CHANGED_CODE');
  expect(compiled).toContain('src/impls.rs:1:1\n  error: expected item, found `[`');
  expect(compiled).toContain('DIAGNOSTICS_IN_UNCHANGED_CODE');
  expect(compiled).toContain('src/byteset/scalar.rs:259:17\n  error[E0277]: `BStr` doesn\'t implement `Debug`');
  expect(compiled).toContain('CHANGE_CONTEXT');
  expect(compiled).toContain('UNKNOWN\n  causal relationship between diagnostics');
});
