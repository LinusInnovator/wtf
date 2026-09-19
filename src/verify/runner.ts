import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { isPathInside, safeReadRepoFile } from '../core/security.js';
import type { VerificationItem } from '../types.js';

export interface DiscoveredTarget {
  name: string;
  command: string;
  args: string[];
}

export function discoverVerificationTargets(repoRoot: string): DiscoveredTarget[] {
  const targets: DiscoveredTarget[] = [];

  // 1. Node.js / package.json
  const pkgContent = safeReadRepoFile(repoRoot, 'package.json');
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      const scripts = pkg.scripts || {};

      // Determine package manager
      let pm = 'npm';
      if (fs.existsSync(path.join(repoRoot, 'pnpm-lock.yaml'))) pm = 'pnpm';
      else if (fs.existsSync(path.join(repoRoot, 'yarn.lock'))) pm = 'yarn';
      else if (fs.existsSync(path.join(repoRoot, 'bun.lockb')) || fs.existsSync(path.join(repoRoot, 'bun.lock'))) pm = 'bun';

      if (scripts.test && !scripts.test.includes('no test specified')) {
        targets.push({
          name: 'tests',
          command: pm,
          args: pm === 'npm' ? ['test'] : ['run', 'test'],
        });
      }

      if (scripts.typecheck) {
        targets.push({
          name: 'typecheck',
          command: pm,
          args: pm === 'npm' ? ['run', 'typecheck'] : ['run', 'typecheck'],
        });
      }

      if (scripts.build) {
        targets.push({
          name: 'build',
          command: pm,
          args: pm === 'npm' ? ['run', 'build'] : ['run', 'build'],
        });
      }

      if (scripts.lint) {
        targets.push({
          name: 'lint',
          command: pm,
          args: pm === 'npm' ? ['run', 'lint'] : ['run', 'lint'],
        });
      }
    } catch {
      // ignore malformed package.json
    }
  }

  // 2. Rust / Cargo.toml
  const cargoPath = path.join(repoRoot, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    targets.push({
      name: 'tests',
      command: 'cargo',
      args: ['test'],
    });
    targets.push({
      name: 'typecheck',
      command: 'cargo',
      args: ['check'],
    });
  }

  // 3. Python / pytest
  if (
    fs.existsSync(path.join(repoRoot, 'pytest.ini')) ||
    fs.existsSync(path.join(repoRoot, 'setup.cfg')) ||
    fs.existsSync(path.join(repoRoot, 'pyproject.toml')) ||
    fs.existsSync(path.join(repoRoot, 'tests'))
  ) {
    if (targets.every((t) => t.name !== 'tests')) {
      targets.push({
        name: 'tests',
        command: 'pytest',
        args: [],
      });
    }
  }

  // 4. Go / go.mod
  if (fs.existsSync(path.join(repoRoot, 'go.mod'))) {
    if (targets.every((t) => t.name !== 'tests')) {
      targets.push({
        name: 'tests',
        command: 'go',
        args: ['test', './...'],
      });
    }
  }

  return targets;
}

export function parseTestSummary(output: string): string | undefined {
  // Vitest / Jest: Tests  183 passed (183) or 183 passed, 183 total
  const vitestMatch = output.match(/Tests\s+([0-9]+)\s+passed\s+\(([0-9]+)\)/i);
  if (vitestMatch) {
    return `${vitestMatch[1]}/${vitestMatch[2]}`;
  }

  const jestMatch = output.match(/Tests:\s+([0-9]+)\s+passed,\s+([0-9]+)\s+total/i);
  if (jestMatch) {
    return `${jestMatch[1]}/${jestMatch[2]}`;
  }

  // Cargo test: test result: ok. 42 passed; 0 failed; 0 ignored
  const cargoMatch = output.match(/test result:\s+ok\.\s+([0-9]+)\s+passed/i);
  if (cargoMatch) {
    return `${cargoMatch[1]} passed`;
  }

  // Pytest: 42 passed in 1.23s
  const pytestMatch = output.match(/([0-9]+)\s+passed(?:,\s+([0-9]+)\s+skipped)?/i);
  if (pytestMatch) {
    return `${pytestMatch[1]} passed`;
  }

  // Generic exit code ok
  return undefined;
}

export function runVerification(
  repoRoot: string,
  targetNames?: string[]
): VerificationItem[] {
  const discovered = discoverVerificationTargets(repoRoot);
  const toRun = targetNames
    ? discovered.filter((t) => targetNames.includes(t.name))
    : discovered;

  const results: VerificationItem[] = [];

  for (const target of toRun) {
    const fullCmd = `${target.command} ${target.args.join(' ')}`;
    const startTime = Date.now();

    try {
      const res = spawnSync(target.command, target.args, {
        cwd: repoRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8',
        timeout: 120000, // 2 min max
      });

      const durationMs = Date.now() - startTime;
      const combinedOutput = (res.stdout || '') + '\n' + (res.stderr || '');

      if (res.status === 0) {
        const summary = parseTestSummary(combinedOutput);
        results.push({
          name: target.name,
          command: fullCmd,
          status: 'PASSED',
          summary,
          durationMs,
          tier: 'VERIFIED',
        });
      } else {
        // Find failed test snippet
        const errorLines = combinedOutput
          .split('\n')
          .filter((l) => /FAIL|Error:|failed|AssertionError/i.test(l))
          .slice(0, 5)
          .join('\n');

        results.push({
          name: target.name,
          command: fullCmd,
          status: 'FAILED',
          details: errorLines || 'Command exited with non-zero code',
          durationMs,
          tier: 'VERIFIED',
        });
      }
    } catch (err: any) {
      results.push({
        name: target.name,
        command: fullCmd,
        status: 'FAILED',
        details: err.message,
        durationMs: Date.now() - startTime,
        tier: 'VERIFIED',
      });
    }
  }

  return results;
}

export function getUnverifiedTargets(repoRoot: string): VerificationItem[] {
  const discovered = discoverVerificationTargets(repoRoot);
  return discovered.map((t) => ({
    name: t.name,
    command: `${t.command} ${t.args.join(' ')}`,
    status: 'NOT_RUN',
    tier: 'UNKNOWN',
  }));
}
