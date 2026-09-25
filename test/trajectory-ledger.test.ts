import { describe, it, expect } from 'vitest';
import { TrajectoryLedger, FIELD_PROVENANCE_MAP, TrajectoryTurnRecord } from '../src/core/trajectory-ledger.js';

describe('TrajectoryLedger (Phase 10.2 / v0.3)', () => {
  it('enforces append-only sequential turn numbering and immutability', () => {
    const ledger = new TrajectoryLedger('sess-101');
    expect(ledger.getTurnCount()).toBe(0);

    const turn1 = ledger.appendTurn({
      rawActionName: 'read_file',
      rawActionArgs: { path: 'src/lib.rs' },
    });

    expect(turn1.turnIndex).toBe(1);
    expect(turn1.sessionId).toBe('sess-101');
    expect(turn1.canonicalAction).toBe('READ');
    expect(ledger.getTurnCount()).toBe(1);

    const turn2 = ledger.appendTurn({
      rawActionName: 'replace_in_file',
      rawActionArgs: { path: 'src/lib.rs', new_text: 'fn test() {}' },
    });

    expect(turn2.turnIndex).toBe(2);
    expect(turn2.canonicalAction).toBe('MUTATION');
    expect(ledger.getTurnCount()).toBe(2);

    const turns = ledger.getTurns();
    expect(turns.length).toBe(2);
    expect(turns[0].turnIndex).toBe(1);
    expect(turns[1].turnIndex).toBe(2);

    // Verify turn record immutability
    expect(Object.isFrozen(turn1)).toBe(true);
    expect(Object.isFrozen(turn2)).toBe(true);
  });

  it('maintains strict provenance mapping across all schema fields', () => {
    const recordKeys: Array<keyof TrajectoryTurnRecord> = [
      'turnIndex',
      'timestamp',
      'sessionId',
      'rawActionName',
      'rawActionArgs',
      'declaredTargetFile',
      'declaredIntent',
      'isFinishRequested',
      'canonicalAction',
      'actionStatus',
      'actionRejectionReason',
      'enactedDiff',
      'verificationExecuted',
      'verificationCommand',
      'verificationExitCode',
      'verificationDurationMs',
      'verificationPassed',
      'verificationOutputSnippet',
      'extractedCoordinates',
      'errorDeltaFromPrevious',
      'cumulativeNavigationTurns',
      'cumulativeActionFailures',
      'cumulativePostMutationIdleTurns',
      'isCoordinateGrounded',
    ];

    for (const key of recordKeys) {
      expect(FIELD_PROVENANCE_MAP[key]).toBeDefined();
      expect([
        'DETERMINISTIC_REALITY',
        'DERIVED_DETERMINISTIC_STATE',
        'INTELLIGENCE_SUPPLIED_CLAIM',
      ]).toContain(FIELD_PROVENANCE_MAP[key]);
    }
  });

  it('never promotes intelligence claims to physical reality without verification', () => {
    const ledger = new TrajectoryLedger('sess-prov');
    const turn = ledger.appendTurn({
      rawActionName: 'replace_file_content',
      rawActionArgs: { path: 'src/core/auth.ts', content: 'hacked' },
      declaredTargetFile: 'src/core/auth.ts',
      declaredIntent: 'Claiming I fixed the bug',
      actionStatus: 'rejected',
      actionRejectionReason: 'Anchor mismatch',
    });

    // The agent claimed targetFile and intent
    expect(turn.declaredTargetFile).toBe('src/core/auth.ts');
    expect(turn.declaredIntent).toBe('Claiming I fixed the bug');
    expect(FIELD_PROVENANCE_MAP.declaredTargetFile).toBe('INTELLIGENCE_SUPPLIED_CLAIM');
    expect(FIELD_PROVENANCE_MAP.declaredIntent).toBe('INTELLIGENCE_SUPPLIED_CLAIM');

    // Physical reality recorded the rejection
    expect(turn.actionStatus).toBe('rejected');
    expect(turn.actionRejectionReason).toBe('Anchor mismatch');
    expect(FIELD_PROVENANCE_MAP.actionStatus).toBe('DETERMINISTIC_REALITY');
    expect(FIELD_PROVENANCE_MAP.actionRejectionReason).toBe('DETERMINISTIC_REALITY');
  });

  it('accurately computes cumulative navigation, action failure, and post-mutation idle counters', () => {
    const ledger = new TrajectoryLedger('sess-counters');

    // Turn 1: Read (nav turn 1)
    const t1 = ledger.appendTurn({ rawActionName: 'read_file', rawActionArgs: { path: 'src/lib.rs' } });
    expect(t1.cumulativeNavigationTurns).toBe(1);
    expect(t1.cumulativeActionFailures).toBe(0);
    expect(t1.cumulativePostMutationIdleTurns).toBe(0);

    // Turn 2: Read (nav turn 2)
    const t2 = ledger.appendTurn({ rawActionName: 'view_file', rawActionArgs: { path: 'src/lib.rs' } });
    expect(t2.cumulativeNavigationTurns).toBe(2);
    expect(t2.cumulativeActionFailures).toBe(0);
    expect(t2.cumulativePostMutationIdleTurns).toBe(0);

    // Turn 3: Rejected Mutation (nav resets, action fail = 1)
    const t3 = ledger.appendTurn({
      rawActionName: 'replace_in_file',
      actionStatus: 'rejected',
      actionRejectionReason: 'Line anchor not found',
    });
    expect(t3.cumulativeNavigationTurns).toBe(0);
    expect(t3.cumulativeActionFailures).toBe(1);
    expect(t3.cumulativePostMutationIdleTurns).toBe(0);

    // Turn 4: Rejected Mutation (action fail = 2)
    const t4 = ledger.appendTurn({
      rawActionName: 'replace_in_file',
      actionStatus: 'failed',
    });
    expect(t4.cumulativeNavigationTurns).toBe(0);
    expect(t4.cumulativeActionFailures).toBe(2);

    // Turn 5: Read while action failures active (nav = 1, action fails preserved = 2)
    const t5 = ledger.appendTurn({ rawActionName: 'read_file' });
    expect(t5.cumulativeNavigationTurns).toBe(1);
    expect(t5.cumulativeActionFailures).toBe(2);

    // Turn 6: Successful Mutation (action fail resets to 0, nav = 0)
    const t6 = ledger.appendTurn({
      rawActionName: 'replace_in_file',
      actionStatus: 'success',
      verificationExecuted: true,
      verificationExitCode: 1,
      verificationOutput: 'test failed: assertion error',
    });
    expect(t6.cumulativeNavigationTurns).toBe(0);
    expect(t6.cumulativeActionFailures).toBe(0);
    expect(t6.cumulativePostMutationIdleTurns).toBe(0);

    // Turn 7: Read after successful mutation (post-mutation idle = 1, nav = 1)
    const t7 = ledger.appendTurn({ rawActionName: 'read_file' });
    expect(t7.cumulativeNavigationTurns).toBe(1);
    expect(t7.cumulativePostMutationIdleTurns).toBe(1);

    // Turn 8: Shell command after mutation (post-mutation idle = 2, nav = 2)
    const t8 = ledger.appendTurn({ rawActionName: 'run_command', rawActionArgs: { command: 'cargo check' } });
    expect(t8.cumulativeNavigationTurns).toBe(2);
    expect(t8.cumulativePostMutationIdleTurns).toBe(2);
  });

  it('tracks error deltas across consecutive verification checks', () => {
    const ledger = new TrajectoryLedger('sess-deltas');

    // First observation
    const t1 = ledger.appendTurn({
      rawActionName: 'replace_in_file',
      actionStatus: 'success',
      verificationExecuted: true,
      verificationExitCode: 1,
      verificationOutput: 'Error on line 42: type mismatch',
    });
    expect(t1.errorDeltaFromPrevious).toBe('first_observation');

    // Identical error
    const t2 = ledger.appendTurn({
      rawActionName: 'replace_in_file',
      actionStatus: 'success',
      verificationExecuted: true,
      verificationExitCode: 1,
      verificationOutput: 'Error on line 42: type mismatch',
    });
    expect(t2.errorDeltaFromPrevious).toBe('identical');

    // Changed error
    const t3 = ledger.appendTurn({
      rawActionName: 'replace_in_file',
      actionStatus: 'success',
      verificationExecuted: true,
      verificationExitCode: 1,
      verificationOutput: 'Error on line 50: borrow check error',
    });
    expect(t3.errorDeltaFromPrevious).toBe('changed');

    // Resolved (exit 0)
    const t4 = ledger.appendTurn({
      rawActionName: 'replace_in_file',
      actionStatus: 'success',
      verificationExecuted: true,
      verificationExitCode: 0,
      verificationOutput: 'All 15 tests passed',
    });
    expect(t4.errorDeltaFromPrevious).toBe('resolved');
  });

  it('serializes and deserializes cleanly without loss of turn data', () => {
    const ledger = new TrajectoryLedger('sess-serialize', '/tmp/repo');
    ledger.appendTurn({
      rawActionName: 'read_file',
      rawActionArgs: { path: 'src/main.rs' },
    });
    ledger.appendTurn({
      rawActionName: 'replace_in_file',
      rawActionArgs: { path: 'src/main.rs', content: 'new code' },
      actionStatus: 'success',
      verificationExecuted: true,
      verificationExitCode: 0,
    });

    const json = ledger.toJSON();
    const restored = TrajectoryLedger.fromJSON(json);

    expect(restored.getTurnCount()).toBe(2);
    expect(restored.getTurn(1)?.rawActionName).toBe('read_file');
    expect(restored.getTurn(2)?.canonicalAction).toBe('MUTATION');
    expect(restored.getTurn(2)?.verificationPassed).toBe(true);
    expect(restored.getAppliedMutations().length).toBe(1);
  });
});
