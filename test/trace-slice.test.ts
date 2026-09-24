import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { extractTraceFrames } from '../src/core/trace-slice.js';

describe('Trace Slice (Phase 9.2)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-trace-slice-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('extracts Python traceback coordinates pointing to files on disk', () => {
    const pyFile = path.join(tempDir, 'starlette', 'status.py');
    fs.mkdirSync(path.dirname(pyFile), { recursive: true });
    fs.writeFileSync(pyFile, 'HTTP_200 = 200\nHTTP_404 = 404\n', 'utf-8');

    const traceOutput = [
      'Traceback (most recent call last):',
      `  File "${pyFile}", line 2, in test_status`,
      '    assert HTTP_404 == 200',
      'AssertionError: assert 404 == 200',
    ].join('\n');

    const frames = extractTraceFrames(traceOutput, tempDir);
    expect(frames.length).toBe(1);
    expect(frames[0].file).toBe(path.join('starlette', 'status.py'));
    expect(frames[0].line).toBe(2);
    expect(frames[0].source).toBe('python');
  });

  it('extracts Rust compiler and cargo test error coordinates', () => {
    const rsFile = path.join(tempDir, 'src', 'lib.rs');
    fs.mkdirSync(path.dirname(rsFile), { recursive: true });
    fs.writeFileSync(rsFile, 'pub fn check() -> bool { false }\n', 'utf-8');

    const rustOutput = [
      'error[E0308]: mismatched types',
      '  --> src/lib.rs:1:27',
      '   |',
      ' 1 | pub fn check() -> bool { false }',
      '   |                           ^^^^^ expected `()`, found `bool`',
    ].join('\n');

    const frames = extractTraceFrames(rustOutput, tempDir);
    expect(frames.length).toBe(1);
    expect(frames[0].file).toBe(path.join('src', 'lib.rs'));
    expect(frames[0].line).toBe(1);
    expect(frames[0].column).toBe(27);
    expect(frames[0].source).toBe('rust');
  });

  it('extracts Node / V8 stack trace coordinates', () => {
    const jsFile = path.join(tempDir, 'index.js');
    fs.writeFileSync(jsFile, 'function run() { throw new Error("boom"); }\nrun();\n', 'utf-8');

    const nodeOutput = [
      'Error: boom',
      `    at run (${jsFile}:1:24)`,
      `    at Object.<anonymous> (${jsFile}:2:1)`,
    ].join('\n');

    const frames = extractTraceFrames(nodeOutput, tempDir);
    expect(frames.length).toBe(2);
    expect(frames[0].file).toBe('index.js');
    expect(frames[0].line).toBe(1);
    expect(frames[0].column).toBe(24);
    expect(frames[0].source).toBe('node');

    expect(frames[1].file).toBe('index.js');
    expect(frames[1].line).toBe(2);
    expect(frames[1].column).toBe(1);
  });

  it('extracts Go test failure coordinates', () => {
    const goFile = path.join(tempDir, 'parser_test.go');
    fs.writeFileSync(goFile, 'package main\nimport "testing"\n', 'utf-8');

    const goOutput = [
      '--- FAIL: TestParse (0.00s)',
      '    parser_test.go:2: unexpected token',
      'FAIL',
    ].join('\n');

    const frames = extractTraceFrames(goOutput, tempDir);
    expect(frames.length).toBe(1);
    expect(frames[0].file).toBe('parser_test.go');
    expect(frames[0].line).toBe(2);
    expect(frames[0].source).toBe('go');
  });

  it('strictly ignores vendor, .venv, and node_modules paths', () => {
    const venvFile = path.join(tempDir, '.venv', 'lib', 'pytest.py');
    fs.mkdirSync(path.dirname(venvFile), { recursive: true });
    fs.writeFileSync(venvFile, 'def run(): pass\n', 'utf-8');

    const nodeModulesFile = path.join(tempDir, 'node_modules', 'mocha', 'index.js');
    fs.mkdirSync(path.dirname(nodeModulesFile), { recursive: true });
    fs.writeFileSync(nodeModulesFile, 'module.exports = {};\n', 'utf-8');

    const output = [
      `  File "${venvFile}", line 1, in run`,
      `    at runner (${nodeModulesFile}:1:1)`,
    ].join('\n');

    const frames = extractTraceFrames(output, tempDir);
    expect(frames.length).toBe(0);
  });

  it('ignores paths that do not exist on disk', () => {
    const output = '  File "nonexistent_file.py", line 42, in test_fn';
    const frames = extractTraceFrames(output, tempDir);
    expect(frames.length).toBe(0);
  });

  it('deduplicates identical file:line frames', () => {
    const sample = path.join(tempDir, 'sample.ts');
    fs.writeFileSync(sample, 'console.log(1);\n', 'utf-8');

    const output = [
      `    at Object.<anonymous> (${sample}:1:1)`,
      `    at Object.<anonymous> (${sample}:1:1)`,
    ].join('\n');

    const frames = extractTraceFrames(output, tempDir);
    expect(frames.length).toBe(1);
  });
});
