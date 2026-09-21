import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { analyzeRepo } from '../src/core/evidence.js';
import { formatTerminal } from '../src/formatters/terminal.js';
import { formatJson } from '../src/formatters/json.js';
import { formatShow } from '../src/formatters/show.js';

function createTempGitRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-gauntlet-'));
  execSync('git init -b main', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Gauntlet Tester"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "test@wtf.dev"', { cwd: dir, stdio: 'pipe' });
  return dir;
}

const stripAnsi = (str: string) => str.replace(/\u001b\[[0-9;]*m/g, '');

function commitAll(dir: string, message: string): void {
  execSync('git add -A', { cwd: dir, stdio: 'pipe' });
  execSync(`git commit -m "${message}"`, { cwd: dir, stdio: 'pipe' });
}

describe('WTF 100-Point Acceptance Gauntlet Loop', () => {
  let score = 0;
  const breakdown: Record<string, number> = {};

  function recordScore(scenario: string, points: number, maxPoints: number = 10) {
    score += points;
    breakdown[scenario] = points;
    console.log(`[GAUNTLET] ${scenario}: ${points}/${maxPoints} pts`);
  }

  afterAll(() => {
    console.log('\n========================================');
    console.log(`FINAL GAUNTLET SCORE: ${score} / 100`);
    console.log('Score Breakdown:', JSON.stringify(breakdown, null, 2));
    console.log('========================================\n');
  });

  // Scenario 1: Trivial clean change (10 pts)
  it('Scenario 1: Trivial clean change (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(path.join(repo, 'README.md'), '# Project\nInitial docs.\n');
      commitAll(repo, 'Initial commit');

      // Make trivial clean change: 1 line edit
      fs.writeFileSync(path.join(repo, 'README.md'), '# Project\nUpdated docs with typo fix.\n');

      const start = Date.now();
      const result = analyzeRepo(repo);
      const elapsed = Date.now() - start;

      const output = stripAnsi(formatTerminal(result));

      expect(result.receipt.change.totalFiles).toBe(1);
      expect(result.receipt.change.meaningfulLines).toBeGreaterThanOrEqual(1);
      expect(result.receipt.payAttention.length).toBe(0);
      expect(output).toContain('WTF — what just happened?');
      expect(output).toContain('1 file changed');
      expect(elapsed).toBeLessThan(500); // <500ms

      recordScore('Scenario 1: Trivial clean change', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // Scenario 2: Large mechanical / generated change (10 pts)
  it('Scenario 2: Large mechanical / generated change (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(path.join(repo, 'src.ts'), 'export const a = 1;\n');
      fs.writeFileSync(path.join(repo, 'package-lock.json'), '{\n  "name": "pkg"\n}\n');
      commitAll(repo, 'Initial commit');

      // Add 2 lines to src.ts, but 4,000 lines to package-lock.json
      fs.writeFileSync(path.join(repo, 'src.ts'), 'export const a = 1;\nexport const b = 2;\nexport const c = 3;\n');
      const bigLockLines = Array.from({ length: 4000 }, (_, i) => `    "line_${i}": "resolved_${i}",`).join('\n');
      fs.writeFileSync(path.join(repo, 'package-lock.json'), `{\n  "name": "pkg",\n  "packages": {\n${bigLockLines}\n  }\n}\n`);

      const result = analyzeRepo(repo);
      const output = stripAnsi(formatTerminal(result));

      expect(result.receipt.change.mechanicalLines).toBeGreaterThanOrEqual(4000);
      expect(result.receipt.change.meaningfulLines).toBeLessThanOrEqual(5);
      expect(result.receipt.change.compressionRatio).toBeGreaterThanOrEqual(0.95);
      expect(output).toContain('Most changes appear mechanical/generated');
      expect(output).toContain('Review surface:');
      expect(output).toMatch(/~[0-9]+ meaningful lines/);

      recordScore('Scenario 2: Large mechanical change', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // Scenario 3: Dependency addition (10 pts)
  it('Scenario 3: Dependency addition (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      const initialPkg = {
        name: 'app',
        dependencies: {
          react: '^18.0.0',
        },
      };
      fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify(initialPkg, null, 2));
      commitAll(repo, 'Initial commit');

      // Add a dependency
      const updatedPkg = {
        name: 'app',
        dependencies: {
          react: '^18.0.0',
          express: '^4.18.2',
        },
      };
      fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify(updatedPkg, null, 2));

      const result = analyzeRepo(repo);
      const output = stripAnsi(formatTerminal(result));

      expect(result.alsoSummary).toContain('+ 1 dependency');
      expect(output).toContain('+ 1 dependency');
      const depFinding = result.receipt.also.find((f) => f.category === 'DEPENDENCY');
      expect(depFinding).toBeDefined();
      expect(depFinding?.description).toContain('express@^4.18.2');

      recordScore('Scenario 3: Dependency addition', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // Scenario 4: Database schema migration (10 pts)
  it('Scenario 4: Database schema migration (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'db'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'db', '0001_init.sql'), 'CREATE TABLE users (id INT);\n');
      commitAll(repo, 'Initial commit');

      // Add new migration changing account ownership and dropping table
      const migrationSql = `
ALTER TABLE accounts OWNER TO service_admin;
DROP TABLE obsolete_tokens;
      `.trim();
      fs.writeFileSync(path.join(repo, 'db', '0042_accounts.sql'), migrationSql);

      const result = analyzeRepo(repo);
      const output = stripAnsi(formatTerminal(result));

      expect(result.receipt.payAttention.length).toBeGreaterThanOrEqual(1);
      const dbFinding = result.receipt.payAttention.find((f) => f.category === 'DATABASE');
      expect(dbFinding).toBeDefined();
      expect(output).toContain('OBSERVED RELATIONS');
      expect(output).toContain('DATABASE');
      expect(output).toContain('db/0042_accounts.sql');

      recordScore('Scenario 4: Database migration', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // Scenario 5: Auth-sensitive change (10 pts)
  it('Scenario 5: Auth-sensitive change (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'auth'), { recursive: true });
      fs.writeFileSync(
        path.join(repo, 'auth', 'session.ts'),
        'export const sessionTimeout = 1800;\n'
      );
      commitAll(repo, 'Initial commit');

      // Change session expiry/timeout
      fs.writeFileSync(
        path.join(repo, 'auth', 'session.ts'),
        'export const sessionTimeout = 86400;\nexport const maxAge = 86400;\n'
      );

      const result = analyzeRepo(repo);
      const output = stripAnsi(formatTerminal(result));

      expect(result.receipt.payAttention.length).toBeGreaterThanOrEqual(1);
      const authFinding = result.receipt.payAttention.find((f) => f.category === 'AUTH');
      expect(authFinding).toBeDefined();
      expect(authFinding?.title).toContain('Session expiry');
      expect(output).toContain('OBSERVED RELATIONS');
      expect(output).toContain('AUTH');
      expect(output).toContain('auth/session.ts');

      recordScore('Scenario 5: Auth-sensitive change', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // Scenario 6: Failing tests (10 pts)
  it('Scenario 6: Failing tests (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      const pkg = {
        name: 'failing-test-project',
        scripts: {
          test: 'node -e "console.error(\'FAIL: auth.test.js: password mismatch\'); process.exit(1)"',
        },
      };
      fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify(pkg, null, 2));
      fs.writeFileSync(path.join(repo, 'index.js'), 'module.exports = {};\n');
      commitAll(repo, 'Initial commit');

      // Run with verify: true
      const result = analyzeRepo(repo, { verify: true });
      const output = stripAnsi(formatTerminal(result));

      const testVerification = result.receipt.verification.find((v) => v.name === 'tests');
      expect(testVerification).toBeDefined();
      expect(testVerification?.status).toBe('FAILED');
      expect(testVerification?.tier).toBe('VERIFIED');
      expect(output).toContain('FAILED');

      recordScore('Scenario 6: Failing tests', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // Scenario 7: Skipped or disabled tests (10 pts)
  it('Scenario 7: Skipped or disabled test (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'test'), { recursive: true });
      fs.writeFileSync(
        path.join(repo, 'test', 'auth.test.ts'),
        'it("validates token", () => {});\n'
      );
      commitAll(repo, 'Initial commit');

      // Introduce a skipped test
      fs.writeFileSync(
        path.join(repo, 'test', 'auth.test.ts'),
        'it("validates token", () => {});\nit.skip("validates refresh token", () => {});\n'
      );

      const result = analyzeRepo(repo);
      const output = stripAnsi(formatTerminal(result));

      expect(result.alsoSummary).toContain('⚠ 1 skipped test');
      expect(output).toContain('⚠ 1 skipped test');
      const testFinding = result.receipt.payAttention.find(
        (f) => f.category === 'TESTS' && f.title.includes('skipped')
      );
      expect(testFinding).toBeDefined();

      recordScore('Scenario 7: Skipped test', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // Scenario 8: Clean successful change with full verification (10 pts)
  it('Scenario 8: Clean successful change with full verification (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      const pkg = {
        name: 'passing-project',
        scripts: {
          test: 'node -e "console.log(\'Tests  42 passed (42)\'); process.exit(0)"',
          typecheck: 'node -e "process.exit(0)"',
        },
      };
      fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify(pkg, null, 2));
      fs.writeFileSync(path.join(repo, 'index.js'), 'export const meaning = 42;\n');
      commitAll(repo, 'Initial commit');

      // Make a clean change
      fs.writeFileSync(path.join(repo, 'index.js'), 'export const meaning = 42;\nexport const name = "WTF";\n');

      const result = analyzeRepo(repo, { verify: true });
      const output = stripAnsi(formatTerminal(result));

      expect(result.receipt.verification.every((v) => v.status === 'PASSED')).toBe(true);
      expect(result.receipt.verified.some((v) => v.includes('tests: passed'))).toBe(true);
      expect(output).toContain('✓ tests');
      expect(output).toContain('42/42');
      expect(output).toContain('✓ typecheck');

      recordScore('Scenario 8: Clean verified change', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // Scenario 9: Mixed unrelated changes & debug leftovers (10 pts)
  it('Scenario 9: Mixed unrelated changes & debug leftovers (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(path.join(repo, 'api.ts'), 'export function fetch() {}\n');
      fs.writeFileSync(path.join(repo, 'ui.ts'), 'export function render() {}\n');
      commitAll(repo, 'Initial commit');

      // Add debug leftovers & TODO in production files
      fs.writeFileSync(
        path.join(repo, 'api.ts'),
        'export function fetch() {\n  console.log("DEBUG: fetch call");\n  // TODO: remove debug log\n}\n'
      );
      fs.writeFileSync(
        path.join(repo, 'ui.ts'),
        'export function render() {\n  debugger;\n}\n'
      );

      const result = analyzeRepo(repo);
      const output = formatTerminal(result);

      expect(result.alsoSummary.some((s) => s.includes('debug statement'))).toBe(true);
      expect(result.alsoSummary.some((s) => s.includes('TODO/FIXME'))).toBe(true);
      expect(output).toMatch(/⚠ [0-9]+ debug statement/);
      expect(result.receipt.change.totalFiles).toBe(2);

      recordScore('Scenario 9: Mixed unrelated & hygiene issues', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // Scenario 10: Agent & CLI Contract (10 pts)
  it('Scenario 10: Agent & CLI Contract (10 pts)', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(path.join(repo, 'hello.txt'), 'hello world\n');

      const result = analyzeRepo(repo);

      // JSON validity test
      const jsonStr = formatJson(result);
      const parsed = JSON.parse(jsonStr);

      expect(parsed.spec).toBe('wtf/protocol-v0');
      expect(parsed.repo).toBeDefined();
      expect(parsed.change).toBeDefined();
      expect(parsed.relation).toBeDefined();
      expect(parsed.verification).toBeDefined();
      expect(parsed.unknown).toBeDefined();
      expect(parsed.legacy).toBeDefined();
      expect(Array.isArray(parsed.legacy.payAttention)).toBe(true);
      expect(Array.isArray(parsed.legacy.also)).toBe(true);

      // Show formatter validity test
      const showStr = formatShow(result);
      expect(showStr).toContain('WTF SHOW');

      recordScore('Scenario 10: Agent & CLI contract', 10);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });
});
