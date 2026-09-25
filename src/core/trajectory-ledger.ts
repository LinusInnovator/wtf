/**
 * WTF Trajectory Ledger (Phase 10.2 / Protocol v0.3)
 *
 * An append-only, immutable record of execution turns across an agent session.
 * Captures observable software reality, tool enactments, and verification outcomes
 * without interpreting agent intent or diagnosing cognitive capacity.
 *
 * Epistemic Provenance Invariants:
 * 1. DETERMINISTIC_REALITY: Direct physical measurements from OS, filesystem, git, or compiler execution.
 * 2. DERIVED_DETERMINISTIC_STATE: Deterministically computed from physical reality via pure functions.
 * 3. INTELLIGENCE_SUPPLIED_CLAIM: Provided by model or user; unverified assertion.
 *
 * Rule: Never promote an intelligence-supplied claim to deterministic fact without physical verification.
 */

import * as path from 'node:path';
import { CanonicalActionClass, normalizeActionName } from './action-normalizer.js';
import { TraceFrame, extractTraceFrames } from './trace-slice.js';

export type EpistemicProvenance =
  | 'DETERMINISTIC_REALITY'
  | 'DERIVED_DETERMINISTIC_STATE'
  | 'INTELLIGENCE_SUPPLIED_CLAIM';

export interface TrajectoryTurnRecord {
  // --- Turn Identification ---
  /** PROVENANCE: DETERMINISTIC_REALITY (1-indexed sequential turn counter) */
  turnIndex: number;
  /** PROVENANCE: DETERMINISTIC_REALITY (ISO-8601 UTC timestamp of record creation) */
  timestamp: string;
  /** PROVENANCE: DETERMINISTIC_REALITY (Session / trajectory identifier) */
  sessionId: string;

  // --- Intelligence Input (Unverified Claims) ---
  /** PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (Raw tool or action verb requested by agent) */
  rawActionName: string;
  /** PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (Raw arguments payload supplied by agent) */
  rawActionArgs: Record<string, any>;
  /** PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (Target file path asserted by agent in args) */
  declaredTargetFile?: string;
  /** PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (Intent, instruction, or explanation text) */
  declaredIntent?: string;
  /** PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (Whether the agent emitted finish/complete) */
  isFinishRequested: boolean;

  // --- Substrate Action Enactment (Physical Reality) ---
  /** PROVENANCE: DERIVED_DETERMINISTIC_STATE (Normalized canonical action class via action-normalizer.ts) */
  canonicalAction: CanonicalActionClass;
  /** PROVENANCE: DETERMINISTIC_REALITY (Status returned by action compiler or execution environment) */
  actionStatus: 'success' | 'failed' | 'rejected' | 'executed' | 'unknown';
  /** PROVENANCE: DETERMINISTIC_REALITY (Mechanical error or rejection reason if enactment failed) */
  actionRejectionReason?: string;
  /** PROVENANCE: DETERMINISTIC_REALITY (Uncommitted git diff produced on disk by this action) */
  enactedDiff?: string;

  // --- Verification Lifecycle Outcome (Physical Reality) ---
  /** PROVENANCE: DETERMINISTIC_REALITY (Whether verification check was executed this turn) */
  verificationExecuted: boolean;
  /** PROVENANCE: DETERMINISTIC_REALITY (Exact shell verification command line executed) */
  verificationCommand?: string;
  /** PROVENANCE: DETERMINISTIC_REALITY (Integer exit code from test runner process) */
  verificationExitCode?: number;
  /** PROVENANCE: DETERMINISTIC_REALITY (Execution wall-clock time in milliseconds) */
  verificationDurationMs?: number;
  /** PROVENANCE: DETERMINISTIC_REALITY (True if exit code was 0, false otherwise) */
  verificationPassed?: boolean;
  /** PROVENANCE: DETERMINISTIC_REALITY (Stdout/stderr stream from verification subprocess) */
  verificationOutputSnippet?: string;

  // --- Derived Spatial & Error State ---
  /** PROVENANCE: DERIVED_DETERMINISTIC_STATE (Traceback frames extracted via trace-slice.ts) */
  extractedCoordinates: TraceFrame[];
  /** PROVENANCE: DERIVED_DETERMINISTIC_STATE (Error delta compared to prior turn) */
  errorDeltaFromPrevious?: 'identical' | 'changed' | 'resolved' | 'first_observation' | 'none';

  // --- Cumulative Arithmetic State (Counters) ---
  /** PROVENANCE: DERIVED_DETERMINISTIC_STATE (Consecutive ungrounded read/shell turns) */
  cumulativeNavigationTurns: number;
  /** PROVENANCE: DERIVED_DETERMINISTIC_STATE (Consecutive mechanical action compiler rejections) */
  cumulativeActionFailures: number;
  /** PROVENANCE: DERIVED_DETERMINISTIC_STATE (Consecutive read/shell turns following a failing mutation) */
  cumulativePostMutationIdleTurns: number;
  /** PROVENANCE: DERIVED_DETERMINISTIC_STATE (Whether declared target matches a failure coordinate) */
  isCoordinateGrounded: boolean;
  /** PROVENANCE: DERIVED_DETERMINISTIC_STATE (Whether target coordinate has ever been grounded in this session) */
  hasEverGrounded: boolean;
}

export const FIELD_PROVENANCE_MAP: Readonly<Record<keyof TrajectoryTurnRecord, EpistemicProvenance>> = Object.freeze({
  turnIndex: 'DETERMINISTIC_REALITY',
  timestamp: 'DETERMINISTIC_REALITY',
  sessionId: 'DETERMINISTIC_REALITY',
  rawActionName: 'INTELLIGENCE_SUPPLIED_CLAIM',
  rawActionArgs: 'INTELLIGENCE_SUPPLIED_CLAIM',
  declaredTargetFile: 'INTELLIGENCE_SUPPLIED_CLAIM',
  declaredIntent: 'INTELLIGENCE_SUPPLIED_CLAIM',
  isFinishRequested: 'INTELLIGENCE_SUPPLIED_CLAIM',
  canonicalAction: 'DERIVED_DETERMINISTIC_STATE',
  actionStatus: 'DETERMINISTIC_REALITY',
  actionRejectionReason: 'DETERMINISTIC_REALITY',
  enactedDiff: 'DETERMINISTIC_REALITY',
  verificationExecuted: 'DETERMINISTIC_REALITY',
  verificationCommand: 'DETERMINISTIC_REALITY',
  verificationExitCode: 'DETERMINISTIC_REALITY',
  verificationDurationMs: 'DETERMINISTIC_REALITY',
  verificationPassed: 'DETERMINISTIC_REALITY',
  verificationOutputSnippet: 'DETERMINISTIC_REALITY',
  extractedCoordinates: 'DERIVED_DETERMINISTIC_STATE',
  errorDeltaFromPrevious: 'DERIVED_DETERMINISTIC_STATE',
  cumulativeNavigationTurns: 'DERIVED_DETERMINISTIC_STATE',
  cumulativeActionFailures: 'DERIVED_DETERMINISTIC_STATE',
  cumulativePostMutationIdleTurns: 'DERIVED_DETERMINISTIC_STATE',
  isCoordinateGrounded: 'DERIVED_DETERMINISTIC_STATE',
  hasEverGrounded: 'DERIVED_DETERMINISTIC_STATE',
});

export interface RecordTurnInput {
  rawActionName: string;
  rawActionArgs?: Record<string, any>;
  declaredTargetFile?: string;
  declaredIntent?: string;
  actionStatus?: 'success' | 'failed' | 'rejected' | 'executed' | 'unknown';
  actionRejectionReason?: string;
  enactedDiff?: string;
  verificationExecuted?: boolean;
  verificationCommand?: string;
  verificationExitCode?: number;
  verificationDurationMs?: number;
  verificationPassed?: boolean;
  verificationOutput?: string;
  workspaceDir?: string;
}

/**
 * Append-only immutable turn ledger for agent execution trajectories.
 */
export class TrajectoryLedger {
  private readonly sessionId: string;
  private readonly workspaceDir: string;
  private readonly turns: TrajectoryTurnRecord[] = [];
  private hasEverGrounded: boolean = false;

  constructor(sessionId: string = 'session-default', workspaceDir: string = process.cwd()) {
    this.sessionId = sessionId;
    this.workspaceDir = workspaceDir;
  }

  /**
   * Appends an observable turn record to the immutable ledger.
   * Computes derived deterministic fields and maintains cumulative state counters.
   */
  public appendTurn(input: RecordTurnInput): Readonly<TrajectoryTurnRecord> {
    const turnIndex = this.turns.length + 1;
    const timestamp = new Date().toISOString();
    const rawActionName = input.rawActionName || '';
    const rawActionArgs = input.rawActionArgs ? { ...input.rawActionArgs } : {};
    const canonicalAction = normalizeActionName(rawActionName);
    const isFinishRequested = canonicalAction === 'FINISH';

    // 1. Resolve declared target file from explicit input or common argument keys
    let declaredTargetFile: string | undefined = input.declaredTargetFile;
    if (!declaredTargetFile && rawActionArgs) {
      declaredTargetFile =
        rawActionArgs.targetFile ??
        rawActionArgs.target_file ??
        rawActionArgs.filePath ??
        rawActionArgs.file_path ??
        rawActionArgs.path;
    }
    if (typeof declaredTargetFile !== 'string') {
      declaredTargetFile = undefined;
    }

    // 2. Extract failure coordinates from verification output if present
    const ws = input.workspaceDir || this.workspaceDir;
    let extractedCoordinates: TraceFrame[] = [];
    if (input.verificationOutput) {
      extractedCoordinates = extractTraceFrames(input.verificationOutput, ws);
    }

    // 3. Grounding evaluation (does declared target match an extracted trace coordinate)
    let isCoordinateGroundedThisTurn = false;
    if (declaredTargetFile) {
      const normDeclared = path.normalize(declaredTargetFile.trim()).replace(/\\/g, '/');
      isCoordinateGroundedThisTurn = extractedCoordinates.some(frame => {
        const normFrame = path.normalize(frame.file.trim()).replace(/\\/g, '/');
        return normDeclared === normFrame || normDeclared.endsWith('/' + normFrame);
      });
      if (isCoordinateGroundedThisTurn) {
        this.hasEverGrounded = true;
      }
    }

    // 4. Calculate verification delta compared to prior turn
    const verificationPassed = input.verificationExecuted
      ? (input.verificationPassed ?? (input.verificationExitCode === 0))
      : undefined;

    let errorDeltaFromPrevious: TrajectoryTurnRecord['errorDeltaFromPrevious'] = 'none';
    const priorTurn = this.turns[this.turns.length - 1];
    if (input.verificationExecuted) {
      if (!priorTurn || !priorTurn.verificationExecuted) {
        errorDeltaFromPrevious = 'first_observation';
      } else if (verificationPassed && !priorTurn.verificationPassed) {
        errorDeltaFromPrevious = 'resolved';
      } else {
        const currentSnippet = (input.verificationOutput ?? '').trim();
        const priorSnippet = (priorTurn.verificationOutputSnippet ?? '').trim();
        errorDeltaFromPrevious = currentSnippet === priorSnippet ? 'identical' : 'changed';
      }
    }

    // 5. Compute cumulative arithmetic state
    const priorNavTurns = priorTurn ? priorTurn.cumulativeNavigationTurns : 0;
    const priorActionFails = priorTurn ? priorTurn.cumulativeActionFailures : 0;
    const priorPostMutationIdle = priorTurn ? priorTurn.cumulativePostMutationIdleTurns : 0;

    const isNavAction = canonicalAction === 'READ' || canonicalAction === 'SHELL';
    const cumulativeNavigationTurns = isNavAction
      ? priorNavTurns + 1
      : (canonicalAction === 'FINISH' ? priorNavTurns : 0);

    const actionStatus = input.actionStatus ?? (canonicalAction === 'MUTATION' ? 'success' : 'executed');
    let cumulativeActionFailures = 0;
    if (canonicalAction === 'MUTATION') {
      if (actionStatus === 'failed' || actionStatus === 'rejected') {
        cumulativeActionFailures = priorActionFails + 1;
      } else {
        cumulativeActionFailures = 0;
      }
    } else if (isNavAction || canonicalAction === 'FINISH') {
      // Navigation and finish retain previous action failure count without resetting it
      cumulativeActionFailures = priorActionFails;
    } else {
      cumulativeActionFailures = 0;
    }

    // Post-mutation idle turns: count read/shell actions following at least one applied mutation
    const hasAppliedMutation = this.turns.some(t => t.canonicalAction === 'MUTATION' && t.actionStatus === 'success') ||
      (canonicalAction === 'MUTATION' && actionStatus === 'success');
    let cumulativePostMutationIdleTurns = 0;
    if (canonicalAction === 'MUTATION' && actionStatus === 'success') {
      cumulativePostMutationIdleTurns = 0;
    } else if (isNavAction && hasAppliedMutation) {
      cumulativePostMutationIdleTurns = priorPostMutationIdle + 1;
    } else {
      cumulativePostMutationIdleTurns = isNavAction ? priorPostMutationIdle : 0;
    }

    const record: TrajectoryTurnRecord = Object.freeze({
      turnIndex,
      timestamp,
      sessionId: this.sessionId,
      rawActionName,
      rawActionArgs,
      declaredTargetFile,
      declaredIntent: input.declaredIntent,
      isFinishRequested,
      canonicalAction,
      actionStatus,
      actionRejectionReason: input.actionRejectionReason,
      enactedDiff: input.enactedDiff,
      verificationExecuted: input.verificationExecuted ?? false,
      verificationCommand: input.verificationCommand,
      verificationExitCode: input.verificationExitCode,
      verificationDurationMs: input.verificationDurationMs,
      verificationPassed,
      verificationOutputSnippet: input.verificationOutput ? input.verificationOutput.slice(0, 1000) : undefined,
      extractedCoordinates,
      errorDeltaFromPrevious,
      cumulativeNavigationTurns,
      cumulativeActionFailures,
      cumulativePostMutationIdleTurns,
      isCoordinateGrounded: isCoordinateGroundedThisTurn,
      hasEverGrounded: this.hasEverGrounded,
    });

    this.turns.push(record);
    return record;
  }

  /**
   * Returns a read-only view of all recorded turns.
   */
  public getTurns(): ReadonlyArray<TrajectoryTurnRecord> {
    return [...this.turns];
  }

  /**
   * Returns the total count of turns in the ledger.
   */
  public getTurnCount(): number {
    return this.turns.length;
  }

  /**
   * Returns a specific turn record by 1-indexed turn number.
   */
  public getTurn(turnIndex: number): TrajectoryTurnRecord | undefined {
    if (turnIndex < 1 || turnIndex > this.turns.length) return undefined;
    return this.turns[turnIndex - 1];
  }

  /**
   * Returns the latest turn record, or undefined if ledger is empty.
   */
  public getLatestTurn(): TrajectoryTurnRecord | undefined {
    if (this.turns.length === 0) return undefined;
    return this.turns[this.turns.length - 1];
  }

  /**
   * Returns all turns where a mutation was successfully enacted on disk.
   */
  public getAppliedMutations(): ReadonlyArray<TrajectoryTurnRecord> {
    return this.turns.filter(t => t.canonicalAction === 'MUTATION' && t.actionStatus === 'success');
  }

  /**
   * Serializes the ledger to JSON string for persistence or transport.
   */
  public toJSON(): string {
    return JSON.stringify({
      version: '0.3.0',
      sessionId: this.sessionId,
      workspaceDir: this.workspaceDir,
      turns: this.turns,
    }, null, 2);
  }

  /**
   * Deserializes a ledger from JSON string, preserving historical turn integrity.
   */
  public static fromJSON(jsonStr: string): TrajectoryLedger {
    const data = JSON.parse(jsonStr);
    const ledger = new TrajectoryLedger(data.sessionId ?? 'restored-session', data.workspaceDir ?? process.cwd());
    if (Array.isArray(data.turns)) {
      for (const t of data.turns) {
        ledger.turns.push(Object.freeze({ ...t }));
      }
    }
    return ledger;
  }
}
