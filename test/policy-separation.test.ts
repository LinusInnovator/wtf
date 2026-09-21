import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync, spawnSync } from 'node:child_process';
import { analyzeRepo } from '../src/core/evidence.js';
import { formatAgent } from '../src/formatters/agent.js';
import { discoverVerificationTargets } from '../src/verify/runner.js';

const CLI_PATH = path.resolve(__dirname, '../bin/wtf.js');

function createTempGitRepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-policy-test-'));
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "WTF Test"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@wtf.local"', { cwd: tmpDir, stdio: 'ignore' });
  return tmpDir;
}

function commitAll(cwd: string, msg: string): void {
  execSync('git add -A', { cwd, stdio: 'ignore' });
  execSync(`git commit -m "${msg}" --allow-empty`, { cwd, stdio: 'ignore' });
}

describe('Step 4.3 — Separation of Evidence from Policy', () => {
  // -------------------------------------------------------------------------
  // 1. Assigned auth change (Agent legitimately modifies expiresIn / maxAge)
  // -------------------------------------------------------------------------
  it('1. Assigned auth change: change observed, no CRITICAL-based exit 1', () => {
    const repo = createTempGitRepo();
    try {
      // Create project with passing test runner
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({
          name: 'auth-service',
          scripts: { test: 'node -e "console.log(\\\"Tests: 3 passed, 3 total\\\"); process.exit(0)"' },
        }, null, 2)
      );
      fs.mkdirSync(path.join(repo, 'src', 'auth'), { recursive: true });
      fs.writeFileSync(
        path.join(repo, 'src', 'auth', 'session.ts'),
        'export const sessionConfig = { expiresIn: "15m", maxAge: 900 };\n'
      );
      commitAll(repo, 'Initial session config');

      // Agent performs assigned task: change session expiry to 1 hour
      fs.writeFileSync(
        path.join(repo, 'src', 'auth', 'session.ts'),
        'export const sessionConfig = { expiresIn: "1h", maxAge: 3600 };\n'
      );

      // 1. Mechanical classification observed in analysis
      const result = analyzeRepo(repo, { verify: true });
      expect(result.receipt.change.totalFiles).toBe(1);
      expect(result.receipt.change.linesAdded).toBeGreaterThanOrEqual(1);

      // Check that finding exists as an observed mechanical fact
      const authFinding = result.receipt.payAttention.find((f) => f.category === 'AUTH');
      expect(authFinding).toBeDefined();
      expect(authFinding?.title).toContain('Session expiry');
      expect(authFinding?.evidenceTier).toBe('OBSERVED');
      // Must NOT be labeled CRITICAL
      expect(authFinding?.severity).not.toBe('CRITICAL');

      // 2. CLI Execution MUST exit 0 (verification passed; observation does NOT gate completion)
      const res = spawnSync('node', [CLI_PATH, 'check'], {
        cwd: repo,
        encoding: 'utf-8',
      });

      expect(res.status).toBe(0);
      expect(res.stdout).toContain('## VERIFIED');
      expect(res.stdout).toContain('✓ tests: passed');
      expect(res.stdout).toContain('WTF-RECEIPT:');
      expect(res.stdout).toContain('VERIFIED (1/1)');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 2. Skipped test introduced
  // -------------------------------------------------------------------------
  it('2. Skipped test introduced: deterministic evidence preserved without claiming task failure', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({
          name: 'test-pkg',
          scripts: { test: 'node -e "console.log(\\\"Tests: 1 passed, 1 total\\\"); process.exit(0)"' },
        }, null, 2)
      );
      fs.mkdirSync(path.join(repo, 'test'), { recursive: true });
      fs.writeFileSync(
        path.join(repo, 'test', 'sample.test.js'),
        'it("runs active test", () => {});\n'
      );
      commitAll(repo, 'Initial test');

      // Add a skipped test marker
      fs.writeFileSync(
        path.join(repo, 'test', 'sample.test.js'),
        'it("runs active test", () => {});\nit.skip("disabled test", () => {});\n'
      );

      const result = analyzeRepo(repo, { verify: true });
      const skipFinding = result.receipt.payAttention.find((f) => f.id.includes('test-skipped'));
      expect(skipFinding).toBeDefined();
      expect(skipFinding?.evidenceTier).toBe('OBSERVED');

      // CLI check MUST exit 0 because the executed tests passed
      const res = spawnSync('node', [CLI_PATH, 'check'], {
        cwd: repo,
        encoding: 'utf-8',
      });

      expect(res.status).toBe(0);
      expect(res.stdout).toContain('## VERIFIED');
      expect(res.stdout).toContain('✓ tests: passed');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 3. Dependency added
  // -------------------------------------------------------------------------
  it('3. Dependency added: manifest change preserved without unsupported risk judgment', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'dep-pkg', version: '1.0.0', dependencies: {} }, null, 2)
      );
      commitAll(repo, 'Initial package.json');

      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'dep-pkg', version: '1.0.0', dependencies: { 'lodash': '^4.17.21' } }, null, 2)
      );

      const result = analyzeRepo(repo);
      const depFinding = result.receipt.also.find((f) => f.category === 'DEPENDENCY');
      expect(depFinding).toBeDefined();
      expect(depFinding?.title).toContain('Added 1 dependency');
      expect(depFinding?.evidenceTier).toBe('OBSERVED');
      expect(depFinding?.severity).toBe('INFO');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 4. Migration containing DROP
  // -------------------------------------------------------------------------
  it('4. Migration containing DROP: exact operation preserved without unsupported "destructive" claims', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'db'), { recursive: true });
      fs.writeFileSync(
        path.join(repo, 'db', '0001_initial.sql'),
        'CREATE TABLE sessions (id TEXT);\n'
      );
      commitAll(repo, 'Initial schema');

      // Add migration dropping an obsolete table
      fs.writeFileSync(
        path.join(repo, 'db', '0002_cleanup.sql'),
        'DROP TABLE obsolete_tokens;\n'
      );

      const result = analyzeRepo(repo);
      const dbFinding = result.receipt.payAttention.find((f) => f.category === 'DATABASE');
      expect(dbFinding).toBeDefined();
      // Verifies exact mechanical terminology: "Schema drop operation (DROP)", not moralizing "Destructive"
      expect(dbFinding?.title).toContain('Schema drop operation (DROP)');
      expect(dbFinding?.description).toContain('DROP operation observed');
      expect(dbFinding?.severity).not.toBe('CRITICAL');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 5. Verification actually fails
  // -------------------------------------------------------------------------
  it('5. Verification actually fails: exit code 1 reflects verified execution failure', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({
          name: 'failing-pkg',
          scripts: { test: 'node -e "console.log(\\\"Tests: 1 failed, 1 total\\\"); process.exit(1)"' },
        }, null, 2)
      );
      commitAll(repo, 'Initial');

      const res = spawnSync('node', [CLI_PATH, 'check'], {
        cwd: repo,
        encoding: 'utf-8',
      });

      expect(res.status).toBe(1); // Exit 1 for verified failure
      expect(res.stdout).toContain('## FAILED');
      expect(res.stdout).toContain('✗ tests: FAILED');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 6. Verification UNKNOWN / Incomplete
  // -------------------------------------------------------------------------
  it('6. Verification UNKNOWN / Incomplete: exit code 2 is distinct from verified failure (exit 1)', () => {
    const repo = createTempGitRepo();
    try {
      // Contract with missing binary (INVOCATION_FAILED)
      fs.writeFileSync(
        path.join(repo, '.wtfrc.json'),
        JSON.stringify({
          verify: [
            {
              name: 'missing-binary-test',
              command: 'nonexistent-binary-for-wtf-exit-test',
              args: [],
            },
          ],
        }, null, 2)
      );
      commitAll(repo, 'Missing binary contract');

      const res = spawnSync('node', [CLI_PATH, 'verify'], {
        cwd: repo,
        encoding: 'utf-8',
      });

      // Exit 2: Verification incomplete / unknown (distinct from exit 1 verified failure)
      expect(res.status).toBe(2);
      expect(res.stdout).toContain('INVOCATION_FAILED');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 7. Revisit Ecosystem Execution Authorization
  // -------------------------------------------------------------------------
  it('7. Ecosystem execution authorization cleanly distinguishes contracts, declarations, and ecosystem defaults', () => {
    const repo = createTempGitRepo();
    try {
      // 1. Cargo.toml -> ecosystem_default
      fs.writeFileSync(path.join(repo, 'Cargo.toml'), '[package]\nname = "test-crate"\nversion = "0.1.0"\n');
      const cargoTargets = discoverVerificationTargets(repo);
      expect(cargoTargets[0].source).toBe('ecosystem_default');

      // 2. package.json scripts -> project_declaration
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'node-pkg', scripts: { test: 'vitest run' } }, null, 2)
      );
      const mixedTargets = discoverVerificationTargets(repo);
      const nodeTarget = mixedTargets.find((t) => t.command === 'npm' || t.command === 'pnpm' || t.command === 'yarn');
      expect(nodeTarget?.source).toBe('project_declaration');

      // 3. .wtfrc.json -> explicit_contract (outranks all)
      fs.writeFileSync(
        path.join(repo, '.wtfrc.json'),
        JSON.stringify({ verify: 'node -e "process.exit(0)"' }, null, 2)
      );
      const explicitTargets = discoverVerificationTargets(repo);
      expect(explicitTargets.length).toBe(1);
      expect(explicitTargets[0].source).toBe('explicit_contract');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });
});
