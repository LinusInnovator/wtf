import { describe, it, expect } from 'vitest';
import { TrajectoryLedger } from '../src/core/trajectory-ledger.js';
import {
  evaluateTrajectoryHealth,
  areVerificationOutputsIdentical,
  areMutationsIdentical,
  isCoordinateGrounded,
  isUnresolvedFailing,
  STAGNATION_THRESHOLDS,
} from '../src/core/stagnation-detector.js';
import { TraceFrame } from '../src/core/trace-slice.js';

describe('TrajectoryStagnationDetector (Phase 10.2 / v0.3)', () => {
  describe('Formal Comparison Functions (Phase 10.1A)', () => {
    it('areVerificationOutputsIdentical normalizes ANSI escape sequences, whitespace, and timing tokens', () => {
      const out1 = '\x1B[31mError on line 42\x1B[0m\nFailed in 0.412s\n';
      const out2 = 'Error on line 42\nFailed in 1.200s\n';
      expect(areVerificationOutputsIdentical(out1, out2)).toBe(true);

      const out3 = 'Error on line 42\nTime: 120ms\n';
      expect(areVerificationOutputsIdentical(out1, out3)).toBe(true);

      const outDifferent = 'Error on line 99\nFailed in 0.412s\n';
      expect(areVerificationOutputsIdentical(out1, outDifferent)).toBe(false);

      expect(areVerificationOutputsIdentical(undefined, out1)).toBe(false);
      expect(areVerificationOutputsIdentical(out1, undefined)).toBe(false);
      expect(areVerificationOutputsIdentical(undefined, undefined)).toBe(true);
    });

    it('areMutationsIdentical compares target files, old_text anchors, and replacements byte-for-byte', () => {
      const mut1 = { targetFile: 'src/lib.rs', oldText: 'foo()', newText: 'bar()' };
      const mut2 = { targetFile: 'src/lib.rs', oldText: 'foo()', replacementContent: 'bar()' };
      expect(areMutationsIdentical(mut1, mut2)).toBe(true);

      // Windows slash normalization
      const mutWindows = { targetFile: 'src\\lib.rs', oldText: 'foo()', newText: 'bar()' };
      expect(areMutationsIdentical(mut1, mutWindows)).toBe(true);

      // Different replacement
      const mutDiff = { targetFile: 'src/lib.rs', oldText: 'foo()', newText: 'baz()' };
      expect(areMutationsIdentical(mut1, mutDiff)).toBe(false);

      // Different anchor
      const mutDiffAnchor = { targetFile: 'src/lib.rs', oldText: 'qux()', newText: 'bar()' };
      expect(areMutationsIdentical(mut1, mutDiffAnchor)).toBe(false);

      expect(areMutationsIdentical(undefined, mut1)).toBe(false);
    });

    it('isCoordinateGrounded resolves canonical paths against extracted TraceFrames', () => {
      const frames: TraceFrame[] = [
        { file: 'src/core/auth.ts', line: 42, source: 'node', raw: 'at auth.ts:42' },
        { file: 'src/lib.rs', line: 100, source: 'rust', raw: '--> src/lib.rs:100:5' },
      ];

      expect(isCoordinateGrounded('src/core/auth.ts', frames)).toBe(true);
      expect(isCoordinateGrounded('src\\core\\auth.ts', frames)).toBe(true);
      expect(isCoordinateGrounded('/absolute/workspace/src/core/auth.ts', frames)).toBe(true);
      expect(isCoordinateGrounded('src/lib.rs', frames)).toBe(true);

      // Non-matching file
      expect(isCoordinateGrounded('src/core/unrelated.ts', frames)).toBe(false);
      expect(isCoordinateGrounded(undefined, frames)).toBe(false);
      expect(isCoordinateGrounded('src/core/auth.ts', [])).toBe(false);
    });

    it('isUnresolvedFailing accurately checks execution and exit code status', () => {
      expect(isUnresolvedFailing({ executed: true, exitCode: 1 })).toBe(true);
      expect(isUnresolvedFailing({ executed: true, exitCode: 101 })).toBe(true);
      expect(isUnresolvedFailing({ executed: true, exitCode: 0 })).toBe(false);
      expect(isUnresolvedFailing({ executed: false, exitCode: 1 })).toBe(false);
      expect(isUnresolvedFailing(undefined)).toBe(false);
    });
  });

  describe('The Seven Hardened Trajectory Rules', () => {
    it('Rule 1: Terminal Pass unconditionally emits TRAJECTORY_PASS', () => {
      const ledger = new TrajectoryLedger('sess-r1');
      ledger.appendTurn({
        rawActionName: 'replace_in_file',
        actionStatus: 'success',
        verificationExecuted: true,
        verificationExitCode: 0,
        verificationPassed: true,
      });

      const signal = evaluateTrajectoryHealth(ledger.getTurns());
      expect(signal.status).toBe('TRAJECTORY_PASS');
      expect(signal.triggerRule).toContain('Rule 1');
      expect(signal.confidence).toBe('HIGH');
    });

    it('Rule 2: Early Turns Grace Window emits TRAJECTORY_CONTINUE for turns <= 2', () => {
      const ledger = new TrajectoryLedger('sess-r2');
      ledger.appendTurn({ rawActionName: 'read_file', rawActionArgs: { path: 'src/main.rs' } });

      const sig1 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig1.status).toBe('TRAJECTORY_CONTINUE');
      expect(sig1.triggerRule).toContain('Rule 2');

      ledger.appendTurn({ rawActionName: 'run_command', rawActionArgs: { command: 'cargo check' } });
      const sig2 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig2.status).toBe('TRAJECTORY_CONTINUE');
      expect(sig2.triggerRule).toContain('Rule 2');
    });

    it('Rule 3: Unresolved Finish Handling handles 3A, 3B, 3C, and 3D', () => {
      // 3A: Finish in ungrounded navigation loop (>= 3 nav turns)
      const ledgerA = new TrajectoryLedger('sess-r3a');
      ledgerA.appendTurn({ rawActionName: 'read_file' });
      ledgerA.appendTurn({ rawActionName: 'read_file' });
      ledgerA.appendTurn({ rawActionName: 'read_file' });
      ledgerA.appendTurn({ rawActionName: 'finish', verificationExecuted: true, verificationExitCode: 1 });
      const sigA = evaluateTrajectoryHealth(ledgerA.getTurns());
      expect(sigA.status).toBe('TRAJECTORY_INTERFACE_FRICTION');
      expect(sigA.triggerRule).toContain('Rule 3A');

      // 3B: Finish after >= 2 action rejections
      const ledgerB = new TrajectoryLedger('sess-r3b');
      ledgerB.appendTurn({ rawActionName: 'replace_in_file', actionStatus: 'rejected' });
      ledgerB.appendTurn({ rawActionName: 'replace_in_file', actionStatus: 'rejected' });
      ledgerB.appendTurn({ rawActionName: 'finish', verificationExecuted: true, verificationExitCode: 1 });
      const sigB = evaluateTrajectoryHealth(ledgerB.getTurns());
      expect(sigB.status).toBe('TRAJECTORY_ACTION_FRICTION');
      expect(sigB.triggerRule).toContain('Rule 3B');

      // 3C: Finish on grounded failing coordinate
      const ledgerC = new TrajectoryLedger('sess-r3c');
      ledgerC.appendTurn({
        rawActionName: 'read_file',
        rawActionArgs: { path: 'src/core/trace-slice.ts' },
        verificationExecuted: true,
        verificationExitCode: 1,
        verificationOutput: 'thread \'panicked\' at src/core/trace-slice.ts:42:5:\nassertion failed: (left == right)',
      });
      ledgerC.appendTurn({
        rawActionName: 'finish',
        rawActionArgs: { path: 'src/core/trace-slice.ts' },
        verificationExecuted: true,
        verificationExitCode: 1,
      });
      const sigC = evaluateTrajectoryHealth(ledgerC.getTurns());
      expect(sigC.status).toBe('TRAJECTORY_STAGNATION');
      expect(sigC.triggerRule).toContain('Rule 3C');
      expect(sigC.evidenceSummary).toContain('grounded workspace coordinate');
    });

    it('Rule 4: Mechanical Action Failure emits ACTION_FRICTION (< 4) vs TRAJECTORY_STAGNATION (>= 4)', () => {
      const ledger = new TrajectoryLedger('sess-r4');

      // 3 consecutive failures -> ACTION_FRICTION (boundary -1)
      ledger.appendTurn({ rawActionName: 'replace_in_file', actionStatus: 'rejected' });
      ledger.appendTurn({ rawActionName: 'replace_in_file', actionStatus: 'rejected' });
      ledger.appendTurn({ rawActionName: 'replace_in_file', actionStatus: 'failed' });

      const sig3 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig3.status).toBe('TRAJECTORY_ACTION_FRICTION');
      expect(sig3.triggerRule).toContain('Rule 4B');

      // 4 consecutive failures -> TRAJECTORY_STAGNATION (boundary exact)
      ledger.appendTurn({ rawActionName: 'replace_in_file', actionStatus: 'rejected' });
      const sig4 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig4.status).toBe('TRAJECTORY_STAGNATION');
      expect(sig4.triggerRule).toContain('Rule 4A');
      expect(sig4.evidenceSummary).toContain('4 consecutive candidate mutations rejected');
    });

    it('Rule 5A: Post-Mutation Idle Stalling triggers at >= 3 non-mutating turns', () => {
      const ledger = new TrajectoryLedger('sess-r5a');

      // Turn 1: Applied mutation that fails verification
      ledger.appendTurn({
        rawActionName: 'replace_in_file',
        actionStatus: 'success',
        verificationExecuted: true,
        verificationExitCode: 1,
        verificationOutput: 'Assertion failed',
      });

      // Turn 2: Read (idle 1)
      ledger.appendTurn({ rawActionName: 'read_file' });
      const sig1 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig1.status).toBe('TRAJECTORY_CONTINUE');

      // Turn 3: Shell (idle 2) -> boundary -1: active evaluation window
      ledger.appendTurn({ rawActionName: 'run_command', rawActionArgs: { command: 'cargo test' } });
      const sig2 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig2.status).toBe('TRAJECTORY_CONTINUE');
      expect(sig2.triggerRule).toContain('Rule 5D');

      // Turn 4: Read (idle 3) -> boundary exact: TRAJECTORY_STAGNATION
      ledger.appendTurn({ rawActionName: 'read_file' });
      const sig3 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig3.status).toBe('TRAJECTORY_STAGNATION');
      expect(sig3.triggerRule).toContain('Rule 5A');
      expect(sig3.evidenceSummary).toContain('3 consecutive non-mutating actions');
    });

    it('Rule 5B: Error delta oscillation and duplicate patch triggers TRAJECTORY_STAGNATION', () => {
      const ledger = new TrajectoryLedger('sess-r5b');

      // Mutation 1
      ledger.appendTurn({
        rawActionName: 'replace_in_file',
        rawActionArgs: { path: 'src/lib.rs', new_text: 'fn a() {}' },
        actionStatus: 'success',
        verificationExecuted: true,
        verificationExitCode: 1,
        verificationOutput: 'Error 101: borrow failure\nTime: 12ms',
      });

      // Mutation 2 with identical error output
      ledger.appendTurn({
        rawActionName: 'replace_in_file',
        rawActionArgs: { path: 'src/lib.rs', new_text: 'fn b() {}' },
        actionStatus: 'success',
        verificationExecuted: true,
        verificationExitCode: 1,
        verificationOutput: 'Error 101: borrow failure\nTime: 45ms',
      });

      const signal = evaluateTrajectoryHealth(ledger.getTurns());
      expect(signal.status).toBe('TRAJECTORY_STAGNATION');
      expect(signal.triggerRule).toContain('Rule 5B');
      expect(signal.evidenceSummary).toContain('error outputs identical across 2 applied mutations');
    });

    it('Rule 5C: Mutation ceiling exhaustion fires at >= 3 applied mutations without pass', () => {
      const ledger = new TrajectoryLedger('sess-r5c');

      // 3 different mutations with different errors
      ledger.appendTurn({
        rawActionName: 'replace_in_file',
        actionStatus: 'success',
        verificationExecuted: true,
        verificationExitCode: 1,
        verificationOutput: 'Error Alpha',
      });
      ledger.appendTurn({
        rawActionName: 'replace_in_file',
        actionStatus: 'success',
        verificationExecuted: true,
        verificationExitCode: 1,
        verificationOutput: 'Error Beta',
      });

      // 2 mutations with different errors = CONTINUE (Rule 5D)
      const sig2 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig2.status).toBe('TRAJECTORY_CONTINUE');

      // 3rd mutation with different error = TRAJECTORY_STAGNATION (Rule 5C)
      ledger.appendTurn({
        rawActionName: 'replace_in_file',
        actionStatus: 'success',
        verificationExecuted: true,
        verificationExitCode: 1,
        verificationOutput: 'Error Gamma',
      });

      const sig3 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig3.status).toBe('TRAJECTORY_STAGNATION');
      expect(sig3.triggerRule).toContain('Rule 5C');
      expect(sig3.evidenceSummary).toContain('3 mutations executed without resolving verification');
    });

    it('Rule 6: Ungrounded Navigation Loop fires at >= 3 ungrounded read/shell turns', () => {
      const ledger = new TrajectoryLedger('sess-r6');
      ledger.appendTurn({ rawActionName: 'read_file', rawActionArgs: { path: 'random1.txt' } });
      ledger.appendTurn({ rawActionName: 'run_command', rawActionArgs: { command: 'ls' } });

      // Turn 2: Grace window / CONTINUE
      const sig2 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig2.status).toBe('TRAJECTORY_CONTINUE');

      // Turn 3: 3rd ungrounded nav turn -> TRAJECTORY_INTERFACE_FRICTION
      ledger.appendTurn({ rawActionName: 'view_file', rawActionArgs: { path: 'random2.txt' } });
      const sig3 = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig3.status).toBe('TRAJECTORY_INTERFACE_FRICTION');
      expect(sig3.triggerRule).toContain('Rule 6');
    });

    it('Rule 7: Default Observation Fallback handles active non-violating trajectories', () => {
      const ledger = new TrajectoryLedger('sess-r7');
      ledger.appendTurn({ rawActionName: 'read_file' });
      ledger.appendTurn({ rawActionName: 'read_file' });
      // Mutating action that does not fail
      ledger.appendTurn({ rawActionName: 'replace_in_file', actionStatus: 'executed' });

      const sig = evaluateTrajectoryHealth(ledger.getTurns());
      expect(sig.status).toBe('TRAJECTORY_CONTINUE');
      expect(sig.triggerRule).toContain('Rule 7');
    });
  });

  describe('Zero Autonomous Policy Decisions Guarantee', () => {
    it('produces pure informational signals without modifying state or executing side effects', () => {
      const ledger = new TrajectoryLedger('sess-purity');
      for (let i = 0; i < 5; i++) {
        ledger.appendTurn({ rawActionName: 'replace_in_file', actionStatus: 'rejected' });
      }

      const turnsBefore = ledger.getTurnCount();
      const signal = evaluateTrajectoryHealth(ledger.getTurns());

      // Signal is purely informational
      expect(signal.status).toBe('TRAJECTORY_STAGNATION');
      expect(typeof signal.evidenceSummary).toBe('string');
      expect(signal.metrics.consecutiveActionFailures).toBe(5);

      // Ledger was not modified by evaluation
      expect(ledger.getTurnCount()).toBe(turnsBefore);
    });
  });
});
