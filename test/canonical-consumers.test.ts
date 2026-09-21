import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { analyzeRepo, toLegacyReceipt } from '../src/core/evidence.js';
import { discoverVerificationTargets } from '../src/verify/runner.js';
import { formatAgent } from '../src/formatters/agent.js';
import { formatTerminal } from '../src/formatters/terminal.js';
import { formatJson } from '../src/formatters/json.js';
import { formatShow } from '../src/formatters/show.js';
import type { CanonicalEvidenceDocumentV0 } from '../src/core/protocol-v0.js';

function createTempGitRepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-canonical-test-'));
  execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.name "WTF Test"', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git config user.email "test@wtf.local"', { cwd: tmpDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tmpDir, '.gitkeep'), '');
  execSync('git add .gitkeep', { cwd: tmpDir, stdio: 'ignore' });
  execSync('git commit -m "initial commit"', { cwd: tmpDir, stdio: 'ignore' });
  return tmpDir;
}

function commitAll(cwd: string, msg: string): void {
  execSync('git add -A', { cwd, stdio: 'ignore' });
  execSync(`git commit -m "${msg}" --allow-empty`, { cwd, stdio: 'ignore' });
}

describe('Step 4.4 — Canonical Evidence Becomes the Product', () => {
  // -------------------------------------------------------------------------
  // Invariant 1: Human, agent, and JSON views originate from the same canonical evidence
  // -------------------------------------------------------------------------
  it('1. Human, agent, and JSON views originate from the same canonical evidence document', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(path.join(repo, 'file.ts'), 'export const x = 1;\n');
      commitAll(repo, 'Initial');
      fs.writeFileSync(path.join(repo, 'file.ts'), 'export const x = 2;\n');

      const result = analyzeRepo(repo);
      expect(result.evidence).toBeDefined();
      expect(result.evidence.spec).toBe('wtf/protocol-v0');

      // Feed canonical evidence document directly to all formatters
      const terminalOutput = formatTerminal(result.evidence);
      const agentOutput = formatAgent(result.evidence);
      const jsonOutput = formatJson(result.evidence);

      expect(terminalOutput).toContain('file.ts');
      expect(agentOutput).toContain('file.ts');
      expect(jsonOutput).toContain('file.ts');

      const parsedJson = JSON.parse(jsonOutput);
      expect(parsedJson.spec).toBe('wtf/protocol-v0');
      expect(parsedJson.change.files[0].file).toBe('file.ts');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 2: No formatter strengthens an epistemic claim
  // -------------------------------------------------------------------------
  it('2. No formatter strengthens an epistemic claim into unsupported certainty or causality', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'db'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'db', 'migration.sql'), 'DROP TABLE logs;\n');

      const result = analyzeRepo(repo);
      const terminalOutput = formatTerminal(result);
      const agentOutput = formatAgent(result);
      const showOutput = formatShow(result);

      // Verify no formatter claims the change is "broken", "critical", or "destructive in context"
      for (const out of [terminalOutput, agentOutput, showOutput]) {
        expect(out).not.toMatch(/\b(critical|catastrophic|broken|dangerous)\b/i);
        expect(out).toContain('DROP');
      }
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 3: Auth/session token match does not become "authentication behavior changed"
  // -------------------------------------------------------------------------
  it('3. Auth/session token match does not claim application authentication behavior changed', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'src', 'auth'), { recursive: true });
      fs.writeFileSync(
        path.join(repo, 'src', 'auth', 'session.ts'),
        'export const config = { maxAge: 3600 };\n'
      );

      const result = analyzeRepo(repo);
      const agentOutput = formatAgent(result);
      const terminalOutput = formatTerminal(result);

      // Must be described as a mechanical token match, NOT "authentication behavior modified"
      expect(agentOutput).toContain('token match');
      expect(agentOutput).not.toContain('behavior modified');
      expect(agentOutput).not.toContain('logic updated');

      expect(terminalOutput).toContain('token match');
      expect(terminalOutput).not.toContain('behavior modified');
      expect(terminalOutput).not.toContain('logic updated');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 4: UNKNOWN survives every formatter
  // -------------------------------------------------------------------------
  it('4. UNKNOWN survives every formatter unconditionally', () => {
    const repo = createTempGitRepo();
    try {
      const result = analyzeRepo(repo);
      const terminalOutput = formatTerminal(result);
      const agentOutput = formatAgent(result);
      const jsonOutput = formatJson(result);
      const showOutput = formatShow(result);

      expect(agentOutput).toContain('## UNKNOWN');
      expect(agentOutput).toContain('Task intent correctness: unverified');

      expect(showOutput).toContain('UNKNOWN');
      expect(showOutput).toContain('Task intent correctness');

      const parsed = JSON.parse(jsonOutput);
      expect(parsed.unknown.items.length).toBeGreaterThanOrEqual(1);
      expect(parsed.unknown.items[0].statement).toContain('Task intent correctness');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 5: Timeout and invocation failure remain distinct from verified failure
  // -------------------------------------------------------------------------
  it('5. Timeout and invocation failure remain distinct from verified failure in all views', () => {
    const repo = createTempGitRepo();
    try {
      // Construct synthetic canonical evidence with TIMEOUT and INVOCATION_FAILED
      const syntheticEvidence: CanonicalEvidenceDocumentV0 = {
        spec: 'wtf/protocol-v0',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        repo: { root: repo, clean: true },
        change: { status: 'none observed', files: [], provenance: 'OBSERVED' },
        diagnostic: { status: 'none', items: [], provenance: 'REPORTED' },
        relation: { status: 'none', items: [], provenance: 'MECHANICALLY_DERIVED' },
        verification: {
          status: 'unverified',
          items: [
            {
              name: 'timeout-job',
              command: 'sleep 999',
              lifecycle: 'TIMEOUT',
              invocation: 'VALID',
              status: 'TIMEOUT',
              testsExecuted: 'UNKNOWN',
              durationMs: 120000,
              tier: 'UNKNOWN',
              provenance: 'UNKNOWN',
            },
            {
              name: 'missing-runner',
              command: 'nonexistent-bin',
              lifecycle: 'INVOCATION_FAILED',
              invocation: 'FAILED',
              status: 'UNKNOWN',
              testsExecuted: 'UNKNOWN',
              tier: 'UNKNOWN',
              provenance: 'UNKNOWN',
            },
          ],
        },
        unknown: {
          items: [
            {
              category: 'task_intent_correctness',
              statement: 'Task intent correctness: unverified',
              provenance: 'UNKNOWN',
            },
          ],
          provenance: 'UNKNOWN',
        },
      };

      const agentOut = formatAgent(syntheticEvidence);
      const terminalOut = formatTerminal(syntheticEvidence);

      // Verified failure is NOT reported
      expect(agentOut).not.toContain('## FAILED');
      expect(agentOut).toContain('TIMEOUT');
      expect(agentOut).toContain('INVOCATION_FAILED');

      expect(terminalOut).toContain('TIMEOUT');
      expect(terminalOut).toContain('INVOCATION_FAILED');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 6: JSON deterministically serializes canonical evidence
  // -------------------------------------------------------------------------
  it('6. JSON deterministically serializes canonical Protocol v0 evidence with explicit versioning', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(path.join(repo, 'a.txt'), 'hello\n');
      const result = analyzeRepo(repo);

      const json1 = formatJson(result);
      const json2 = formatJson(result);
      expect(json1).toBe(json2);

      const parsed = JSON.parse(json1);
      expect(parsed.spec).toBe('wtf/protocol-v0');
      expect(parsed.version).toBe('0.1.0');
      expect(parsed.change).toBeDefined();
      expect(parsed.diagnostic).toBeDefined();
      expect(parsed.relation).toBeDefined();
      expect(parsed.verification).toBeDefined();
      expect(parsed.unknown).toBeDefined();

      // No confidence or probability scores
      expect(json1).not.toContain('confidence');
      expect(json1).not.toContain('probability');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 7: No primary formatter depends on severity: CRITICAL
  // -------------------------------------------------------------------------
  it('7. No primary formatter depends on severity: CRITICAL', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'auth'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'auth', 'login.ts'), 'export const maxAge = 999;\n');

      const result = analyzeRepo(repo);
      const agentOut = formatAgent(result);
      const terminalOut = formatTerminal(result);

      expect(agentOut).not.toContain('CRITICAL');
      expect(terminalOut).not.toContain('CRITICAL');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 8: Removing/demoting payAttention does not remove underlying evidence
  // -------------------------------------------------------------------------
  it('8. Demoting payAttention does not remove underlying evidence from canonical ledger', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'test.ts'),
        'describe.skip("disabled suite", () => {});\n'
      );

      const result = analyzeRepo(repo);

      // Canonical evidence contains the relation
      expect(result.evidence.relation.items.length).toBeGreaterThan(0);
      const skipRel = result.evidence.relation.items.find((r) => r.predicate === 'declares_skipped_test');
      expect(skipRel).toBeDefined();

      // Formatter renders the relation neutrally
      const agentOut = formatAgent(result);
      expect(agentOut).toContain('[test-skip]');
      expect(agentOut).toContain('test.ts');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 9: Passing verification does not remove task-intent UNKNOWN
  // -------------------------------------------------------------------------
  it('9. Passing verification does not remove task-intent UNKNOWN', () => {
    const repo = createTempGitRepo();
    try {
      fs.writeFileSync(
        path.join(repo, 'package.json'),
        JSON.stringify({ name: 'pkg', scripts: { test: 'node -e "process.exit(0)"' } }, null, 2)
      );
      commitAll(repo, 'Initial');

      const result = analyzeRepo(repo, { verify: true });
      const agentOut = formatAgent(result);

      // Passing checks are VERIFIED
      expect(agentOut).toContain('## VERIFIED');

      // Intent correctness remains explicitly UNKNOWN
      expect(agentOut).toContain('## UNKNOWN');
      expect(agentOut).toContain('Task intent correctness: unverified');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Invariant 10: Compatibility adapters flow strictly canonical -> legacy
  // -------------------------------------------------------------------------
  it('10. Compatibility adapter flows strictly canonical -> legacy', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'auth'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'auth', 'keys.ts'), 'export const secret = "abc";\n');

      const result = analyzeRepo(repo);

      // Legacy receipt is derived from canonical evidence
      expect(result.receipt).toBeDefined();
      expect(result.receipt.spec).toBe('wtf/0.1');
      expect(result.receipt.payAttention.length).toBeGreaterThanOrEqual(1);
      expect(result.receipt.observed.length).toBeGreaterThanOrEqual(1);

      // Canonical evidence remains clean Protocol v0
      expect(result.evidence.spec).toBe('wtf/protocol-v0');
      expect((result.evidence as any).payAttention).toBeUndefined();
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // Step 4.4.1 — Semantic Cleanup & Freeze Invariants
  // -------------------------------------------------------------------------
  describe('Step 4.4.1 — Final Semantic Cleanup & Freeze', () => {
    it('11. Canonical evidence and formatters contain zero ATTENTION properties; ATTENTION is strictly compatibility', () => {
      const repo = createTempGitRepo();
      try {
        fs.writeFileSync(path.join(repo, 'test.ts'), 'it.skip("skipped test", () => {});\n');

        const result = analyzeRepo(repo);

        // Canonical evidence has no payAttention or attention property
        expect((result.evidence as any).payAttention).toBeUndefined();
        expect((result.evidence as any).attention).toBeUndefined();

        // Formatters operate directly on canonical evidence without ATTENTION
        const agentOut = formatAgent(result.evidence);
        const terminalOut = formatTerminal(result.evidence);
        const jsonOut = formatJson(result.evidence);

        expect(agentOut).toContain('[test-skip]');
        expect(terminalOut).toContain('Test skipped or disabled');
        expect(jsonOut).toContain('declares_skipped_test');

        // Legacy receipt compatibility adapter creates payAttention
        expect(result.receipt).toBeDefined();
        expect(result.receipt.payAttention).toBeDefined();
        expect(result.receipt.payAttention.length).toBeGreaterThan(0);
      } finally {
        fs.rmSync(repo, { recursive: true, force: true });
      }
    });

    it('12. Distinguishes ecosystem_default from project_declaration and explicit_contract', () => {
      const repoA = createTempGitRepo();
      const repoB = createTempGitRepo();
      const repoC = createTempGitRepo();
      try {
        // A: ecosystem_default (Cargo.toml)
        fs.writeFileSync(path.join(repoA, 'Cargo.toml'), '[package]\nname = "foo"\nversion = "0.1.0"\n');
        const cargoTargets = discoverVerificationTargets(repoA);
        expect(cargoTargets.length).toBeGreaterThan(0);
        expect(cargoTargets[0].source).toBe('ecosystem_default');

        // B: project_declaration (package.json scripts)
        fs.writeFileSync(
          path.join(repoB, 'package.json'),
          JSON.stringify({ name: 'node-pkg', scripts: { test: 'vitest run' } })
        );
        const nodeTargets = discoverVerificationTargets(repoB);
        expect(nodeTargets.length).toBeGreaterThan(0);
        expect(nodeTargets[0].source).toBe('project_declaration');

        // C: explicit_contract (.wtfrc.json)
        fs.writeFileSync(
          path.join(repoC, '.wtfrc.json'),
          JSON.stringify({ verify: [{ name: 'custom', command: 'make check' }] })
        );
        const contractTargets = discoverVerificationTargets(repoC);
        expect(contractTargets).not.toBeNull();
        expect(contractTargets!.length).toBe(1);
        expect(contractTargets![0].source).toBe('explicit_contract');
      } finally {
        fs.rmSync(repoA, { recursive: true, force: true });
        fs.rmSync(repoB, { recursive: true, force: true });
        fs.rmSync(repoC, { recursive: true, force: true });
      }
    });

    it('13. Canonical formatters operate identically and directly on CanonicalEvidenceDocumentV0', () => {
      const repo = createTempGitRepo();
      try {
        fs.writeFileSync(path.join(repo, 'src.ts'), 'export const a = 10;\n');
        const result = analyzeRepo(repo);

        // Direct canonical document vs wrapper object for terminal & agent
        const agentDirect = formatAgent(result.evidence);
        const agentWrapped = formatAgent(result);
        expect(agentDirect).toBe(agentWrapped);

        const terminalDirect = formatTerminal(result.evidence);
        const terminalWrapped = formatTerminal(result);
        expect(terminalDirect).toBe(terminalWrapped);

        // JSON formatter directly formats canonical document without legacy envelope
        const jsonDirect = formatJson(result.evidence);
        const parsedDirect = JSON.parse(jsonDirect);
        expect(parsedDirect.spec).toBe('wtf/protocol-v0');
        expect(parsedDirect.legacy).toBeUndefined();
        expect(parsedDirect.change.files[0].file).toBe('src.ts');
      } finally {
        fs.rmSync(repo, { recursive: true, force: true });
      }
    });
  });
});

