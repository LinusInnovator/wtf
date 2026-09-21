import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import {
  discoverVerificationTargets,
  runVerificationV0,
  runVerification,
  getUnverifiedTargets,
} from '../src/verify/runner.js';
import { analyzeRepo } from '../src/core/evidence.js';
import { formatAgent } from '../src/formatters/agent.js';

function createTempGitRepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-lifecycle-test-'));
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "WTF Test"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@wtf.local"', { cwd: tmpDir, stdio: 'ignore' });
  return tmpDir;
}

function commitAll(cwd: string, msg: string): void {
  execSync('git add -A', { cwd, stdio: 'ignore' });
  execSync(`git commit -m "${msg}" --allow-empty`, { cwd, stdio: 'ignore' });
}

describe('Omnicap Regression Fixture & Verification Lifecycle Invariants', () => {
  // -------------------------------------------------------------------------
  // Case A — Weak Python clue
  // -------------------------------------------------------------------------
  it('Case A: Weak Python clue (generic tests/ folder does NOT authorize bare pytest)', () => {
    const repo = createTempGitRepo();
    try {
      // Repository contains generic tests/ folder but NO pytest.ini, NO pyproject.toml, NO setup.cfg
      const testsDir = path.join(repo, 'tests');
      fs.mkdirSync(testsDir, { recursive: true });
      fs.writeFileSync(path.join(testsDir, 'test_unrelated.py'), '# Some unconfigured python test\n');
      commitAll(repo, 'Add unconfigured tests dir');

      // 1. Discovery MUST NOT infer bare pytest
      const targets = discoverVerificationTargets(repo);
      expect(targets).toEqual([]);

      // 2. Active verification returns COMMAND_UNKNOWN, tier UNKNOWN
      const verifV0 = runVerificationV0(repo);
      expect(verifV0.length).toBe(1);
      expect(verifV0[0].lifecycle).toBe('COMMAND_UNKNOWN');
      expect(verifV0[0].tier).toBe('UNKNOWN');
      expect(verifV0[0].command).toBe('UNKNOWN');

      // 3. Passive observation also reports COMMAND_UNKNOWN
      const unverified = getUnverifiedTargets(repo);
      expect(unverified.length).toBe(1);
      expect(unverified[0].lifecycle).toBe('COMMAND_UNKNOWN');
      expect(unverified[0].tier).toBe('UNKNOWN');

      // 4. Agent output preserves truthfulness without crashing or running bare pytest
      const result = analyzeRepo(repo, { verify: true });
      const output = formatAgent(result);
      expect(output).toContain('○ No verification targets discovered in repository');
      expect(output).toContain('WTF-RECEIPT:');
      expect(output).not.toContain('pytest');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Case B — Explicit Python verification
  // -------------------------------------------------------------------------
  it('Case B: Explicit Python verification (pyproject.toml or pytest.ini authorizes pytest)', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'pytest.ini'),
        '[pytest]\ntestpaths = tests\n'
      );
      const testsDir = path.join(repo, 'tests');
      fs.mkdirSync(testsDir, { recursive: true });
      fs.writeFileSync(path.join(testsDir, 'test_sample.py'), 'def test_ok(): pass\n');
      commitAll(repo, 'Add explicit pytest config');

      const targets = discoverVerificationTargets(repo);
      expect(targets.length).toBe(1);
      expect(targets[0].name).toBe('tests');
      expect(targets[0].command).toBe('pytest');
      expect(targets[0].source).toBe('project_declaration');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Case C — Explicit WTF verification contract
  // -------------------------------------------------------------------------
  it('Case C: Explicit WTF verification contract (outranks discovery and honors cwd)', () => {
    const repo = createTempGitRepo();
    try {
      // Create subproject directory
      const subDir = path.join(repo, 'packages', 'core');
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(
        path.join(subDir, 'marker.txt'),
        'subproject content\n'
      );

      // Create .wtfrc.json with exact command and scoped cwd
      fs.writeFileSync(
        path.join(repo, '.wtfrc.json'),
        JSON.stringify({
          verify: [
            {
              name: 'subproject-check',
              command: 'node',
              args: ['-e', 'console.log("Tests: 5 passed, 5 total"); process.exit(0)'],
              cwd: 'packages/core',
            },
          ],
        }, null, 2)
      );

      // Add a package.json at root that would otherwise be discovered
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'root', scripts: { test: 'exit 99' } }, null, 2)
      );
      commitAll(repo, 'Add explicit WTF verification contract');

      // 1. Explicit contract outranks package.json discovery
      const targets = discoverVerificationTargets(repo);
      expect(targets.length).toBe(1);
      expect(targets[0].name).toBe('subproject-check');
      expect(targets[0].command).toBe('node');
      expect(targets[0].cwd).toBe('packages/core');
      expect(targets[0].source).toBe('explicit_contract');

      // 2. Execution honors exact contract and passes
      const results = runVerificationV0(repo);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('subproject-check');
      expect(results[0].lifecycle).toBe('TESTS_PASSED');
      expect(results[0].status).toBe('PASSED');
      expect(results[0].testsExecuted).toBe(5);
      expect(results[0].tier).toBe('VERIFIED');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Case D — Heterogeneous / polyglot repository
  // -------------------------------------------------------------------------
  it('Case D: Heterogeneous / polyglot repository surfaces multiple explicit targets without bare pytest', () => {
    const repo = createTempGitRepo();
    try {
      // Multi-ecosystem: Node package.json + Rust Cargo.toml + generic tests/ folder
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'polyglot', scripts: { test: 'vitest run', lint: 'eslint .' } }, null, 2)
      );
      fs.writeFileSync(
        path.join(repo, 'Cargo.toml'),
        '[package]\nname = "rust-core"\nversion = "0.1.0"\n'
      );
      // Unconfigured tests/ folder (e.g. Omnicap Swift/ML style)
      fs.mkdirSync(path.join(repo, 'tests'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'tests', 'dummy.py'), '# unconfigured\n');
      commitAll(repo, 'Polyglot setup');

      const targets = discoverVerificationTargets(repo);
      const targetNames = targets.map((t) => t.name);
      const commands = targets.map((t) => t.command);

      // Contains Node tests & lint, Rust tests & check
      expect(commands).toContain('cargo');
      expect(commands).not.toContain('pytest'); // MUST NOT invent bare pytest
      expect(targetNames).toContain('tests');
      expect(targetNames).toContain('lint');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Case E — Invocation failure
  // -------------------------------------------------------------------------
  it('Case E: Invocation failure reports INVOCATION_FAILED and tier UNKNOWN, not TESTS_FAILED', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, '.wtfrc.json'),
        JSON.stringify({
          verify: [
            {
              name: 'missing-runner',
              command: 'nonexistent-binary-for-wtf-test-xyz',
              args: ['--run'],
            },
          ],
        }, null, 2)
      );
      commitAll(repo, 'Add invalid binary contract');

      const results = runVerificationV0(repo);
      expect(results.length).toBe(1);
      expect(results[0].lifecycle).toBe('INVOCATION_FAILED');
      expect(results[0].invocation).toBe('FAILED');
      expect(results[0].status).toBe('UNKNOWN');
      expect(results[0].testsExecuted).toBe('UNKNOWN');
      expect(results[0].tier).toBe('UNKNOWN');
      expect(results[0].provenance).toBe('UNKNOWN');

      // Legacy adapter maps invocation failure without claiming test failure
      const legacy = runVerification(repo);
      expect(legacy[0].status).toBe('INVOCATION_FAILED');
      expect(legacy[0].tier).toBe('UNKNOWN');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Case F — Timeout
  // -------------------------------------------------------------------------
  it('Case F: Timeout reports TIMEOUT and tier UNKNOWN, not false test failure', () => {
    const repo = createTempGitRepo();
    try {
      // Use a node command that sleeps longer than timeoutMs
      fs.writeFileSync(
        path.join(repo, '.wtfrc.json'),
        JSON.stringify({
          verify: [
            {
              name: 'slow-test',
              command: 'node',
              args: ['-e', 'setTimeout(() => { console.log("done"); }, 3000)'],
            },
          ],
        }, null, 2)
      );
      commitAll(repo, 'Add slow test');

      // Test with small timeout (100ms) without waiting 120 seconds
      const results = runVerificationV0(repo, undefined, { timeoutMs: 100 });
      expect(results.length).toBe(1);
      expect(results[0].lifecycle).toBe('TIMEOUT');
      expect(results[0].status).toBe('TIMEOUT');
      expect(results[0].testsExecuted).toBe('UNKNOWN');
      expect(results[0].tier).toBe('UNKNOWN');
      expect(results[0].provenance).toBe('UNKNOWN');

      const legacy = runVerification(repo, undefined, { timeoutMs: 100 });
      expect(legacy[0].status).toBe('TIMEOUT');
      expect(legacy[0].tier).toBe('UNKNOWN');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Case G — Build failure before tests
  // -------------------------------------------------------------------------
  it('Case G: Build failure before tests reports BUILD_FAILED with testsExecuted UNKNOWN', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, '.wtfrc.json'),
        JSON.stringify({
          verify: [
            {
              name: 'build-step',
              command: 'node',
              args: ['-e', 'console.error("error: could not compile my_lib due to 1 previous error"); process.exit(101)'],
            },
          ],
        }, null, 2)
      );
      commitAll(repo, 'Add compile error simulation');

      const results = runVerificationV0(repo);
      expect(results.length).toBe(1);
      expect(results[0].lifecycle).toBe('BUILD_FAILED');
      expect(results[0].compilation).toBe('FAILED');
      expect(results[0].status).toBe('FAILED');
      expect(results[0].testsExecuted).toBe('UNKNOWN'); // Critical invariant: tests never ran
      expect(results[0].tier).toBe('VERIFIED');
      expect(results[0].provenance).toBe('VERIFIED');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Case H — Tests actually fail
  // -------------------------------------------------------------------------
  it('Case H: Tests actually fail reports TESTS_FAILED with verified test count', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, '.wtfrc.json'),
        JSON.stringify({
          verify: [
            {
              name: 'failing-suite',
              command: 'node',
              args: ['-e', 'console.log("Tests: 2 failed, 3 passed, 5 total"); process.exit(1)'],
            },
          ],
        }, null, 2)
      );
      commitAll(repo, 'Add failing test simulation');

      const results = runVerificationV0(repo);
      expect(results.length).toBe(1);
      expect(results[0].lifecycle).toBe('TESTS_FAILED');
      expect(results[0].compilation).toBe('VALID');
      expect(results[0].status).toBe('FAILED');
      expect(results[0].testsExecuted).toBe(5);
      expect(results[0].tier).toBe('VERIFIED');
      expect(results[0].provenance).toBe('VERIFIED');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Case I — Tests pass
  // -------------------------------------------------------------------------
  it('Case I: Tests pass reports TESTS_PASSED and preserves UNKNOWN task intent', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, '.wtfrc.json'),
        JSON.stringify({
          verify: [
            {
              name: 'passing-suite',
              command: 'node',
              args: ['-e', 'console.log("Tests: 5 passed, 5 total"); process.exit(0)'],
            },
          ],
        }, null, 2)
      );
      commitAll(repo, 'Add passing test simulation');

      const results = runVerificationV0(repo);
      expect(results.length).toBe(1);
      expect(results[0].lifecycle).toBe('TESTS_PASSED');
      expect(results[0].status).toBe('PASSED');
      expect(results[0].testsExecuted).toBe(5);
      expect(results[0].tier).toBe('VERIFIED');

      // Verify that analyzeRepo & formatAgent preserve task intent correctness as UNKNOWN
      const analyzeResult = analyzeRepo(repo, { verify: true });
      const output = formatAgent(analyzeResult);

      expect(output).toContain('## VERIFIED');
      expect(output).toContain('✓ passing-suite: passed');
      expect(output).toContain('## UNKNOWN');
      expect(output).toContain(
        'Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)'
      );
      expect(output).toContain('WTF-RECEIPT: v0.1');
      expect(output).toContain('VERIFIED (1/1)');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });
});
