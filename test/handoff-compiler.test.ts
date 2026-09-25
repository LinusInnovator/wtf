import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import { compileHandoffPacket, formatHandoffMarkdown } from '../src/core/handoff-compiler.js';
import { TrajectoryLedger } from '../src/core/trajectory-ledger.js';

describe('HandoffCompiler (Phase 10.2 / v0.3)', () => {
  const sampleTraceOutput = `
running 1 test
test test_skip_dir ... FAILED

failures:

---- test_skip_dir stdout ----
thread 'test_skip_dir' panicked at src/core/trace-slice.ts:42:5:
assertion failed: (left == right)
  left: 0
 right: 1
note: run with \`RUST_BACKTRACE=1\` environment variable to display a backtrace
`;

  it('compiles established physical state into a bounded HandoffPacket', () => {
    const cwd = process.cwd();
    const packet = compileHandoffPacket({
      taskIntent: 'Fix the off-by-one error in directory skipping',
      verificationCommand: 'cargo test',
      verificationExitCode: 101,
      verificationOutput: sampleTraceOutput,
      cwd,
    });

    expect(packet.version).toBe('0.3.0');
    expect(packet.taskIntent).toBe('Fix the off-by-one error in directory skipping');
    expect(packet.targetFile).toBe('src/core/trace-slice.ts');
    expect(packet.currentVerification.command).toBe('cargo test');
    expect(packet.currentVerification.exitCode).toBe(101);

    // Verified failure coordinates extracted by TraceSlice
    expect(packet.failureCoordinates.length).toBeGreaterThan(0);
    expect(packet.failureCoordinates[0].file).toBe('src/core/trace-slice.ts');
    expect(packet.failureCoordinates[0].line).toBe(42);

    // Bounded viewport rendered around coordinate
    expect(packet.boundedViewport.file).toBe('src/core/trace-slice.ts');
    expect(packet.boundedViewport.centerLine).toBe(42);
    expect(packet.boundedViewport.viewportText).toContain('==>   42 |');

    // Factual unresolved verification status
    expect(packet.unresolvedVerificationStatus).toContain('cargo test');
    expect(packet.unresolvedVerificationStatus).toContain('101');
  });

  it('extracts prior failed mutation receipts without inferring cognitive hypotheses', () => {
    const cwd = process.cwd();
    const ledger = new TrajectoryLedger('sess-handoff', cwd);

    // Turn 1: Rejected patch
    ledger.appendTurn({
      rawActionName: 'replace_in_file',
      rawActionArgs: { path: 'src/core/trace-slice.ts', old_text: 'foo', new_text: 'bar' },
      actionStatus: 'rejected',
      actionRejectionReason: 'Anchor not found',
    });

    // Turn 2: Applied patch that failed verification
    ledger.appendTurn({
      rawActionName: 'replace_in_file',
      rawActionArgs: { path: 'src/core/trace-slice.ts', new_text: 'let x = 1;' },
      actionStatus: 'success',
      verificationExecuted: true,
      verificationExitCode: 1,
      verificationOutput: 'Compiler error on line 42: mismatch',
    });

    const packet = compileHandoffPacket({
      taskIntent: 'Fix compiler error',
      verificationCommand: 'npm test',
      verificationExitCode: 1,
      verificationOutput: sampleTraceOutput,
      turns: ledger.getTurns(),
      cwd,
    });

    expect(packet.priorFailedMutations.length).toBe(2);

    const m1 = packet.priorFailedMutations[0];
    expect(m1.turnIndex).toBe(1);
    expect(m1.enactedStatus).toBe('rejected');
    expect(m1.resultingVerificationError).toBe('Anchor not found');

    const m2 = packet.priorFailedMutations[1];
    expect(m2.turnIndex).toBe(2);
    expect(m2.enactedStatus).toBe('success');
    expect(m2.resultingVerificationError).toContain('Compiler error on line 42');
  });

  it('strictly excludes chain-of-thought, scratchpads, and model reasoning histories', () => {
    const packet = compileHandoffPacket({
      taskIntent: 'Implement method',
      verificationCommand: 'pytest',
      verificationExitCode: 1,
      verificationOutput: sampleTraceOutput,
      uncommittedDiff: '',
    });

    const packetKeys = Object.keys(packet);
    expect(packetKeys).not.toContain('chainOfThought');
    expect(packetKeys).not.toContain('scratchpad');
    expect(packetKeys).not.toContain('reasoningTokens');
    expect(packetKeys).not.toContain('conversationHistory');
    expect(packetKeys).not.toContain('suggestedSolution');
    expect(packetKeys).not.toContain('candidatePatch');

    const json = JSON.stringify(packet);
    expect(json).not.toContain('think');
    expect(json).not.toContain('reasoning');
  });

  it('renders deterministic zero-ANSI markdown matching Phase 8.4A format', () => {
    const packet = compileHandoffPacket({
      taskIntent: 'Fix string parsing',
      targetFile: 'src/core/trace-slice.ts',
      verificationCommand: 'npm test',
      verificationExitCode: 1,
      verificationOutput: sampleTraceOutput,
    });

    const md = formatHandoffMarkdown(packet);
    expect(md).toContain('=== WTF COMPILED WORKING INTERFACE HANDOFF ===');
    expect(md).toContain('TASK INTENT:\nFix string parsing');
    expect(md).toContain('TARGET FILE: src/core/trace-slice.ts');
    expect(md).toContain('BOUNDED CODE VIEWPORT (CURRENT WORKING CODE AT FAILURE COORDINATES):');
    expect(md).toContain('==>   42 |');
    expect(md).toContain('UNRESOLVED VERIFICATION STATUS:');
    expect(md).toContain('ACTION REQUIRED:');

    // Zero ANSI codes in markdown
    expect(md).not.toMatch(/\x1B\[[0-9;]*[a-zA-Z]/);
  });

  it('is completely deterministic across repeated compilations of the same state', () => {
    const input = {
      taskIntent: 'Determinism check',
      verificationCommand: 'cargo test',
      verificationExitCode: 1,
      verificationOutput: sampleTraceOutput,
      cwd: process.cwd(),
    };

    const p1 = compileHandoffPacket(input);
    const p2 = compileHandoffPacket(input);

    expect(p1.targetFile).toBe(p2.targetFile);
    expect(p1.failureCoordinates).toEqual(p2.failureCoordinates);
    expect(p1.boundedViewport).toEqual(p2.boundedViewport);
    expect(p1.unresolvedVerificationStatus).toBe(p2.unresolvedVerificationStatus);
  });

  it('fails closed safely on non-existent files or empty tracebacks', () => {
    const packet = compileHandoffPacket({
      taskIntent: 'Handle empty case',
      targetFile: 'non/existent/file.rs',
      verificationCommand: 'check',
      verificationExitCode: 1,
      verificationOutput: 'No stack trace emitted',
    });

    expect(packet.failureCoordinates.length).toBe(0);
    expect(packet.boundedViewport.viewportText).toContain('Unable to project non/existent/file.rs');
    expect(packet.unresolvedVerificationStatus).toContain('check');
  });
});
