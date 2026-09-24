import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';
import { buildPathTree, renderPathTreeMarkdown } from '../src/core/path-tree.js';
import { analyzeRepo } from '../src/core/evidence.js';
import { formatAgent } from '../src/formatters/agent.js';
import { formatShow } from '../src/formatters/show.js';
import { formatJson } from '../src/formatters/json.js';

function createTempGitRepo(): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wtf-density-test-'));
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

describe('Evidence Density — Deterministic Hierarchical Projection', () => {
  // -------------------------------------------------------------------------
  // 1. Deterministic Output
  // -------------------------------------------------------------------------
  it('1. Deterministic output: path tree projection produces identical output on repeated runs', () => {
    const files = [
      { file: 'src/verify/runner.ts', additions: 100, deletions: 10 },
      { file: 'src/core/protocol.ts', additions: 50, deletions: 5 },
      { file: 'docs/research/spec.md', additions: 200, deletions: 0 },
      { file: 'package.json', additions: 2, deletions: 2 },
      { file: 'test/runner.test.ts', additions: 80, deletions: 0 },
    ];

    const tree1 = buildPathTree(files);
    const tree2 = buildPathTree(files);
    expect(tree1).toEqual(tree2);

    const rendered1 = renderPathTreeMarkdown(tree1);
    const rendered2 = renderPathTreeMarkdown(tree2);
    expect(rendered1).toEqual(rendered2);
  });

  // -------------------------------------------------------------------------
  // 2. Single-Child Prefix Folding (Radix Trie Compaction)
  // -------------------------------------------------------------------------
  it('2. Single-child prefix folding: folds single-child directory chains without branching', () => {
    const files = [
      { file: 'docs/research/specs/protocol.md', additions: 10, deletions: 0 },
      { file: 'Sources/Omnicap/App.swift', additions: 5, deletions: 1 },
    ];

    const tree = buildPathTree(files);
    const clusterPaths = tree.clusters.map((c) => c.path);

    // docs -> research -> specs folds to docs/research/specs/
    expect(clusterPaths).toContain('docs/research/specs/');
    // Sources -> Omnicap folds to Sources/Omnicap/
    expect(clusterPaths).toContain('Sources/Omnicap/');
  });

  // -------------------------------------------------------------------------
  // 3. Root Namespace Projection
  // -------------------------------------------------------------------------
  it('3. Root namespace projection: projects top-level clusters with aggregate file counts and line deltas', () => {
    const files = [
      { file: 'src/core/a.ts', additions: 10, deletions: 2 },
      { file: 'src/verify/b.ts', additions: 20, deletions: 3 },
      { file: 'test/a.test.ts', additions: 15, deletions: 0 },
    ];

    const tree = buildPathTree(files);
    const srcCluster = tree.clusters.find((c) => c.path === 'src/');
    const testCluster = tree.clusters.find((c) => c.path === 'test/');

    expect(srcCluster).toBeDefined();
    expect(srcCluster!.fileCount).toBe(2);
    expect(srcCluster!.additions).toBe(30);
    expect(srcCluster!.deletions).toBe(5);

    expect(testCluster).toBeDefined();
    expect(testCluster!.fileCount).toBe(1);
    expect(testCluster!.additions).toBe(15);
  });

  // -------------------------------------------------------------------------
  // 4. Tier 2 Child Projection
  // -------------------------------------------------------------------------
  it('4. Tier 2 child projection: projects immediate child directories under namespaces', () => {
    const files = [
      { file: 'src/core/protocol.ts', additions: 100, deletions: 0 },
      { file: 'src/core/compiler.ts', additions: 50, deletions: 0 },
      { file: 'src/verify/runner.ts', additions: 539, deletions: 30 },
      { file: 'src/cli.ts', additions: 40, deletions: 5 },
      { file: 'docs/readme.md', additions: 10, deletions: 0 },
    ];

    const tree = buildPathTree(files);
    const srcCluster = tree.clusters.find((c) => c.path === 'src/')!;

    // Direct file in src/ (cli.ts)
    expect(srcCluster.directFiles.length).toBe(1);
    expect(srcCluster.directFiles[0].file).toBe('src/cli.ts');

    // Child directories under src/: core and verify
    const childNames = srcCluster.children.map((ch) => ch.name);
    expect(childNames).toContain('core');
    expect(childNames).toContain('verify');

    const verifyChild = srcCluster.children.find((ch) => ch.name === 'verify')!;
    expect(verifyChild.fileCount).toBe(1);
    expect(verifyChild.additions).toBe(539);
    expect(verifyChild.singleFileName).toBe('runner.ts');
  });

  // -------------------------------------------------------------------------
  // 5. 6 Sibling Ceiling Behavior
  // -------------------------------------------------------------------------
  it('5. Sibling ceiling: collapses siblings beyond ceiling into an explicit aggregate', () => {
    // 8 distinct skill directories under Skills/
    const files = [
      { file: 'Skills/Alpha/script.py', additions: 10, deletions: 0 },
      { file: 'Skills/Beta/script.py', additions: 10, deletions: 0 },
      { file: 'Skills/Gamma/script.py', additions: 10, deletions: 0 },
      { file: 'Skills/Delta/script.py', additions: 10, deletions: 0 },
      { file: 'Skills/Epsilon/script.py', additions: 10, deletions: 0 },
      { file: 'Skills/Zeta/script.py', additions: 10, deletions: 0 },
      { file: 'Skills/Eta/script.py', additions: 10, deletions: 0 },
      { file: 'Skills/Theta/script.py', additions: 10, deletions: 0 },
    ];

    const tree = buildPathTree(files, { siblingCeiling: 6 });
    const skillsCluster = tree.clusters.find((c) => c.path === 'Skills/')!;

    // Exactly 6 visible children + 1 collapsed group = 7 items
    expect(skillsCluster.children.length).toBe(7);

    const first6 = skillsCluster.children.slice(0, 6).map((c) => c.name);
    expect(first6).toEqual(['Alpha', 'Beta', 'Delta', 'Epsilon', 'Eta', 'Gamma']);

    const collapsedNode = skillsCluster.children[6];
    expect(collapsedNode.isCollapsedGroup).toBe(true);
    expect(collapsedNode.name).toBe('... and 2 other directories');
    expect(collapsedNode.fileCount).toBe(2);
    expect(collapsedNode.additions).toBe(20);
    expect(collapsedNode.collapsedPaths).toEqual(['Skills/Theta', 'Skills/Zeta']);
  });

  // -------------------------------------------------------------------------
  // 6. Collapsed Sibling Identity and Retrievability
  // -------------------------------------------------------------------------
  it('6. Collapsed sibling identity and retrievability: collapsed directories remain queryable via formatShow', () => {
    const repo = createTempGitRepo();
    try {
      // Create 8 subdirectories under modules/
      for (const mod of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        fs.mkdirSync(path.join(repo, 'modules', mod), { recursive: true });
        fs.writeFileSync(path.join(repo, 'modules', mod, 'index.ts'), `export const ${mod} = 1;\n`);
      }

      const result = analyzeRepo(repo);

      // Verify formatShow without filter includes all changed files losslessly
      const showAll = formatShow(result);
      expect(showAll).toContain('modules/a/index.ts');
      expect(showAll).toContain('modules/h/index.ts');

      // Verify formatShow with specific path filter retrieves exact files
      const showFiltered = formatShow(result, 'modules/h');
      expect(showFiltered).toContain('modules/h/index.ts');
      expect(showFiltered).not.toContain('modules/a/index.ts');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 7. No Files Disappearing from Underlying Evidence
  // -------------------------------------------------------------------------
  it('7. No files disappear: CanonicalEvidenceDocumentV0 preserves all files losslessly', () => {
    const repo = createTempGitRepo();
    try {
      for (let i = 1; i <= 20; i++) {
        fs.mkdirSync(path.join(repo, `dir${i}`), { recursive: true });
        fs.writeFileSync(path.join(repo, `dir${i}`, 'file.ts'), `export const x${i} = ${i};\n`);
      }

      const result = analyzeRepo(repo);

      // Canonical evidence contains all 20 files
      expect(result.evidence.change.files.length).toBe(20);

      // JSON serializer exposes all 20 files
      const jsonStr = formatJson(result.evidence);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.change.files.length).toBe(20);

      // Agent output uses projection without dumping flat list
      const agentOut = formatAgent(result);
      expect(agentOut).toContain('20 application files changed');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 8. Relation Aggregation
  // -------------------------------------------------------------------------
  it('8. Relation aggregation: compacts repeated instances of the same predicate', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'src', 'auth'), { recursive: true });
      // Create 3 files matching auth surface token
      fs.writeFileSync(path.join(repo, 'src', 'auth', 'a.ts'), 'export const maxAge = 100;\n');
      fs.writeFileSync(path.join(repo, 'src', 'auth', 'b.ts'), 'export const maxAge = 200;\n');
      fs.writeFileSync(path.join(repo, 'src', 'auth', 'c.ts'), 'export const maxAge = 300;\n');

      const result = analyzeRepo(repo);
      const agentOut = formatAgent(result);

      // Aggregates into token matches line
      expect(agentOut).toContain('[auth-surface]');
      expect(agentOut).toContain('3 token matches across');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 9. Underlying Relation Retrievability
  // -------------------------------------------------------------------------
  it('9. Underlying relation retrievability: all individual relations remain in canonical evidence', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'src', 'auth'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'src', 'auth', 'a.ts'), 'export const maxAge = 100;\n');
      fs.writeFileSync(path.join(repo, 'src', 'auth', 'b.ts'), 'export const maxAge = 200;\n');

      const result = analyzeRepo(repo);

      // Canonical evidence has each individual relation
      expect(result.evidence.relation.items.length).toBe(2);
      expect(result.evidence.relation.items[0].subject?.file).toBe('src/auth/a.ts');
      expect(result.evidence.relation.items[1].subject?.file).toBe('src/auth/b.ts');

      // formatShow provides full details for each relation
      const showOut = formatShow(result);
      expect(showOut).toContain('src/auth/a.ts');
      expect(showOut).toContain('src/auth/b.ts');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 10. Small Changes Remain Readable
  // -------------------------------------------------------------------------
  it('10. Small changes remain readable: <= 4 files are listed directly without unnecessary nesting', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'src', 'app.ts'), 'export const a = 1;\n');
      fs.writeFileSync(path.join(repo, 'src', 'util.ts'), 'export const b = 2;\n');

      const result = analyzeRepo(repo);
      const agentOut = formatAgent(result);

      // Directly lists files
      expect(agentOut).toContain('• src/app.ts');
      expect(agentOut).toContain('• src/util.ts');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 11. Canonical Document Remains Unchanged by Projection
  // -------------------------------------------------------------------------
  it('11. Canonical document remains unchanged: projection is strictly a read-only view', () => {
    const repo = createTempGitRepo();
    try {
      fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
      fs.writeFileSync(path.join(repo, 'src', 'x.ts'), 'export const x = 1;\n');

      const result = analyzeRepo(repo);
      const snapshotBefore = JSON.stringify(result.evidence);

      formatAgent(result);
      formatAgent(result.evidence);

      const snapshotAfter = JSON.stringify(result.evidence);
      expect(snapshotBefore).toBe(snapshotAfter);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 12. Regression: Opaque "... and N more files" Black Hole Eliminated
  // -------------------------------------------------------------------------
  it('12. Regression: eliminates the "... and N more files" black hole on large changes', () => {
    const repo = createTempGitRepo();
    try {
      // Create 15 files across 3 directories
      for (let i = 1; i <= 5; i++) {
        fs.mkdirSync(path.join(repo, 'src', 'core'), { recursive: true });
        fs.writeFileSync(path.join(repo, 'src', 'core', `f${i}.ts`), `export const c${i} = 1;\n`);
        fs.mkdirSync(path.join(repo, 'src', 'verify'), { recursive: true });
        fs.writeFileSync(path.join(repo, 'src', 'verify', `v${i}.ts`), `export const v${i} = 1;\n`);
        fs.mkdirSync(path.join(repo, 'docs'), { recursive: true });
        fs.writeFileSync(path.join(repo, 'docs', `doc${i}.md`), `# Doc ${i}\n`);
      }

      const result = analyzeRepo(repo);
      const agentOut = formatAgent(result);

      // Old behavior truncated at 8 files with "... and 7 more files"
      expect(agentOut).not.toMatch(/\.\.\. and \d+ more files/);

      // New behavior reveals the directory distribution
      expect(agentOut).toContain('• docs/ (5 files');
      expect(agentOut).toContain('• src/ (10 files');
      expect(agentOut).toContain('core/ (5 files');
      expect(agentOut).toContain('verify/ (5 files');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // -------------------------------------------------------------------------
  // 13. Omnicap 225-File Specimen Reconciliation & Retrievability
  // -------------------------------------------------------------------------
  it('13. Omnicap 225-file specimen: all 225 canonical files remain present and retrievable across collapsed siblings', () => {
    const omnicapFiles: Array<{ file: string; additions: number; deletions: number }> = [];

    // 1. Sources/Omnicap (18 files: +1846 / -412)
    // Foundation: 12 files (+920 / -180)
    for (let i = 1; i <= 12; i++) {
      omnicapFiles.push({ file: `Sources/Omnicap/Foundation/Service${i}.swift`, additions: 76 + (i === 1 ? 8 : 0), deletions: 15 });
    }
    // Views: 4 files (+720 / -150)
    for (let i = 1; i <= 4; i++) {
      omnicapFiles.push({ file: `Sources/Omnicap/Views/View${i}.swift`, additions: 180, deletions: 37 + (i === 1 ? 2 : 0) });
    }
    // Models: 2 files (+206 / -82)
    omnicapFiles.push({ file: 'Sources/Omnicap/Models/Model1.swift', additions: 103, deletions: 41 });
    omnicapFiles.push({ file: 'Sources/Omnicap/Models/Model2.swift', additions: 103, deletions: 41 });

    // 2. Skills (207 files: +36509 / -30)
    // YuEMusic: 182 files (+34920 / -11)
    for (let i = 1; i <= 182; i++) {
      omnicapFiles.push({ file: `Skills/YuEMusic/module${i}.py`, additions: 191 + (i === 1 ? 158 : 0), deletions: i <= 11 ? 1 : 0 });
    }
    // FastMetal: 11 files (+520 / -0)
    for (let i = 1; i <= 11; i++) {
      omnicapFiles.push({ file: `Skills/FastMetal/test${i}.py`, additions: 47 + (i === 1 ? 3 : 0), deletions: 0 });
    }
    // ClipDirector: 8 files (+846 / -19)
    for (let i = 1; i <= 8; i++) {
      omnicapFiles.push({ file: `Skills/ClipDirector/agent${i}.py`, additions: 105 + (i === 1 ? 6 : 0), deletions: i === 1 ? 10 : (i === 2 ? 9 : 0) });
    }
    // CreativeUpscale: 2 files (+120 / -0)
    omnicapFiles.push({ file: 'Skills/CreativeUpscale/script.py', additions: 60, deletions: 0 });
    omnicapFiles.push({ file: 'Skills/CreativeUpscale/manifest.json', additions: 60, deletions: 0 });
    // CreativeUpscaleVLM: 2 files (+73 / -0)
    omnicapFiles.push({ file: 'Skills/CreativeUpscaleVLM/script.py', additions: 36, deletions: 0 });
    omnicapFiles.push({ file: 'Skills/CreativeUpscaleVLM/manifest.json', additions: 37, deletions: 0 });
    // JANGEngine: 1 file (+15 / -0)
    omnicapFiles.push({ file: 'Skills/JANGEngine/test.py', additions: 15, deletions: 0 });
    // OmnicapMCP: 1 file (+15 / -0)
    omnicapFiles.push({ file: 'Skills/OmnicapMCP/client.py', additions: 15, deletions: 0 });

    // Verify raw specimen metrics
    expect(omnicapFiles.length).toBe(225);
    const totalAdditions = omnicapFiles.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = omnicapFiles.reduce((sum, f) => sum + f.deletions, 0);
    expect(totalAdditions).toBe(38355);
    expect(totalDeletions).toBe(442);

    // Build canonical document
    const canonicalDoc = {
      version: 'wtf/0.1' as const,
      timestamp: new Date().toISOString(),
      repo: { root: '/Users/linus/Projects/Omniclip', head: '415db84' },
      change: {
        base: '415db84',
        files: omnicapFiles,
        totalFiles: omnicapFiles.length,
        additions: totalAdditions,
        deletions: totalDeletions,
      },
      diagnostic: { items: [] },
      relation: { items: [] },
      verification: { items: [] },
      unknown: { items: [{ category: 'TASK_INTENT' as const, statement: 'Task intent correctness: unverified' }] },
    };

    // 1. Projection does not mutate canonical document
    const snapshotBefore = JSON.stringify(canonicalDoc);
    const tree = buildPathTree(canonicalDoc.change.files);
    const rendered = renderPathTreeMarkdown(tree);
    const snapshotAfter = JSON.stringify(canonicalDoc);
    expect(snapshotBefore).toBe(snapshotAfter);

    // 2. Structural distribution exposed
    const renderedText = rendered.join('\n');
    expect(renderedText).toContain('Sources/Omnicap/ (18 files');
    expect(renderedText).toContain('Skills/ (207 files');

    // 3. Sibling ceiling collapses 7th skill directory deterministically
    const skillsCluster = tree.clusters.find((c) => c.path === 'Skills/')!;
    expect(skillsCluster.children.length).toBe(7); // 6 visible + 1 collapsed group
    const collapsedNode = skillsCluster.children.find((ch) => ch.isCollapsedGroup)!;
    expect(collapsedNode).toBeDefined();
    expect(collapsedNode.collapsedPaths).toBeDefined();
    expect(collapsedNode.collapsedPaths!.length).toBeGreaterThan(0);

    // 4. Retrievability: all 225 files remain reachable through formatShow
    const showAll = formatShow(canonicalDoc);
    for (const f of omnicapFiles) {
      expect(showAll).toContain(f.file);
    }

    // 5. Collapsed directories remain retrievable via wtf show <path>
    for (const collapsedPrefix of collapsedNode.collapsedPaths!) {
      const showCollapsed = formatShow(canonicalDoc, collapsedPrefix);
      const matchingFiles = omnicapFiles.filter((f) => f.file.startsWith(collapsedPrefix));
      expect(matchingFiles.length).toBeGreaterThan(0);
      for (const mf of matchingFiles) {
        expect(showCollapsed).toContain(mf.file);
      }
    }
  });
});

