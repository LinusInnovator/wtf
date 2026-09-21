import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { isPathInside, safeReadRepoFile } from '../core/security.js';
import type {
  VerificationItem,
  VerificationItemV0,
  VerificationLifecycleStatus,
  VerificationInvocationStatus,
  VerificationCompilationStatus,
  VerificationExecutionStatus,
} from '../types.js';

/**
 * Epistemic distinction for verification target authorization:
 *
 * - 'explicit_contract':
 *   Explicitly authorized by project owner via WTF configuration (.wtfrc.json, package.json["wtf"]).
 *
 * - 'project_declaration':
 *   Explicitly declared project test script in repository manifests (e.g. package.json scripts.test, pytest.ini).
 *
 * - 'ecosystem_default':
 *   WTF policy selecting a conventional verification operation after deterministic ecosystem detection
 *   (e.g. Cargo.toml -> cargo test, go.mod -> go test ./...).
 *   NOTE: An ecosystem default is WTF policy convention, NOT an explicit repository declaration or
 *   observed project intent.
 */
export type TargetAuthorizationSource =
  | 'explicit_contract'
  | 'project_declaration'
  | 'ecosystem_default';

export interface DiscoveredTarget {
  name: string;
  command: string;
  args: string[];
  cwd?: string;
  source: TargetAuthorizationSource;
}

export interface RunVerificationOptions {
  timeoutMs?: number;
}

/**
 * Check for an explicit WTF verification contract in:
 * 1. .wtfrc.json
 * 2. .wtf.json
 * 3. package.json ("wtf" field)
 *
 * Explicit declarations strictly outrank automatic discovery heuristics.
 */
export function checkExplicitVerificationContract(repoRoot: string): DiscoveredTarget[] | null {
  let rawJson: string | null = null;
  let sourceFile = '';

  const wtfrcPath = path.join(repoRoot, '.wtfrc.json');
  const wtfJsonPath = path.join(repoRoot, '.wtf.json');
  const pkgPath = path.join(repoRoot, 'package.json');

  if (fs.existsSync(wtfrcPath)) {
    rawJson = safeReadRepoFile(repoRoot, '.wtfrc.json');
    sourceFile = '.wtfrc.json';
  } else if (fs.existsSync(wtfJsonPath)) {
    rawJson = safeReadRepoFile(repoRoot, '.wtf.json');
    sourceFile = '.wtf.json';
  } else if (fs.existsSync(pkgPath)) {
    const pkgContent = safeReadRepoFile(repoRoot, 'package.json');
    if (pkgContent) {
      try {
        const pkg = JSON.parse(pkgContent);
        if (pkg.wtf && pkg.wtf.verify) {
          rawJson = JSON.stringify(pkg.wtf);
          sourceFile = 'package.json (wtf)';
        }
      } catch {
        // ignore malformed package.json
      }
    }
  }

  if (!rawJson) return null;

  try {
    const parsed = JSON.parse(rawJson);
    const verify = parsed.verify;
    if (!verify) return null;

    const targets: DiscoveredTarget[] = [];

    const parseCommandString = (cmdStr: string, name = 'tests', cwd?: string): DiscoveredTarget | null => {
      const parts = cmdStr.trim().split(/\s+/);
      if (parts.length === 0 || !parts[0]) return null;
      return {
        name,
        command: parts[0],
        args: parts.slice(1),
        cwd,
        source: 'explicit_contract',
      };
    };

    if (typeof verify === 'string') {
      const t = parseCommandString(verify);
      if (t) targets.push(t);
    } else if (Array.isArray(verify)) {
      for (let i = 0; i < verify.length; i++) {
        const item = verify[i];
        if (typeof item === 'string') {
          const t = parseCommandString(item, `target_${i + 1}`);
          if (t) targets.push(t);
        } else if (typeof item === 'object' && item !== null && item.command) {
          const name = item.name || `target_${i + 1}`;
          const cmd = item.command;
          const args = Array.isArray(item.args) ? item.args : [];
          targets.push({
            name,
            command: cmd,
            args,
            cwd: item.cwd,
            source: 'explicit_contract',
          });
        }
      }
    } else if (typeof verify === 'object' && verify !== null && verify.command) {
      targets.push({
        name: verify.name || 'tests',
        command: verify.command,
        args: Array.isArray(verify.args) ? verify.args : [],
        cwd: verify.cwd,
        source: 'explicit_contract',
      });
    }

    if (targets.length > 0) {
      // Validate cwd security for all declared targets
      for (const t of targets) {
        if (t.cwd) {
          if (!isPathInside(repoRoot, t.cwd)) {
            throw new Error(`Security violation: explicit verification cwd '${t.cwd}' escapes repository root`);
          }
        }
      }
      return targets;
    }
  } catch (err: any) {
    if (err.message?.includes('Security violation')) throw err;
    // ignore parse errors and fall through
  }

  return null;
}

/**
 * Conservative deterministic discovery of repository verification surfaces.
 *
 * Epistemic Rules:
 * 1. Explicit verification contract (.wtfrc.json, etc.) outranks all inference.
 * 2. Weak structural evidence (e.g. presence of generic `tests/` directory)
 *    MUST NOT authorize potentially expensive or incorrectly scoped execution.
 * 3. Heterogeneous / polyglot repositories may surface multiple explicit targets.
 * 4. If no unambiguous verification contract exists, return empty array (UNKNOWN).
 */
export function discoverVerificationTargets(repoRoot: string): DiscoveredTarget[] {
  // 1. Explicit contract outranks all inference
  const explicit = checkExplicitVerificationContract(repoRoot);
  if (explicit && explicit.length > 0) {
    return explicit;
  }

  const targets: DiscoveredTarget[] = [];

  // 2. Node.js / package.json
  const pkgContent = safeReadRepoFile(repoRoot, 'package.json');
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      const scripts = pkg.scripts || {};

      let pm = 'npm';
      if (fs.existsSync(path.join(repoRoot, 'pnpm-lock.yaml'))) pm = 'pnpm';
      else if (fs.existsSync(path.join(repoRoot, 'yarn.lock'))) pm = 'yarn';
      else if (fs.existsSync(path.join(repoRoot, 'bun.lockb')) || fs.existsSync(path.join(repoRoot, 'bun.lock'))) pm = 'bun';

      if (scripts.test && !scripts.test.includes('no test specified')) {
        targets.push({
          name: 'tests',
          command: pm,
          args: pm === 'npm' ? ['test'] : ['run', 'test'],
          source: 'project_declaration',
        });
      }

      if (scripts.typecheck) {
        targets.push({
          name: 'typecheck',
          command: pm,
          args: ['run', 'typecheck'],
          source: 'project_declaration',
        });
      }

      if (scripts.build) {
        targets.push({
          name: 'build',
          command: pm,
          args: ['run', 'build'],
          source: 'project_declaration',
        });
      }

      if (scripts.lint) {
        targets.push({
          name: 'lint',
          command: pm,
          args: ['run', 'lint'],
          source: 'project_declaration',
        });
      }
    } catch {
      // ignore malformed package.json
    }
  }

  // 3. Rust / Cargo.toml (ecosystem defaults)
  const cargoPath = path.join(repoRoot, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    targets.push({
      name: 'tests',
      command: 'cargo',
      args: ['test'],
      source: 'ecosystem_default',
    });
    targets.push({
      name: 'typecheck',
      command: 'cargo',
      args: ['check'],
      source: 'ecosystem_default',
    });
  }

  // 4. Python: ONLY with explicit deterministic configuration (project declaration)
  // CRITICAL: Bare directory `tests/` is NOT authorization for repository-wide pytest!
  let hasExplicitPythonTestConfig = false;
  if (fs.existsSync(path.join(repoRoot, 'pytest.ini'))) {
    hasExplicitPythonTestConfig = true;
  } else if (fs.existsSync(path.join(repoRoot, 'setup.cfg'))) {
    const setupCfg = safeReadRepoFile(repoRoot, 'setup.cfg') || '';
    if (setupCfg.includes('[tool:pytest]') || setupCfg.includes('[pytest]')) {
      hasExplicitPythonTestConfig = true;
    }
  } else if (fs.existsSync(path.join(repoRoot, 'tox.ini'))) {
    const toxIni = safeReadRepoFile(repoRoot, 'tox.ini') || '';
    if (toxIni.includes('[pytest]') || toxIni.includes('pytest')) {
      hasExplicitPythonTestConfig = true;
    }
  } else if (fs.existsSync(path.join(repoRoot, 'pyproject.toml'))) {
    const pyproject = safeReadRepoFile(repoRoot, 'pyproject.toml') || '';
    if (
      pyproject.includes('[tool.pytest') ||
      pyproject.includes('pytest')
    ) {
      hasExplicitPythonTestConfig = true;
    }
  }

  if (hasExplicitPythonTestConfig) {
    if (targets.every((t) => t.name !== 'tests')) {
      targets.push({
        name: 'tests',
        command: 'pytest',
        args: [],
        source: 'project_declaration',
      });
    }
  }

  // 5. Go / go.mod (ecosystem defaults)
  if (fs.existsSync(path.join(repoRoot, 'go.mod'))) {
    if (targets.every((t) => t.name !== 'tests')) {
      targets.push({
        name: 'tests',
        command: 'go',
        args: ['test', './...'],
        source: 'ecosystem_default',
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

export function parseTestsExecutedCount(output: string): number | 'UNKNOWN' {
  const vitestMatch = output.match(/Tests\s+([0-9]+)\s+passed\s+\(([0-9]+)\)/i);
  if (vitestMatch) {
    return parseInt(vitestMatch[2], 10);
  }

  const jestMatch = output.match(/Tests:\s+(?:[0-9]+\s+failed,\s+)?([0-9]+)\s+passed,\s+([0-9]+)\s+total/i);
  if (jestMatch) {
    return parseInt(jestMatch[2], 10);
  }

  const cargoMatch = output.match(/test result:\s+(?:ok|FAILED)\.\s+([0-9]+)\s+passed;\s+([0-9]+)\s+failed/i);
  if (cargoMatch) {
    return parseInt(cargoMatch[1], 10) + parseInt(cargoMatch[2], 10);
  }

  const pytestMatch = output.match(/(?:([0-9]+)\s+failed,?\s*)?([0-9]+)\s+passed/i);
  if (pytestMatch) {
    const failed = pytestMatch[1] ? parseInt(pytestMatch[1], 10) : 0;
    const passed = parseInt(pytestMatch[2], 10);
    return failed + passed;
  }

  return 'UNKNOWN';
}

/**
 * Deterministically classify a non-zero exit outcome.
 *
 * Epistemic Rules:
 * - Do not infer BUILD_FAILED or TESTS_FAILED from exit code alone.
 * - Only classify BUILD_FAILED when deterministic compiler/build error markers are present.
 * - Only classify TESTS_FAILED when deterministic test runner failure markers are present.
 * - Otherwise use PARTIAL_EXECUTION and preserve UNKNOWN tier.
 */
export function classifyExecutionFailure(
  command: string,
  targetName: string,
  combinedOutput: string,
  exitCode: number | null
): {
  lifecycle: VerificationLifecycleStatus;
  compilation: VerificationCompilationStatus;
  status: VerificationExecutionStatus;
  testsExecuted: number | 'UNKNOWN';
  tier: 'VERIFIED' | 'UNKNOWN';
  provenance: 'VERIFIED' | 'UNKNOWN';
  summary?: string;
  details?: string;
} {
  const isTypecheckOrBuildTarget = targetName === 'typecheck' || targetName === 'build';

  const hasDeterministicBuildFailure =
    isTypecheckOrBuildTarget ||
    combinedOutput.includes('error: could not compile') ||
    combinedOutput.includes('build failed') ||
    /error\[E\d+\]/i.test(combinedOutput) ||
    /error TS\d+/i.test(combinedOutput) ||
    /SyntaxError/i.test(combinedOutput) ||
    combinedOutput.includes('Cannot find module');

  const hasDeterministicTestFailure =
    /test result:\s+FAILED/i.test(combinedOutput) ||
    /failures:/i.test(combinedOutput) ||
    /Tests:\s+.*failed/i.test(combinedOutput) ||
    /\bFAIL(?:ED)?[:\s]/i.test(combinedOutput) ||
    /===+.*failed in/i.test(combinedOutput) ||
    /FAILED\s+test_/i.test(combinedOutput) ||
    /--- FAIL:/i.test(combinedOutput) ||
    /AssertionError/i.test(combinedOutput);

  const errorLines = combinedOutput
    .split('\n')
    .filter((l) => /FAIL|Error|failed|AssertionError|error\[E/i.test(l))
    .slice(0, 5)
    .join('\n');

  if (hasDeterministicBuildFailure && !hasDeterministicTestFailure) {
    return {
      lifecycle: 'BUILD_FAILED',
      compilation: 'FAILED',
      status: 'FAILED',
      testsExecuted: 'UNKNOWN',
      tier: 'VERIFIED',
      provenance: 'VERIFIED',
      details: errorLines || 'Build or compilation failed prior to test execution',
    };
  }

  if (hasDeterministicTestFailure) {
    return {
      lifecycle: 'TESTS_FAILED',
      compilation: 'VALID',
      status: 'FAILED',
      testsExecuted: parseTestsExecutedCount(combinedOutput),
      tier: 'VERIFIED',
      provenance: 'VERIFIED',
      summary: parseTestSummary(combinedOutput),
      details: errorLines || 'Tests executed and reported failure',
    };
  }

  // Exit code non-zero without deterministic confirmation of build or test failure:
  // preserve uncertainty.
  return {
    lifecycle: 'PARTIAL_EXECUTION',
    compilation: 'UNKNOWN',
    status: 'FAILED',
    testsExecuted: 'UNKNOWN',
    tier: 'UNKNOWN',
    provenance: 'UNKNOWN',
    details: errorLines || `Command exited with non-zero code (${exitCode}) without deterministic failure summary`,
  };
}

/**
 * Execute verification targets and produce canonical Protocol v0 verification evidence.
 */
export function runVerificationV0(
  repoRoot: string,
  targetNames?: string[],
  options?: RunVerificationOptions
): VerificationItemV0[] {
  const discovered = discoverVerificationTargets(repoRoot);
  const toRun = targetNames
    ? discovered.filter((t) => targetNames.includes(t.name))
    : discovered;

  if (toRun.length === 0) {
    return [
      {
        name: 'verification',
        command: 'UNKNOWN',
        lifecycle: 'COMMAND_UNKNOWN',
        invocation: 'UNKNOWN',
        status: 'UNKNOWN',
        testsExecuted: 'UNKNOWN',
        tier: 'UNKNOWN',
        provenance: 'UNKNOWN',
        details: 'No deterministic verification contract or runner discovered for repository',
      },
    ];
  }

  const results: VerificationItemV0[] = [];
  const timeoutMs = options?.timeoutMs ?? 120000;

  for (const target of toRun) {
    const fullCmd = `${target.command} ${target.args.join(' ')}`.trim();
    const targetCwd = target.cwd ? path.resolve(repoRoot, target.cwd) : repoRoot;

    if (target.cwd && !isPathInside(repoRoot, target.cwd)) {
      results.push({
        name: target.name,
        command: fullCmd,
        lifecycle: 'INVOCATION_FAILED',
        invocation: 'FAILED',
        status: 'UNKNOWN',
        testsExecuted: 'UNKNOWN',
        tier: 'UNKNOWN',
        provenance: 'UNKNOWN',
        details: `Security violation: cwd '${target.cwd}' escapes repository root`,
      });
      continue;
    }

    const startTime = Date.now();

    try {
      const res = spawnSync(target.command, target.args, {
        cwd: targetCwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf-8',
        timeout: timeoutMs,
      });

      const durationMs = Date.now() - startTime;
      const combinedOutput = (res.stdout || '') + '\n' + (res.stderr || '');

      // Check 1: Invocation failure (binary missing, permissions, spawn failure)
      if (res.error && ((res.error as any).code === 'ENOENT' || (res.error as any).code === 'EACCES')) {
        results.push({
          name: target.name,
          command: fullCmd,
          lifecycle: 'INVOCATION_FAILED',
          invocation: 'FAILED',
          status: 'UNKNOWN',
          testsExecuted: 'UNKNOWN',
          durationMs,
          details: res.error.message || `Failed to invoke command binary '${target.command}'`,
          tier: 'UNKNOWN',
          provenance: 'UNKNOWN',
        });
        continue;
      }

      // Check 2: Timeout
      const isTimeout =
        (res.error && ((res.error as any).code === 'ETIMEDOUT' || res.error.name === 'ETIMEDOUT')) ||
        ((res.signal === 'SIGTERM' || res.signal === 'SIGKILL') && durationMs >= Math.min(timeoutMs * 0.8, 100));

      if (isTimeout) {
        results.push({
          name: target.name,
          command: fullCmd,
          lifecycle: 'TIMEOUT',
          invocation: 'VALID',
          status: 'TIMEOUT',
          testsExecuted: parseTestsExecutedCount(combinedOutput),
          durationMs,
          details: `Execution timed out after ${durationMs}ms`,
          tier: 'UNKNOWN',
          provenance: 'UNKNOWN',
        });
        continue;
      }

      // Check 3: Clean exit 0
      if (res.status === 0) {
        const summary = parseTestSummary(combinedOutput);
        const testsExecuted = parseTestsExecutedCount(combinedOutput);
        results.push({
          name: target.name,
          command: fullCmd,
          lifecycle: 'TESTS_PASSED',
          invocation: 'VALID',
          compilation: 'VALID',
          status: 'PASSED',
          summary,
          testsExecuted,
          durationMs,
          exitCode: 0,
          tier: 'VERIFIED',
          provenance: 'VERIFIED',
        });
      } else {
        // Check 4: Non-zero exit with deterministic stage classification
        const classified = classifyExecutionFailure(
          fullCmd,
          target.name,
          combinedOutput,
          res.status
        );
        results.push({
          name: target.name,
          command: fullCmd,
          lifecycle: classified.lifecycle,
          invocation: 'VALID',
          compilation: classified.compilation,
          status: classified.status,
          testsExecuted: classified.testsExecuted,
          summary: classified.summary,
          details: classified.details,
          durationMs,
          exitCode: res.status,
          tier: classified.tier,
          provenance: classified.provenance,
        });
      }
    } catch (err: any) {
      results.push({
        name: target.name,
        command: fullCmd,
        lifecycle: 'INVOCATION_FAILED',
        invocation: 'FAILED',
        status: 'UNKNOWN',
        testsExecuted: 'UNKNOWN',
        durationMs: Date.now() - startTime,
        details: err.message,
        tier: 'UNKNOWN',
        provenance: 'UNKNOWN',
      });
    }
  }

  return results;
}

/**
 * Compatibility adapter: translates canonical VerificationItemV0 to legacy VerificationItem.
 * Ensures backward compatibility with existing CLI formatters without contaminating
 * canonical Evidence Protocol v0 semantics.
 */
export function toLegacyVerificationItem(v: VerificationItemV0): VerificationItem {
  let legacyStatus: VerificationItem['status'];
  if (v.lifecycle === 'TESTS_PASSED') legacyStatus = 'PASSED';
  else if (v.lifecycle === 'TESTS_FAILED' || v.lifecycle === 'BUILD_FAILED' || v.status === 'FAILED') legacyStatus = 'FAILED';
  else if (v.lifecycle === 'TIMEOUT') legacyStatus = 'TIMEOUT';
  else if (v.lifecycle === 'INVOCATION_FAILED') legacyStatus = 'INVOCATION_FAILED';
  else if (v.lifecycle === 'NOT_RUN' || v.lifecycle === 'NONE') legacyStatus = 'NOT_RUN';
  else legacyStatus = 'UNKNOWN';

  return {
    name: v.name || 'verification',
    command: v.command,
    status: legacyStatus,
    lifecycle: v.lifecycle,
    summary: v.summary,
    details: v.details,
    durationMs: v.durationMs,
    tier: v.tier,
  };
}

/**
 * Legacy API: Run verification and return legacy VerificationItem[] via compatibility adapter.
 */
export function runVerification(
  repoRoot: string,
  targetNames?: string[],
  options?: RunVerificationOptions
): VerificationItem[] {
  const canonical = runVerificationV0(repoRoot, targetNames, options);
  return canonical.map(toLegacyVerificationItem);
}

/**
 * Passive observation: Return discovered targets as NOT_RUN without executing them (Protocol v0).
 * If no targets are discovered, truthfully reports COMMAND_UNKNOWN.
 */
export function getUnverifiedTargetsV0(repoRoot: string): VerificationItemV0[] {
  const discovered = discoverVerificationTargets(repoRoot);
  if (discovered.length === 0) {
    return [
      {
        name: 'verification',
        command: 'UNKNOWN',
        lifecycle: 'COMMAND_UNKNOWN',
        invocation: 'UNKNOWN',
        status: 'UNKNOWN',
        testsExecuted: 'UNKNOWN',
        tier: 'UNKNOWN',
        provenance: 'UNKNOWN',
        details: 'No deterministic verification contract or runner discovered for repository',
      },
    ];
  }

  return discovered.map((t) => ({
    name: t.name,
    command: `${t.command} ${t.args.join(' ')}`.trim(),
    lifecycle: 'NOT_RUN',
    invocation: 'UNKNOWN',
    status: 'UNKNOWN',
    testsExecuted: 'UNKNOWN',
    tier: 'UNKNOWN',
    provenance: 'UNKNOWN',
  }));
}

/**
 * Legacy API: Return unverified targets as legacy VerificationItem[].
 */
export function getUnverifiedTargets(repoRoot: string): VerificationItem[] {
  return getUnverifiedTargetsV0(repoRoot).map(toLegacyVerificationItem);
}
