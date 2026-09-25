/**
 * WTF Trajectory Stagnation Detector (Phase 10.2 / Protocol v0.3)
 *
 * Evaluates the chronological sequence of turn records from TrajectoryLedger
 * and produces a factual trajectory health signal.
 *
 * Epistemic Rules:
 * 1. Port of the frozen Phase 8.3B empirical rules and Phase 10.1A purity audit.
 * 2. Emits ONLY informational pattern signals:
 *    - TRAJECTORY_PASS
 *    - TRAJECTORY_CONTINUE
 *    - TRAJECTORY_INTERFACE_FRICTION
 *    - TRAJECTORY_ACTION_FRICTION
 *    - TRAJECTORY_STAGNATION
 *    - TRAJECTORY_UNKNOWN
 * 3. Never speculates on model internal mental states or cognitive capacity.
 * 4. Autonomous policy decisions = EXACTLY 0.
 *    (Does not abort, retry, switch models, route, or alter prompts).
 */

import * as path from 'node:path';
import { TrajectoryTurnRecord } from './trajectory-ledger.js';
import { TraceFrame } from './trace-slice.js';

export type TrajectoryHealthStatus =
  | 'TRAJECTORY_PASS'
  | 'TRAJECTORY_CONTINUE'
  | 'TRAJECTORY_INTERFACE_FRICTION'
  | 'TRAJECTORY_ACTION_FRICTION'
  | 'TRAJECTORY_STAGNATION'
  | 'TRAJECTORY_UNKNOWN';

export interface TrajectoryStagnationSignal {
  status: TrajectoryHealthStatus;
  triggerRule: string;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  evidenceSummary: string;
  metrics: {
    turnIndex: number;
    consecutiveNavigationTurns: number;
    consecutiveActionFailures: number;
    consecutivePostMutationIdleTurns: number;
    appliedMutationsCount: number;
  };
}

/**
 * Frozen numerical thresholds pre-registered in Phase 8.3B and audited in Phase 10.1A.
 */
export const STAGNATION_THRESHOLDS = Object.freeze({
  EARLY_TURNS_GRACE_WINDOW: 2,            // Turns 1-2 reserved for initial orientation
  NAVIGATION_LOOP_THRESHOLD: 3,           // >= 3 ungrounded read/shell turns without edits
  POST_MUTATION_IDLE_THRESHOLD: 3,        // >= 3 non-mutating turns following a failing mutation
  PERSISTENT_ACTION_FAILURE_THRESHOLD: 4, // >= 4 consecutive mechanical patch rejections
  MUTATION_OSCILLATION_THRESHOLD: 2,      // >= 2 applied mutations with identical error outputs
  MUTATION_CEILING_WITHOUT_PASS: 3,       // >= 3 applied mutations without passing verification
});

// ============================================================================
// Formal Deterministic Comparison Functions (Audited in Phase 10.1A)
// ============================================================================

/**
 * Deterministically compares two verification output snippets for structural equality.
 * Strips ANSI escape sequences, whitespace trailing noise, and execution timing tokens.
 */
export function areVerificationOutputsIdentical(outputA: string | undefined, outputB: string | undefined): boolean {
  if (outputA === outputB) return true;
  if (!outputA || !outputB) return false;

  const normalize = (text: string): string => {
    return text
      // 1. Strip ANSI escape sequences
      .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
      // 2. Normalize line endings
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trim())
      // 3. Filter out test-runner execution timing lines
      .filter(line => {
        if (line.length === 0) return false;
        if (/^(?:Failed in|Finished in|Done in|Ran \d+ tests? in|Time:)\s*[\d\.]+\s*(?:ms|s|seconds?)?$/i.test(line)) {
          return false;
        }
        return true;
      })
      .map(line => {
        // Strip inline timing tokens
        return line
          .replace(/(?:Failed in|Finished in|Done in|Time:)\s*[\d\.]+\s*(?:ms|s|seconds?)/gi, '')
          .replace(/\b(?:in\s+[\d\.]+\s*(?:ms|s|seconds?)|\[[\d\.]+\s*(?:ms|s)\])\b/gi, '')
          .trim();
      })
      .filter(line => line.length > 0)
      .join('\n');
  };

  return normalize(outputA) === normalize(outputB);
}

export interface MutationAttemptRecord {
  targetFile: string;
  oldText?: string;
  newText?: string;
  replacementContent?: string;
}

/**
 * Deterministically compares two candidate mutations for duplicate content.
 * Evaluates target path, anchor text, and replacement content byte-for-byte.
 */
export function areMutationsIdentical(
  a: MutationAttemptRecord | undefined,
  b: MutationAttemptRecord | undefined
): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  // Replacement content must be present to establish identity
  const contentA = (a.newText ?? a.replacementContent ?? '').trim();
  const contentB = (b.newText ?? b.replacementContent ?? '').trim();
  if (!contentA || !contentB) return false;

  // Normalize target file path relative to workspace
  const pathA = (a.targetFile ?? '').trim().replace(/\\/g, '/');
  const pathB = (b.targetFile ?? '').trim().replace(/\\/g, '/');
  if (!pathA || !pathB || pathA !== pathB) return false;

  // If oldText anchor is present, it must also match
  const anchorA = (a.oldText ?? '').trim();
  const anchorB = (b.oldText ?? '').trim();

  return contentA === contentB && anchorA === anchorB;
}

/**
 * Deterministically checks if a declared target file matches any workspace
 * source coordinate extracted by TraceSlice from verification output.
 */
export function isCoordinateGrounded(
  declaredFile: string | undefined,
  traceFrames: TraceFrame[] | undefined
): boolean {
  if (!declaredFile || !traceFrames || traceFrames.length === 0) return false;

  const normDeclared = path.normalize(declaredFile.trim()).replace(/\\/g, '/');

  return traceFrames.some(frame => {
    const normFrameFile = path.normalize(frame.file.trim()).replace(/\\/g, '/');
    return normDeclared === normFrameFile || normDeclared.endsWith('/' + normFrameFile);
  });
}

export interface VerificationReceipt {
  executed: boolean;
  exitCode?: number;
}

/**
 * Evaluates whether verification has been executed and remains failing.
 */
export function isUnresolvedFailing(receipt: VerificationReceipt | undefined): boolean {
  if (!receipt) return false;
  return receipt.executed === true && receipt.exitCode !== undefined && receipt.exitCode !== 0;
}

// ============================================================================
// Core Trajectory Health Evaluator
// ============================================================================

/**
 * Evaluates trajectory health across recorded turns in strict accordance with
 * the frozen Phase 8.3B decision hierarchy and Phase 10.1A purity audit.
 *
 * @param turns Readonly array of turn records from TrajectoryLedger
 * @returns TrajectoryStagnationSignal Informational pattern signal (zero policy action)
 */
export function evaluateTrajectoryHealth(
  turns: ReadonlyArray<TrajectoryTurnRecord>
): TrajectoryStagnationSignal {
  if (!turns || turns.length === 0) {
    return {
      status: 'TRAJECTORY_UNKNOWN',
      triggerRule: 'empty_trajectory',
      confidence: 'LOW',
      evidenceSummary: 'No turn records observed in trajectory ledger.',
      metrics: {
        turnIndex: 0,
        consecutiveNavigationTurns: 0,
        consecutiveActionFailures: 0,
        consecutivePostMutationIdleTurns: 0,
        appliedMutationsCount: 0,
      },
    };
  }

  const latestTurn = turns[turns.length - 1];
  const turnIndex = latestTurn.turnIndex;
  const appliedMutations = turns.filter(t => t.canonicalAction === 'MUTATION' && t.actionStatus === 'success');
  const appliedMutationsCount = appliedMutations.length;

  const metrics = {
    turnIndex,
    consecutiveNavigationTurns: latestTurn.cumulativeNavigationTurns,
    consecutiveActionFailures: latestTurn.cumulativeActionFailures,
    consecutivePostMutationIdleTurns: latestTurn.cumulativePostMutationIdleTurns,
    appliedMutationsCount,
  };

  // --------------------------------------------------------------------------
  // Rule 1: Terminal Pass Override
  // --------------------------------------------------------------------------
  if (latestTurn.verificationPassed === true) {
    return {
      status: 'TRAJECTORY_PASS',
      triggerRule: 'Rule 1: Terminal Pass',
      confidence: 'HIGH',
      evidenceSummary: 'Verification check passed (exit code 0).',
      metrics,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 3: Unresolved Finish Handling (Agent emitted FINISH while tests fail)
  // --------------------------------------------------------------------------
  if (latestTurn.isFinishRequested && !latestTurn.verificationPassed) {
    // 3A: Finish in ungrounded navigation loop
    if (latestTurn.cumulativeNavigationTurns >= STAGNATION_THRESHOLDS.NAVIGATION_LOOP_THRESHOLD && appliedMutationsCount === 0) {
      return {
        status: 'TRAJECTORY_INTERFACE_FRICTION',
        triggerRule: 'Rule 3A: Finish in Navigation Loop',
        confidence: 'HIGH',
        evidenceSummary: `Agent emitted FINISH while in navigation loop (${latestTurn.cumulativeNavigationTurns} ungrounded turns, 0 edits).`,
        metrics,
      };
    }

    // 3B: Finish after mechanical patch failure
    if (latestTurn.cumulativeActionFailures >= 2) {
      return {
        status: 'TRAJECTORY_ACTION_FRICTION',
        triggerRule: 'Rule 3B: Finish after Action Failure',
        confidence: 'HIGH',
        evidenceSummary: `Agent emitted FINISH after ${latestTurn.cumulativeActionFailures} mechanical patch application failures.`,
        metrics,
      };
    }

    // 3C: Finish on grounded failing coordinate
    const hasEverGrounded = latestTurn.isCoordinateGrounded || latestTurn.hasEverGrounded || turns.some(t => t.isCoordinateGrounded || t.hasEverGrounded);
    if (hasEverGrounded) {
      return {
        status: 'TRAJECTORY_STAGNATION',
        triggerRule: 'Rule 3C: Finish on Grounded Error',
        confidence: 'HIGH',
        evidenceSummary: 'FINISH action emitted while verification command is failing on grounded workspace coordinate.',
        metrics,
      };
    }

    return {
      status: 'TRAJECTORY_UNKNOWN',
      triggerRule: 'Rule 3D: Finish with Ungrounded State',
      confidence: 'LOW',
      evidenceSummary: 'Agent emitted FINISH with ungrounded state and unresolved verification.',
      metrics,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 4: Mechanical Action Failure vs. Persistent Action Stagnation
  // --------------------------------------------------------------------------
  if (latestTurn.canonicalAction === 'MUTATION' && (latestTurn.actionStatus === 'failed' || latestTurn.actionStatus === 'rejected')) {
    if (latestTurn.cumulativeActionFailures >= STAGNATION_THRESHOLDS.PERSISTENT_ACTION_FAILURE_THRESHOLD) {
      return {
        status: 'TRAJECTORY_STAGNATION',
        triggerRule: 'Rule 4A: Persistent Action Rejections',
        confidence: 'HIGH',
        evidenceSummary: `${latestTurn.cumulativeActionFailures} consecutive candidate mutations rejected by ActionCompiler (anchor mismatches or invalid replacement spans).`,
        metrics,
      };
    }

    return {
      status: 'TRAJECTORY_ACTION_FRICTION',
      triggerRule: 'Rule 4B: Mechanical Action Friction',
      confidence: 'HIGH',
      evidenceSummary: `Candidate mutation rejected mechanically by ActionCompiler (${latestTurn.cumulativeActionFailures} consecutive rejections; threshold: ${STAGNATION_THRESHOLDS.PERSISTENT_ACTION_FAILURE_THRESHOLD}).`,
      metrics,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 5: Post-Mutation Idle Stagnation & Oscillation
  // --------------------------------------------------------------------------
  if (appliedMutationsCount >= 1) {
    // 5A: Stalling after edit (>= 3 consecutive read/shell turns without authoring edit)
    if (latestTurn.cumulativePostMutationIdleTurns >= STAGNATION_THRESHOLDS.POST_MUTATION_IDLE_THRESHOLD) {
      return {
        status: 'TRAJECTORY_STAGNATION',
        triggerRule: 'Rule 5A: Post-Mutation Idle Stalling',
        confidence: 'HIGH',
        evidenceSummary: `${latestTurn.cumulativePostMutationIdleTurns} consecutive non-mutating actions (READ/SHELL) recorded after an unresolved mutation (threshold: ${STAGNATION_THRESHOLDS.POST_MUTATION_IDLE_THRESHOLD}).`,
        metrics,
      };
    }

    // 5B: Multi-mutation error delta oscillation or duplicate patch
    if (appliedMutationsCount >= STAGNATION_THRESHOLDS.MUTATION_OSCILLATION_THRESHOLD) {
      const lastTwo = appliedMutations.slice(-2);
      const recentErrorsIdentical = areVerificationOutputsIdentical(
        lastTwo[0].verificationOutputSnippet,
        lastTwo[1].verificationOutputSnippet
      );

      // Check if patch content was repeated across mutation history
      let patchRepeated = false;
      for (let i = 0; i < appliedMutations.length; i++) {
        for (let j = i + 1; j < appliedMutations.length; j++) {
          const mutA: MutationAttemptRecord = {
            targetFile: appliedMutations[i].declaredTargetFile ?? '',
            oldText: appliedMutations[i].rawActionArgs?.old_text ?? appliedMutations[i].rawActionArgs?.oldText,
            newText: appliedMutations[i].rawActionArgs?.new_text ?? appliedMutations[i].rawActionArgs?.newText ?? appliedMutations[i].rawActionArgs?.replacement,
          };
          const mutB: MutationAttemptRecord = {
            targetFile: appliedMutations[j].declaredTargetFile ?? '',
            oldText: appliedMutations[j].rawActionArgs?.old_text ?? appliedMutations[j].rawActionArgs?.oldText,
            newText: appliedMutations[j].rawActionArgs?.new_text ?? appliedMutations[j].rawActionArgs?.newText ?? appliedMutations[j].rawActionArgs?.replacement,
          };
          if (areMutationsIdentical(mutA, mutB)) {
            patchRepeated = true;
            break;
          }
        }
        if (patchRepeated) break;
      }

      if (recentErrorsIdentical || patchRepeated) {
        return {
          status: 'TRAJECTORY_STAGNATION',
          triggerRule: 'Rule 5B: Error or Patch Oscillation',
          confidence: 'HIGH',
          evidenceSummary: recentErrorsIdentical
            ? 'Consecutive mutation error outputs identical across 2 applied mutations.'
            : 'Duplicate patch content detected across mutation history.',
          metrics,
        };
      }

      // 5C: Mutation ceiling without pass (>= 3 mutations without exit 0)
      if (appliedMutationsCount >= STAGNATION_THRESHOLDS.MUTATION_CEILING_WITHOUT_PASS && !latestTurn.verificationPassed) {
        return {
          status: 'TRAJECTORY_STAGNATION',
          triggerRule: 'Rule 5C: Mutation Ceiling Exhaustion',
          confidence: 'MODERATE',
          evidenceSummary: `${appliedMutationsCount} mutations executed without resolving verification (threshold: ${STAGNATION_THRESHOLDS.MUTATION_CEILING_WITHOUT_PASS}).`,
          metrics,
        };
      }
    }

    // 5D: Active post-mutation evaluation window (< 3 idle turns)
    return {
      status: 'TRAJECTORY_CONTINUE',
      triggerRule: 'Rule 5D: Active Post-Mutation Evaluation',
      confidence: 'MODERATE',
      evidenceSummary: `Agent actively evaluating applied mutation outcome (${latestTurn.cumulativePostMutationIdleTurns} idle turns; threshold: ${STAGNATION_THRESHOLDS.POST_MUTATION_IDLE_THRESHOLD}).`,
      metrics,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 6: Ungrounded Navigation Loop (>= 3 turns read/shell without grounding)
  // --------------------------------------------------------------------------
  if (
    latestTurn.cumulativeNavigationTurns >= STAGNATION_THRESHOLDS.NAVIGATION_LOOP_THRESHOLD &&
    appliedMutationsCount === 0 &&
    !latestTurn.isCoordinateGrounded
  ) {
    return {
      status: 'TRAJECTORY_INTERFACE_FRICTION',
      triggerRule: 'Rule 6: Ungrounded Navigation Loop',
      confidence: 'HIGH',
      evidenceSummary: `${latestTurn.cumulativeNavigationTurns} consecutive read/shell actions observed without target coordinate grounding or code mutations.`,
      metrics,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 2: Early Exploration Grace Window (Turns 1-2 without mutations)
  // --------------------------------------------------------------------------
  if (turnIndex <= STAGNATION_THRESHOLDS.EARLY_TURNS_GRACE_WINDOW && !latestTurn.isFinishRequested) {
    return {
      status: 'TRAJECTORY_CONTINUE',
      triggerRule: 'Rule 2: Early Turns Grace Window',
      confidence: 'MODERATE',
      evidenceSummary: `Early turn ${turnIndex} within grace window (${STAGNATION_THRESHOLDS.EARLY_TURNS_GRACE_WINDOW} turns).`,
      metrics,
    };
  }

  // --------------------------------------------------------------------------
  // Rule 7: Default Fallback
  // --------------------------------------------------------------------------
  return {
    status: 'TRAJECTORY_CONTINUE',
    triggerRule: 'Rule 7: Default Observation Fallback',
    confidence: 'MODERATE',
    evidenceSummary: 'Trajectory signals active without threshold violations; continuing normal observation.',
    metrics,
  };
}
