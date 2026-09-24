import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  compileAndApplyPatch,
  compileAndApplyPatchToFile,
} from '../src/core/action-compiler.js';

describe('Action Compiler (Phase 9.2)', () => {
  describe('compileAndApplyPatch (Pure in-memory replacement)', () => {
    it('Strategy 1: resolves exact unique substring match cleanly', () => {
      const content = `def foo():\n    return 42\n\ndef bar():\n    return 100\n`;
      const oldText = `return 42`;
      const newText = `return 43`;

      const res = compileAndApplyPatch({ content, oldText, newText });
      expect(res.success).toBe(true);
      expect(res.strategyUsed).toBe('exact');
      expect(res.spansMatched).toBe(1);
      expect(res.content).toBe(`def foo():\n    return 43\n\ndef bar():\n    return 100\n`);
    });

    it('Strategy 1: uses startLine and endLine to disambiguate multiple exact matches', () => {
      const content = [
        'function testA() {',
        '  const x = 1;',
        '  return x;',
        '}',
        'function testB() {',
        '  const x = 1;',
        '  return x;',
        '}',
      ].join('\n');

      const oldText = 'const x = 1;';
      const newText = 'const x = 2;';

      // Without coordinate filter, should fail closed (ambiguous)
      const ambiguousRes = compileAndApplyPatch({ content, oldText, newText });
      expect(ambiguousRes.success).toBe(false);
      expect(ambiguousRes.error).toContain('Ambiguous match (2 occurrences found');

      // With coordinate filter targeting testB (lines 5-8)
      const res = compileAndApplyPatch({
        content,
        oldText,
        newText,
        startLine: 5,
        endLine: 8,
      });
      expect(res.success).toBe(true);
      expect(res.strategyUsed).toBe('exact');
      expect(res.spansMatched).toBe(1);
      expect(res.content).toContain('function testA() {\n  const x = 1;');
      expect(res.content).toContain('function testB() {\n  const x = 2;');
    });

    it('Strategy 2: resolves line-normalized match across indentation (tabs vs spaces)', () => {
      // Content has 4 spaces on def, 8 spaces on return
      const content = `class Calculator:\n    def add(self, a, b):\n        return a + b\n`;
      // Model omitted class-level base indentation:
      const oldText = `def add(self, a, b):\n    return a + b\n`;
      const newText = `def add(self, a, b):\n    return (a + b) * 1\n`;

      const res = compileAndApplyPatch({ content, oldText, newText });
      expect(res.success).toBe(true);
      expect(res.strategyUsed).toBe('line_normalized');
      expect(res.spansMatched).toBe(1);
      expect(res.content).toBe(`class Calculator:\n    def add(self, a, b):\n        return (a + b) * 1\n`);
    });

    it('Strategy 2: handles blank-line entropy and trims leading/trailing empty lines', () => {
      const content = `\n\nfunc Run() error {\n\n    return nil\n}\n`;
      const oldText = `\n\nfunc Run() error {\n    return nil\n}\n\n`;
      const newText = `func Run() error {\n    return errors.New("failed")\n}`;

      const res = compileAndApplyPatch({ content, oldText, newText });
      expect(res.success).toBe(true);
      expect(res.strategyUsed).toBe('line_normalized');
      expect(res.content).toContain('return errors.New("failed")');
    });

    it('Strategy 2: disambiguates normalized matches via coordinate boundaries', () => {
      const content = [
        'fn step_one() {',
        '    let x = 10;',
        '}',
        'fn step_two() {',
        '    let x = 10;',
        '}',
      ].join('\n');

      const oldText = '  let x = 10;'; // 2 spaces instead of 4
      const newText = '  let x = 20;';

      const res = compileAndApplyPatch({
        content,
        oldText,
        newText,
        startLine: 4,
        endLine: 6,
      });
      expect(res.success).toBe(true);
      expect(res.content).toContain('fn step_one() {\n    let x = 10;');
      expect(res.content).toContain('fn step_two() {\n    let x = 20;');
    });

    it('Strategy 3: resolves token-sequence matching across line wrap variations', () => {
      // Content has wrapped function arguments
      const content = `def render(name,\n           value,\n           extra):\n    return f"{name}={value}"\n`;
      // Model emits single-line old_text
      const oldText = `def render(name, value, extra):`;
      const newText = `def render(name: str, value: Any, extra: bool):`;

      const res = compileAndApplyPatch({ content, oldText, newText });
      expect(res.success).toBe(true);
      expect(res.strategyUsed).toBe('token_sequence');
      expect(res.content).toBe(`def render(name: str, value: Any, extra: bool):\n    return f"{name}={value}"\n`);
    });

    it('fails closed when target text is empty or only whitespace', () => {
      const content = 'const a = 1;';
      const emptyRes = compileAndApplyPatch({ content, oldText: '', newText: 'const a = 2;' });
      expect(emptyRes.success).toBe(false);
      expect(emptyRes.error).toBe('Error: old_text is empty');

      const wsRes = compileAndApplyPatch({ content, oldText: '   \n\t  ', newText: 'const a = 2;' });
      expect(wsRes.success).toBe(false);
      expect(wsRes.error).toBe('Error: old_text contains only whitespace');
    });

    it('fails closed when target text is not found in content', () => {
      const content = 'const a = 1;';
      const res = compileAndApplyPatch({
        content,
        oldText: 'const nonexistent = 999;',
        newText: 'const b = 2;',
      });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Error: Target text not found in file. Ensure lines match target content.');
    });

    it('fails closed when match is genuinely ambiguous across the file', () => {
      const content = 'return true;\nreturn true;\nreturn true;\n';
      const res = compileAndApplyPatch({
        content,
        oldText: 'return true;',
        newText: 'return false;',
      });
      expect(res.success).toBe(false);
      expect(res.error).toContain('Ambiguous match');
      expect(res.spansMatched).toBe(3);
    });

    it('preserves replacement text byte-for-byte with zero semantic modification', () => {
      const content = `let flag = false;\n`;
      const oldText = `let flag = false;\n`;
      // Replacement has custom escaping and syntax
      const newText = `let flag = "special \\n \\t \\"value\\"";\n`;

      const res = compileAndApplyPatch({ content, oldText, newText });
      expect(res.success).toBe(true);
      expect(res.content).toBe(`let flag = "special \\n \\t \\"value\\"";\n`);
    });

    it('strictly treats replacement string literally with zero $ pattern expansion', () => {
      const content = `prefix MATCH suffix\n`;
      const oldText = `MATCH`;

      // 1. $& (matched substring in JS regex replacement)
      const resAmp = compileAndApplyPatch({ content, oldText, newText: `foo$&bar` });
      expect(resAmp.success).toBe(true);
      expect(resAmp.content).toBe(`prefix foo$&bar suffix\n`);

      // 2. $' (portion following match in JS regex replacement)
      const resApos = compileAndApplyPatch({ content, oldText, newText: `foo$'bar` });
      expect(resApos.success).toBe(true);
      expect(resApos.content).toBe(`prefix foo$'bar suffix\n`);

      // 3. $` (portion preceding match in JS regex replacement)
      const resTick = compileAndApplyPatch({ content, oldText, newText: `foo$\`bar` });
      expect(resTick.success).toBe(true);
      expect(resTick.content).toBe(`prefix foo$\`bar suffix\n`);

      // 4. $1 (capture group in JS regex replacement)
      const resNum = compileAndApplyPatch({ content, oldText, newText: `foo$1bar` });
      expect(resNum.success).toBe(true);
      expect(resNum.content).toBe(`prefix foo$1bar suffix\n`);

      // 5. Ordinary $ characters and complex regex character classes (RFC 3986 URL case)
      const resUrl = compileAndApplyPatch({
        content,
        oldText,
        newText: `r'^(https?://)?([a-zA-Z0-9-._~%!$&\\'()*+,;=:@]+@)?'`,
      });
      expect(resUrl.success).toBe(true);
      expect(resUrl.content).toBe(
        `prefix r'^(https?://)?([a-zA-Z0-9-._~%!$&\\'()*+,;=:@]+@)?' suffix\n`
      );
    });
  });

  describe('compileAndApplyPatchToFile (Filesystem execution)', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-patch-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('successfully mutates file on disk and reports line delta metrics', () => {
      const targetPath = path.join(tempDir, 'sample.ts');
      fs.writeFileSync(targetPath, `line 1\nline 2\nline 3\n`, 'utf-8');

      const res = compileAndApplyPatchToFile(
        'sample.ts',
        'line 2',
        'line 2a\nline 2b',
        { cwd: tempDir }
      );

      expect(res.success).toBe(true);
      expect(res.linesAdded).toBe(1);
      expect(res.linesDeleted).toBe(0);

      const updated = fs.readFileSync(targetPath, 'utf-8');
      expect(updated).toBe(`line 1\nline 2a\nline 2b\nline 3\n`);
    });

    it('strictly prevents path traversal attacks escaping repository root', () => {
      const res = compileAndApplyPatchToFile(
        '../../outside.txt',
        'foo',
        'bar',
        { cwd: tempDir }
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('Security violation: Path');
    });

    it('returns error when file does not exist on disk', () => {
      const res = compileAndApplyPatchToFile(
        'nonexistent.ts',
        'foo',
        'bar',
        { cwd: tempDir }
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain('File not found');
    });
  });
});
