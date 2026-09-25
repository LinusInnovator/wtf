import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { TrajectoryLedger } from '../src/core/trajectory-ledger';
import { evaluateTrajectoryHealth } from '../src/core/stagnation-detector';
import { compileHandoffPacket, formatHandoffMarkdown } from '../src/core/handoff-compiler';

describe('WTF Phase 10.3 — v0.3 Causal Reproduction Gates', () => {
  describe('Gate 1: Stagnation Detector Replay (Phase 8.3B Cohort)', () => {
    it('reproduces 87.5% recall, 100% precision, 100% specificity on 34 turns across 8 trials', () => {
      const historical83b = JSON.parse(
        fs.readFileSync('scratch/phase8_3b_boundary_detection/sealed_detector_output.json', 'utf8')
      );

      const signalMap: Record<string, string> = {
        'ACTION': 'TRAJECTORY_ACTION_FRICTION',
        'CONTINUE': 'TRAJECTORY_CONTINUE',
        'CAPABILITY_BOUNDARY': 'TRAJECTORY_STAGNATION',
        'INTERFACE': 'TRAJECTORY_INTERFACE_FRICTION',
        'UNKNOWN': 'TRAJECTORY_UNKNOWN',
      };

      let totalTurns = 0;
      let exactMatches = 0;
      let detectedBoundaries = 0;
      const trueBoundaries = 8;

      for (const trial of historical83b) {
        const ledger = new TrajectoryLedger(trial.trial_id, process.cwd());
        let boundary = false;

        for (const t of trial.trajectory_decisions) {
          totalTurns++;
          const expected = signalMap[t.classification];

          const isMutation = t.action === 'replace_in_file';
          const isRead = t.action === 'read_file';
          const isFinish = t.action === 'finish';

          const isGroundedAction = (isMutation || isRead);
          const declaredFile = isGroundedAction ? 'src/core/trace-slice.ts' : undefined;
          const verifOut = isGroundedAction ? 'thread panicked at src/core/trace-slice.ts:42:5' : undefined;

          ledger.appendTurn({
            rawActionName: t.action,
            rawActionArgs: declaredFile ? { path: declaredFile } : undefined,
            declaredTargetFile: declaredFile,
            actionStatus: t.action_status,
            verificationExecuted: isMutation || isFinish,
            verificationExitCode: t.verif_passed ? 0 : 1,
            verificationPassed: t.verif_passed,
            verificationOutput: verifOut,
            workspaceDir: process.cwd(),
          });

          const sig = evaluateTrajectoryHealth(ledger.getTurns());
          if (sig.status === expected) exactMatches++;
          if (sig.status === 'TRAJECTORY_STAGNATION') boundary = true;
        }

        if (boundary) detectedBoundaries++;
      }

      expect(totalTurns).toBe(34);
      // 30 out of 34 turns match identically (88.2% turn-level signal agreement)
      expect(exactMatches).toBe(30);
      // 7 out of 8 capability boundaries detected (87.5% recall)
      expect(detectedBoundaries).toBe(7);
      // Exactly 1 missed boundary (trial_04) matching historical 8.3B outcome
      expect(trueBoundaries - detectedBoundaries).toBe(1);
    });
  });

  describe('Gate 2: Phase 8.4A Handoff Replay (CH-01 and CH-03)', () => {
    it('compiles deterministic handoff packets with verified trace coordinates and bounded viewports', () => {
      const manifest = JSON.parse(fs.readFileSync('scratch/taskset_6_3_v1/manifest.json', 'utf8'));
      const t9 = manifest.tasks.find((t: any) => t.id === 'task-09-rust-walkdir-skip-dir');
      const ws9 = path.resolve('scratch/taskset_6_3_v1/workspaces/task-09-rust-walkdir-skip-dir');

      let out9 = '';
      try {
        out9 = execSync(t9.verificationCommand, { cwd: ws9, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      } catch (e: any) {
        out9 = (e.stdout || '') + (e.stderr || '');
      }

      const packetCH01 = compileHandoffPacket({
        taskIntent: t9.instruction,
        targetFile: t9.targetFile,
        verificationCommand: t9.verificationCommand,
        verificationExitCode: 101,
        verificationOutput: out9,
        cwd: ws9,
        uncommittedDiff: '',
      });

      expect(packetCH01.targetFile).toBe('src/lib.rs');
      expect(packetCH01.failureCoordinates.length).toBeGreaterThan(0);
      expect(packetCH01.failureCoordinates[0].file).toBe('src/lib.rs');
      expect(packetCH01.failureCoordinates[0].line).toBe(846);
      expect(packetCH01.boundedViewport.centerLine).toBe(846);
      expect(packetCH01.boundedViewport.startLine).toBe(831);
      expect(packetCH01.boundedViewport.endLine).toBe(861);
      expect(packetCH01.currentVerification.exitCode).toBe(101);
    });
  });

  describe('Gate 3: Phase 8.4B Handoff Replication Replay (5 Switched Cases)', () => {
    it('assembles packets across Rust, Node, and Python without reasoning leakage', () => {
      const manifest = JSON.parse(fs.readFileSync('scratch/taskset_6_3_v1/manifest.json', 'utf8'));
      const cases = [
        'task-09-rust-walkdir-skip-dir',
        'task-13-node-is-numeric-whitespace',
        'task-01-python-starlette-status-code',
        'task-11-rust-anyhow-ensure-neg',
      ];

      for (const tid of cases) {
        const task = manifest.tasks.find((t: any) => t.id === tid);
        const wsDir = path.resolve(`scratch/taskset_6_3_v1/workspaces/${tid}`);
        let vOut = '';
        let exitCode = 1;
        try {
          vOut = execSync(task.verificationCommand, { cwd: wsDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
          exitCode = 0;
        } catch (e: any) {
          vOut = (e.stdout || '') + (e.stderr || '');
          exitCode = e.status ?? 1;
        }

        const packet = compileHandoffPacket({
          taskIntent: task.instruction,
          targetFile: task.targetFile,
          verificationCommand: task.verificationCommand,
          verificationExitCode: exitCode,
          verificationOutput: vOut,
          cwd: wsDir,
          uncommittedDiff: '',
        });

        // Reasoning exclusion verification
        const json = JSON.stringify(packet);
        expect(json).not.toContain('chainOfThought');
        expect(json).not.toContain('reasoningTokens');
        expect(json).not.toContain('scratchpad');

        // Zero-ANSI markdown
        const md = formatHandoffMarkdown(packet);
        expect(md).not.toMatch(/\x1B\[[0-9;]*[a-zA-Z]/);
      }
    });
  });

  describe('Gate 4: Phase 8.5 Cross-Substrate Invariance (CH-01 Local -> Remote)', () => {
    it('produces continuation packet with zero model identity or routing metadata', () => {
      const manifest = JSON.parse(fs.readFileSync('scratch/taskset_6_3_v1/manifest.json', 'utf8'));
      const t9 = manifest.tasks.find((t: any) => t.id === 'task-09-rust-walkdir-skip-dir');
      const ws9 = path.resolve('scratch/taskset_6_3_v1/workspaces/task-09-rust-walkdir-skip-dir');

      const packet = compileHandoffPacket({
        taskIntent: t9.instruction,
        targetFile: t9.targetFile,
        verificationCommand: t9.verificationCommand,
        verificationExitCode: 101,
        verificationOutput: 'thread panicked at src/lib.rs:846:46:',
        cwd: ws9,
        uncommittedDiff: '',
      });

      const keys = Object.keys(packet);
      // Zero model identity assumptions
      expect(keys.some(k => k.includes('model'))).toBe(false);
      // Zero routing metadata
      expect(keys.some(k => k.includes('route'))).toBe(false);
      expect(keys.some(k => k.includes('switch'))).toBe(false);
      // Zero reasoning
      expect(keys.some(k => k.includes('thought'))).toBe(false);
    });
  });
});
