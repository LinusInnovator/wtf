import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { analyzeRepo } from '../src/core/evidence.js';
import { getGitContext, collectPatches } from '../src/core/git.js';
import { isWtfProtocolPatch } from '../src/core/classifier.js';
import { formatAgent } from '../src/formatters/agent.js';

function createTempGitRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-agent-test-'));
  execSync('git init -b main', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.name "Agent Contract Tester"', { cwd: dir, stdio: 'pipe' });
  execSync('git config user.email "agent@wtf.dev"', { cwd: dir, stdio: 'pipe' });
  return dir;
}

function commitAll(dir: string, message: string): void {
  execSync('git add -A', { cwd: dir, stdio: 'pipe' });
  execSync(`git commit -m "${message}"`, { cwd: dir, stdio: 'pipe' });
}

describe('WTF Machine-Facing Agent Contract', () => {
  const cliPath = path.resolve(__dirname, '../bin/wtf.js');

  it('1. formatAgent produces strictly zero ANSI escape sequences', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(path.join(repo, 'index.js'), 'console.log("hello world");\n');
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'agent-pkg', scripts: { test: 'node -e "process.exit(0)"' } }, null, 2)
      );
      commitAll(repo, 'Initial');

      fs.writeFileSync(path.join(repo, 'index.js'), 'console.log("hello agent");\n');

      const result = analyzeRepo(repo, { verify: true });
      const output = formatAgent(result);

      // Must contain zero ANSI CSI escape characters
      expect(output).not.toMatch(/\x1b/);
      expect(output).not.toMatch(/\u001b/);

      // Must contain all 4 epistemic tiers
      expect(output).toContain('## VERIFIED');
      expect(output).toContain('## OBSERVED');
      expect(output).toContain('## UNKNOWN');
      expect(output).toContain('WTF-RECEIPT: v0.1');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('2. Preserves strict epistemic humility in UNKNOWN section', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'agent-pkg', scripts: { test: 'node -e "process.exit(0)"' } }, null, 2)
      );
      commitAll(repo, 'Initial');

      const result = analyzeRepo(repo, { verify: true });
      const output = formatAgent(result);

      expect(output).toContain(
        'Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)'
      );
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('3. Formats test failures with ## FAILED and surfaces error details without noise', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'agent-pkg', scripts: { test: 'node -e "console.error(\\\"AssertionError: expected 1 to be 2\\\"); process.exit(1)"' } }, null, 2)
      );
      commitAll(repo, 'Initial');

      const result = analyzeRepo(repo, { verify: true });
      const output = formatAgent(result);

      expect(output).toContain('## FAILED');
      expect(output).toContain('✗ tests: FAILED');
      expect(output).toContain('AssertionError: expected 1 to be 2');
      expect(output).toContain('FAILED (1/1)');
      expect(output).not.toMatch(/\x1b/);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('4. Highlights critical attention items (e.g. auth modifications)', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'src/auth.ts'), 'export function verifyToken() { return true; }\n');
      commitAll(repo, 'Initial auth');

      fs.writeFileSync(path.join(repo, 'src/auth.ts'), 'export function verifyToken() { return false; /* bypass */ }\n');

      const result = analyzeRepo(repo, { verify: false });
      const output = formatAgent(result);

      expect(output).toContain('## PAY ATTENTION');
      expect(output).toContain('[AUTH]');
      expect(output).toContain('src/auth.ts');
      expect(output).toContain('WTF-RECEIPT: v0.1');
      expect(output).toContain('ATTENTION (1)');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('5. CLI subcommand "wtf check" runs single-turn verification and exits 0 on success', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'agent-pkg', scripts: { test: 'node -e "console.log(\\\"1/1 passed\\\"); process.exit(0)"' } }, null, 2)
      );
      commitAll(repo, 'Initial');

      fs.writeFileSync(path.join(repo, 'file.txt'), 'hello');

      const res = spawnSync('node', [cliPath, 'check'], {
        cwd: repo,
        encoding: 'utf-8',
      });

      expect(res.status).toBe(0);
      expect(res.stdout).toContain('## VERIFIED');
      expect(res.stdout).toContain('✓ tests: passed');
      expect(res.stdout).toContain('WTF-RECEIPT: v0.1');
      expect(res.stdout).not.toMatch(/\x1b/);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('6. CLI subcommand "wtf check" exits 1 when verification fails', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'agent-pkg', scripts: { test: 'node -e "console.error(\\\"SyntaxError\\\"); process.exit(1)"' } }, null, 2)
      );
      commitAll(repo, 'Initial');

      const res = spawnSync('node', [cliPath, 'check'], {
        cwd: repo,
        encoding: 'utf-8',
      });

      expect(res.status).toBe(1);
      expect(res.stdout).toContain('## FAILED');
      expect(res.stdout).toContain('✗ tests: FAILED');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('7. CLI subcommand "wtf check --json" emits machine-readable JSON schema', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'agent-pkg', scripts: { test: 'node -e "process.exit(0)"' } }, null, 2)
      );
      commitAll(repo, 'Initial');

      const res = spawnSync('node', [cliPath, 'check', '--json'], {
        cwd: repo,
        encoding: 'utf-8',
      });

      expect(res.status).toBe(0);
      const json = JSON.parse(res.stdout);
      expect(json.spec).toBe('wtf/0.1');
      expect(json.verification[0].status).toBe('PASSED');
      expect(json.verification[0].tier).toBe('VERIFIED');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('8. Clearly labels base commit in WTF-RECEIPT without claiming cryptographic authenticity', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(path.join(repo, 'file.txt'), 'version 1\n');
      commitAll(repo, 'Initial commit');

      fs.writeFileSync(path.join(repo, 'file.txt'), 'version 2\n');

      const result = analyzeRepo(repo, { verify: false });
      const output = formatAgent(result);

      expect(output).toMatch(/WTF-RECEIPT: v0\.1 \| base:[a-f0-9]{7}/);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('9. Suppresses WTF agent protocol files from application code review surface', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'src/app.js'), 'export const a = 1;\n');
      commitAll(repo, 'Initial app');

      // 1. Agent modifies application code
      fs.writeFileSync(path.join(repo, 'src/app.js'), 'export const a = 2;\n');
      // 2. WTF init-agent creates AGENTS.md with protocol
      fs.writeFileSync(
        path.join(repo, 'AGENTS.md'),
        '# Agent Guidelines\n\n## Task Completion Protocol with WTF\nBefore declaring any coding task complete:\n1. Run `wtf check`.\n2. Attach WTF-RECEIPT.\n'
      );

      const result = analyzeRepo(repo, { verify: false });
      const output = formatAgent(result);

      // Application file must be listed in OBSERVED
      expect(output).toContain('• src/app.js');
      // AGENTS.md with only WTF protocol must NOT pollute the application review surface
      expect(output).not.toContain('• AGENTS.md');
      // Meaningful lines should only count the application edit (+1/-1 = 2 lines), not the protocol template
      expect(result.receipt.change.meaningfulLines).toBe(2);
      expect(result.receipt.change.mechanicalLines).toBe(7);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('10. Does NOT hide legitimate user changes in AGENTS.md', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(path.join(repo, 'AGENTS.md'), '# Project Guidelines\n- Initial rule\n');
      commitAll(repo, 'Initial guidelines');

      // User adds a legitimate application / development instruction
      fs.writeFileSync(
        path.join(repo, 'AGENTS.md'),
        '# Project Guidelines\n- Initial rule\n- Always run PostgreSQL database migrations before starting the API server\n'
      );

      const result = analyzeRepo(repo, { verify: false });
      const output = formatAgent(result);

      // Legitimate user change must NOT be suppressed
      expect(output).toContain('• AGENTS.md');
      expect(result.receipt.change.meaningfulLines).toBeGreaterThanOrEqual(1);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  it('11. Recognizes WTF repository AGENTS.md patch as protocol', () => {
    const root = path.resolve(__dirname, '..');
    const ctx = getGitContext(root);
    const { patches } = collectPatches(ctx);
    const agentsPatch = patches.find((p) => p.path === 'AGENTS.md');
    if (agentsPatch) {
      expect(agentsPatch.isMechanical).toBe(true);
    }
  });
});

