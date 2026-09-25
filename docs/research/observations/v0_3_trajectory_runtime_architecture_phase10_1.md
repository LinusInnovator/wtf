# WTF Phase 10.1 — v0.3 Trajectory State & Handoff Architecture Specification

**Status:** COMPLETE ARCHITECTURE SPECIFICATION (ZERO IMPLEMENTATION — ZERO EXPERIMENTS)  
**Date:** September 2026  
**Target Release:** WTF `v0.3.0`  
**Substrate Baseline:** WTF `v0.2.0` Frozen & Immutable (`ed1dbea`)  
**Foundational Research:** Phase 8.3–8.5, Phase 8.6, Phase 9.0, Phase 10.0  
**Governing Rule:**  
> *Observe trajectory. Preserve reality. Signal stagnation. Decide nothing.*

---

## 1. Executive Summary & Mission of v0.3

WTF `v0.1.0` established deterministic perception and verification receipts for single-turn code reviews.  
WTF `v0.2.0` established the Invariant Execution Substrate (`TraceSlice`, `BoundedViewport`, `ActionNormalizer`, `ActionCompiler`).

**WTF `v0.3.0` has exactly one mission:**
> *Preserve factual trajectory state across multi-turn sessions, signal observable stagnation without making autonomous policy choices, and compile established reality into a bounded continuation packet.*

### Strict Architectural Boundaries for v0.3
1. **Zero Model Execution:** WTF v0.3 contains no LLM calling code, no API client, no gateway, and no subprocess runners for generative models.
2. **Zero Autonomous Scheduling:** WTF v0.3 never aborts a process, triggers a retry, switches models, routes tasks, or selects replacement intelligence. Those are external policy decisions reserved strictly for humans or external agent harnesses.
3. **Zero Model Profiles:** WTF v0.3 contains no hardcoded model dictionaries (`1.5b` vs `3b` vs `7b`), no capability cards, and no calibration probes.
4. **Zero Chain-of-Thought Contamination:** WTF v0.3 records and transfers only verified physical reality from disk, git, and execution receipts. Private reasoning tokens, hidden scratchpads, and conversational chat histories are strictly excluded.
5. **Rigorous Epistemic Provenance:** Every field in the runtime is classified and preserved as `DETERMINISTIC REALITY`, `DERIVED DETERMINISTIC STATE`, or `INTELLIGENCE-SUPPLIED CLAIM`. Intelligence claims are never silently upgraded to deterministic facts.

---

## 2. Component 1 — TrajectoryLedger (`src/core/trajectory-ledger.ts`)

The `TrajectoryLedger` is an append-only, immutable record of execution turns across an agent session. It captures the reality of what occurred without interpreting agent intent or diagnosing cognitive capacity.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TRAJECTORY LEDGER ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Incoming Turn Input                                                        │
│  ├── Action Requested (Tool Verb + Arguments) [INTELLIGENCE CLAIM]          │
│  ├── Substrate Enactment (ActionCompiler / Disk) [DETERMINISTIC REALITY]   │
│  └── Subprocess Verification (Command + Output) [DETERMINISTIC REALITY]     │
│                     │                                                       │
│                     ▼                                                       │
│  Provenance Tagging Engine                                                  │
│  ├── Classifies action via ActionNormalizer (DERIVED DETERMINISTIC)         │
│  ├── Extracts trace coordinates via TraceSlice (DERIVED DETERMINISTIC)      │
│  ├── Computes error delta against prior turn (DETERMINISTIC REALITY)        │
│  └── Updates arithmetic trajectory counters (DERIVED DETERMINISTIC)         │
│                     │                                                       │
│                     ▼                                                       │
│  Append-Only Immutable Ledger Store (`TrajectoryTurnRecord[]`)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Exact Schema & Provenance Mapping

Every field in `TrajectoryTurnRecord` has a strictly defined provenance:

```typescript
export type EpistemicProvenance =
  | 'DETERMINISTIC_REALITY'       // Measured directly from OS, filesystem, or git
  | 'DERIVED_DETERMINISTIC_STATE' // Deterministically computed/derived from reality
  | 'INTELLIGENCE_SUPPLIED_CLAIM';// Provided by model/user; unverified assertion

export interface TrajectoryTurnRecord {
  // --- Turn Identification ---
  turnIndex: number;                  // PROVENANCE: DETERMINISTIC_REALITY (1-indexed sequence)
  timestamp: string;                  // PROVENANCE: DETERMINISTIC_REALITY (ISO-8601 UTC)
  sessionId: string;                  // PROVENANCE: DETERMINISTIC_REALITY (UUID / session identifier)

  // --- Intelligence Input (Unverified Claims) ---
  rawActionName: string;              // PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (e.g. "replace_in_file")
  rawActionArgs: Record<string, any>; // PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (user/model inputs)
  declaredTargetFile?: string;        // PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (path claimed in args)
  declaredIntent?: string;            // PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (instruction or reasoning summary)
  isFinishRequested: boolean;         // PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (model called finish/exit)

  // --- Substrate Action Enactment (Physical Reality) ---
  canonicalAction: CanonicalActionClass; // PROVENANCE: DERIVED_DETERMINISTIC_STATE (from action-normalizer.ts)
  actionStatus: 'success' | 'failed' | 'rejected' | 'executed'; // PROVENANCE: DETERMINISTIC_REALITY
  actionRejectionReason?: string;     // PROVENANCE: DETERMINISTIC_REALITY (ActionCompiler error string)
  enactedDiff?: string;               // PROVENANCE: DETERMINISTIC_REALITY (git diff produced by mutation)

  // --- Verification Lifecycle Outcome (Physical Reality) ---
  verificationExecuted: boolean;      // PROVENANCE: DETERMINISTIC_REALITY (was check triggered)
  verificationCommand?: string;       // PROVENANCE: DETERMINISTIC_REALITY (exact command line)
  verificationExitCode?: number;      // PROVENANCE: DETERMINISTIC_REALITY (subprocess exit code)
  verificationDurationMs?: number;    // PROVENANCE: DETERMINISTIC_REALITY (process runtime ms)
  verificationPassed?: boolean;       // PROVENANCE: DETERMINISTIC_REALITY (exitCode === 0)
  verificationOutputSnippet?: string; // PROVENANCE: DETERMINISTIC_REALITY (stdout/stderr head/tail)

  // --- Derived Spatial & Error State ---
  extractedCoordinates: TraceFrame[]; // PROVENANCE: DERIVED_DETERMINISTIC_STATE (from trace-slice.ts)
  errorDeltaFromPrevious?: 'identical' | 'changed' | 'resolved' | 'first_observation'; // PROVENANCE: DERIVED_DETERMINISTIC_STATE

  // --- Cumulative Arithmetic State (Counters) ---
  cumulativeNavigationTurns: number;  // PROVENANCE: DERIVED_DETERMINISTIC_STATE (consecutive READ/SHELL)
  cumulativeActionFailures: number;   // PROVENANCE: DERIVED_DETERMINISTIC_STATE (consecutive failed MUTATION)
  cumulativePostMutationIdleTurns: number; // PROVENANCE: DERIVED_DETERMINISTIC_STATE (READ/SHELL after mutation)
  isCoordinateGrounded: boolean;      // PROVENANCE: DERIVED_DETERMINISTIC_STATE (declared file matches trace)
}
```

### Invariants of the TrajectoryLedger
1. **Append-Only Immutability:** Once recorded, a turn record cannot be rewritten, re-ordered, or deleted.
2. **Zero Semantic Promotion:** An intelligence claim (e.g. `rawActionArgs.path = "src/foo.py"`) is **never** promoted to a verified file modification until `ActionCompiler` successfully mutates the disk and `git status` verifies the change.
3. **Lossless Failure Recording:** If an action fails mechanically (patch rejection) or execution throws an unhandled error, the ledger logs the verbatim error string with status `'rejected'` or `'failed'`.

---

## 3. Component 2 — TrajectoryStagnationDetector (`src/core/stagnation-detector.ts`)

The `TrajectoryStagnationDetector` evaluates the chronological sequence of `TrajectoryTurnRecord` entries in the ledger. It produces a **factual trajectory health signal**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STAGNATION DETECTOR ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Observable Trajectory Inputs                                               │
│  ├── Sequential turn records from TrajectoryLedger                          │
│  ├── Action success/failure statuses                                        │
│  ├── Cumulative navigation / idle turn counters                             │
│  └── Subprocess verification pass/fail status                               │
│                     │                                                       │
│                     ▼                                                       │
│  Frozen Phase 8.3B Rule Hierarchy (Evaluated in strict order)               │
│  ├── 1. Verification Pass Override → `TRAJECTORY_PASS`                       │
│  ├── 2. Early Turns Exploration Grace → `TRAJECTORY_CONTINUE`               │
│  ├── 3. Premature Finish Handling → `TRAJECTORY_STAGNATION` / `INTERFACE`  │
│  ├── 4. Action Failure Counter → `TRAJECTORY_STAGNATION` / `ACTION_FRICTION`│
│  ├── 5. Post-Mutation Idle Stalling → `TRAJECTORY_STAGNATION`               │
│  ├── 6. Multi-Mutation Error Oscillation → `TRAJECTORY_STAGNATION`          │
│  ├── 7. Navigation Wander Loop → `TRAJECTORY_INTERFACE_FRICTION`            │
│  └── 8. Default Convergence Observation → `TRAJECTORY_CONTINUE`             │
│                     │                                                       │
│                     ▼                                                       │
│  TrajectoryStagnationSignal (Pure Signal — ZERO Autonomous Action)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Strict Prohibition on Speculative Cognitive Terminology
In accordance with Phase 10.0 findings, the detector **must never** emit terms that diagnose model intelligence or speculate on model psychology:
- **PROHIBITED:** `CAPABILITY_BOUNDARY`, `MODEL_INCAPABLE`, `REASONING_FAILURE`, `MODEL_LIMIT_REACHED`, `GIVE_UP`.
- **MANDATED:** `TRAJECTORY_STAGNATION`, `TRAJECTORY_CONTINUE`, `TRAJECTORY_PASS`, `TRAJECTORY_INTERFACE_FRICTION`, `TRAJECTORY_ACTION_FRICTION`, `TRAJECTORY_UNKNOWN`.

### Separation: Deterministic Observations vs. Heuristic Thresholds

To preserve transparency, the detector strictly isolates deterministic state evaluations from heuristic behavioral thresholds:

#### A. Deterministic Observations (Physical Facts)
- `verificationPassed === true`: Command executed and exited 0.
- `consecutiveActionFailures`: Integer count of consecutive patch compiler rejections.
- `consecutivePostMutationIdleTurns`: Integer count of consecutive read/command turns following a failing mutation.
- `recentErrorsIdentical`: Strict string equality check between verification outputs of the last two applied mutations.
- `patchRepeated`: Duplicate patch content detected across mutation history.

#### B. Frozen Heuristic Thresholds (Pre-registered in Phase 8.3B)
These thresholds are empirical parameters derived from Phase 8.3B research ($N=34$ turns, 100% specificity, 0 premature stops):

```typescript
export const STAGNATION_THRESHOLDS = Object.freeze({
  EARLY_TURNS_GRACE_WINDOW: 2,        // Turns 1-2 reserved for initial orientation
  NAVIGATION_LOOP_THRESHOLD: 3,       // >= 3 ungrounded read/shell turns without edits
  POST_MUTATION_IDLE_THRESHOLD: 3,    // >= 3 idle read/shell turns following a failed mutation
  PERSISTENT_ACTION_FAILURE_THRESHOLD: 4, // >= 4 consecutive mechanical patch rejections
  MUTATION_OSCILLATION_THRESHOLD: 2,  // >= 2 applied mutations with identical error outputs
  MUTATION_CEILING_WITHOUT_PASS: 3,   // >= 3 applied mutations without passing verification
});
```

### Exact Rule Specification

```typescript
export type TrajectoryHealthStatus =
  | 'TRAJECTORY_PASS'                 // Verification passed; task complete
  | 'TRAJECTORY_CONTINUE'             // Normal progress, early turns, or active evaluation
  | 'TRAJECTORY_INTERFACE_FRICTION'   // Ungrounded navigation / reading loop
  | 'TRAJECTORY_ACTION_FRICTION'      // Mechanical patch formatting rejection (< 4 attempts)
  | 'TRAJECTORY_STAGNATION'           // Negative stagnation; autonomous recovery near 0%
  | 'TRAJECTORY_UNKNOWN';             // Ambiguous trajectory state

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
```

The evaluation function `evaluateTrajectoryHealth(ledger: TrajectoryTurnRecord[]): TrajectoryStagnationSignal` executes the following rules in strict order:

1. **Rule 1 — Terminal Pass:**
   - If latest turn has `verificationPassed === true` $\to$ emit `TRAJECTORY_PASS` (Confidence: HIGH).
2. **Rule 2 — Early Exploration Grace Window:**
   - If current turn $\le 2$ AND latest turn `isFinishRequested === false` $\to$ emit `TRAJECTORY_CONTINUE` (Confidence: MODERATE).
3. **Rule 3 — Unresolved Finish Handling (`isFinishRequested === true` with `verificationPassed !== true`):**
   - If `consecutiveNavigationTurns >= NAVIGATION_LOOP_THRESHOLD` and 0 mutations $\to$ emit `TRAJECTORY_INTERFACE_FRICTION`.
   - If `consecutiveActionFailures >= 2` $\to$ emit `TRAJECTORY_ACTION_FRICTION`.
   - If `isCoordinateGrounded === true` (via `isCoordinateGrounded()`) $\to$ emit `TRAJECTORY_STAGNATION` ("FINISH action emitted while verification command is failing on grounded workspace coordinate").
   - Else $\to$ emit `TRAJECTORY_UNKNOWN`.
4. **Rule 4 — Mechanical Action Failure vs. Persistent Stagnation:**
   - If latest turn `canonicalAction === 'MUTATION'` and `actionStatus in ('failed', 'rejected')`:
     - If `consecutiveActionFailures >= PERSISTENT_ACTION_FAILURE_THRESHOLD (4)` $\to$ emit `TRAJECTORY_STAGNATION` ("4 consecutive candidate mutations rejected by ActionCompiler").
     - Else $\to$ emit `TRAJECTORY_ACTION_FRICTION` ("Mechanical patch formatting rejection; observation window open").
5. **Rule 5 — Post-Mutation Idle Stagnation & Oscillation:**
   - If applied mutations $\ge 1$:
     - If `consecutivePostMutationIdleTurns >= POST_MUTATION_IDLE_THRESHOLD (3)` $\to$ emit `TRAJECTORY_STAGNATION` ("3 consecutive non-mutating actions (READ/SHELL) recorded after an unresolved mutation").
     - If applied mutations $\ge 2$:
       - If `recentErrorsIdentical === true` (via `areVerificationOutputsIdentical()`) or `patchRepeated === true` (via `areMutationsIdentical()`) $\to$ emit `TRAJECTORY_STAGNATION` ("Consecutive mutation error outputs identical or duplicate patch content detected across >= 2 mutations").
       - If applied mutations $\ge MUTATION_CEILING_WITHOUT_PASS (3)` $\to$ emit `TRAJECTORY_STAGNATION` (">= 3 mutations executed without resolving verification").
     - Else $\to$ emit `TRAJECTORY_CONTINUE` ("Active post-mutation evaluation window").
6. **Rule 6 — Ungrounded Navigation Loop:**
   - If `consecutiveNavigationTurns >= NAVIGATION_LOOP_THRESHOLD (3)` and 0 mutations and `isCoordinateGrounded === false` $\to$ emit `TRAJECTORY_INTERFACE_FRICTION` ("3 consecutive ungrounded read/shell actions without code mutations").
7. **Rule 7 — Default Fallback:**
   - If none of the above fire $\to$ emit `TRAJECTORY_CONTINUE` (or `TRAJECTORY_UNKNOWN` if signals are contradictory).

### Constitutional Policy Audit: Autonomous Decisions = 0
- Does the detector halt the process? **NO.**
- Does the detector retry the command? **NO.**
- Does the detector switch models? **NO.**
- Does the detector modify code? **NO.**
- Does the detector recommend a patch? **NO.**
- **Autonomous Policy Decisions Made by Detector: EXACTLY 0.**

---

## 4. Component 3 — HandoffCompiler (`src/core/handoff-compiler.ts`)

The `HandoffCompiler` deterministically compiles the established physical state of a trajectory into a structured, bounded continuation artifact: the **`HandoffPacket`**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HANDOFF COMPILER ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Established Reality Sources                                                │
│  ├── Git Subsystem: `git status --short`, `git diff` [DETERMINISTIC REALITY]│
│  ├── Subprocess Execution: Last verification stdout/stderr [REALITY]       │
│  ├── Workspace Disk Files: Source bytes at target coordinate [REALITY]      │
│  └── Trajectory Ledger: Factual record of executed mutations [REALITY]     │
│                     │                                                       │
│                     ▼                                                       │
│  Deterministic Substrate Composition (v0.2 Primitives)                      │
│  ├── TraceSlice (`src/core/trace-slice.ts`): Parses error frames            │
│  └── Viewport (`src/core/viewport.ts`): Renders [coord ± radius] window     │
│                     │                                                       │
│                     ▼                                                       │
│  Factual Compilation Assembly (Zero CoT / Zero Inferred Solutions)          │
│  ├── Target File & Primary Coordinate Frame                                 │
│  ├── Bounded Code Viewport (Raw disk lines + Line numbers)                  │
│  ├── Active Repository Diff (Uncommitted changes)                           │
│  ├── Prior Failed Mutation Attempts & Corresponding Error Deltas             │
│  └── Current Unresolved Verification Status (Exit code + Command)           │
│                     │                                                       │
│                     ▼                                                       │
│  `HandoffPacket` (JSON Schema / Zero-ANSI Markdown Document)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Complete Schema of the `HandoffPacket`

```typescript
export interface FailedMutationReceipt {
  turnIndex: number;
  targetFile: string;
  attemptedSnippet: string;       // PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (author's snippet)
  enactedStatus: string;          // PROVENANCE: DETERMINISTIC_REALITY (ActionCompiler status)
  resultingVerificationError: string; // PROVENANCE: DETERMINISTIC_REALITY (error emitted after attempt)
}

export interface HandoffPacket {
  version: '0.3.0';
  compilationTimestamp: string;   // PROVENANCE: DETERMINISTIC_REALITY

  // --- Task Definition (Intelligence Claims) ---
  taskIntent: string;             // PROVENANCE: INTELLIGENCE_SUPPLIED_CLAIM (user prompt / task spec)
  targetFile: string;             // PROVENANCE: DERIVED_DETERMINISTIC_STATE (from trace frame or task)

  // --- Verified Repository Reality ---
  repositoryState: {
    modifiedFiles: string[];      // PROVENANCE: DETERMINISTIC_REALITY (git status)
    uncommittedDiff: string;      // PROVENANCE: DETERMINISTIC_REALITY (git diff, capped length)
  };

  // --- Verification Grounding ---
  currentVerification: {
    command: string;              // PROVENANCE: DETERMINISTIC_REALITY
    exitCode: number;             // PROVENANCE: DETERMINISTIC_REALITY
    stdoutSnippet: string;        // PROVENANCE: DETERMINISTIC_REALITY (traceback head/tail)
  };

  // --- Spatial Failure Coordinates ---
  failureCoordinates: TraceFrame[]; // PROVENANCE: DERIVED_DETERMINISTIC_STATE (from trace-slice.ts)

  // --- Active Working Interface (Bounded Viewport) ---
  boundedViewport: {
    file: string;                 // PROVENANCE: DERIVED_DETERMINISTIC_STATE
    startLine: number;            // PROVENANCE: DERIVED_DETERMINISTIC_STATE
    endLine: number;              // PROVENANCE: DERIVED_DETERMINISTIC_STATE
    centerLine: number;           // PROVENANCE: DERIVED_DETERMINISTIC_STATE
    viewportText: string;         // PROVENANCE: DERIVED_DETERMINISTIC_STATE (rendered by viewport.ts)
  };

  // --- Factual Mutation History (Execution Receipts Only) ---
  priorFailedMutations: FailedMutationReceipt[]; // PROVENANCE: INTELLIGENCE_CLAIM + DETERMINISTIC_REALITY

  // --- Unresolved Status Statement ---
  unresolvedVerificationStatus: string; // PROVENANCE: DERIVED_DETERMINISTIC_STATE (factual status string)
}
```

### Epistemic Prohibitions for the Handoff Compiler
1. **NO Semantic Inference of "Falsified Approaches":**  
   WTF does not speculate on *why* an agent author attempted a patch or what cognitive theory was disproven. It records strictly: *"On turn T, snippet X was applied to file Y; verification command exited with code Z and emitted error delta W."*
2. **NO Semantic Inference of "Unresolved Residual":**  
   WTF does not diagnose semantic missing logic (e.g. *"Needs Rust borrow lifetime annotation"*). It records strictly: *"Verification command `cargo test` exited with code 101 on `src/lib.rs:846`."*
3. **ZERO Chain-of-Thought or Scratchpads:**  
   The packet strictly excludes internal reasoning tokens, conversational turn banter, and model self-reflections. Phase 10.0 established that state continuation is 100% independent of chain-of-thought preservation.
4. **ZERO WTF-Generated Fixes:**  
   WTF never generates candidate solutions, patch suggestions, or hints. It projects raw disk bytes at the coordinate. *Projection is not selection.*

---

## 5. Composed Runtime Architecture

The complete end-to-end execution loop articulates the strict boundary between WTF's deterministic substrate and the external policy layer:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       WTF v0.3 COMPOSED RUNTIME FLOW                        │
└─────────────────────────────────────────────────────────────────────────────┘

  [1. PHYSICAL REALITY] (Repository files, tests, compilers, Git)
           │
           ▼
  [2. v0.2 INVARIANT SUBSTRATE]
  ├── TraceSlice (`trace-slice.ts`): Parses compiler error output
  ├── Viewport (`viewport.ts`): Slices bounded code windows
  ├── ActionNormalizer (`action-normalizer.ts`): Unifies tool verbs
  └── ActionCompiler (`action-compiler.ts`): Enacts patches with literal byte semantics
           │
           ▼
  [3. EXTERNAL INTELLIGENCE] (Agent / Model / Human)
  └── Authors candidate action intent
           │
           ▼
  [4. ACTION & VERIFICATION EXECUTION]
  ├── Action enacted against disk bytes via ActionCompiler
  └── Subprocess test verification executed
           │
           ▼
  [5. TRAJECTORY LEDGER] (`src/core/trajectory-ledger.ts`)
  └── Appends immutable turn record with strict provenance tags
           │
           ▼
  [6. TRAJECTORY STAGNATION DETECTOR] (`src/core/stagnation-detector.ts`)
  └── Evaluates Phase 8.3B rules → Emits `TrajectoryStagnationSignal`
           │
           ▼
  ═════════════════════════════════════════════════════════════════════════
  [7. THE EXTERNAL POLICY BOUNDARY] (OUTSIDE WTF)
  The External Controller (Human Developer, CI/CD, or Agent Harness) reads
  the signal and makes the policy choice:
    • Option A: CONTINUE (Permit current intelligence to take next turn)
    • Option B: RE-PROMPT (Inject warning or advice into current agent)
    • Option C: YIELD TO HUMAN (Alert human engineer to take over)
    • Option D: HANDOFF (Trigger state transfer to alternative intelligence)
  ═════════════════════════════════════════════════════════════════════════
           │ (If Option D or Option C is chosen)
           ▼
  [8. HANDOFF COMPILER] (`src/core/handoff-compiler.ts`)
  └── Assembles established reality from Ledger + Viewport + Git Diff
           │
           ▼
  [9. CONTINUATION PACKET] (`HandoffPacket`)
  └── Exposed to replacement intelligence or human engineer
```

---

## 6. The Multi-Coordinate Question

### Analysis of the Phase 10.0 Forensic Finding
In Phase 10.0, forensic audit of challenge `CH-08` (`task-11-rust-anyhow-ensure-neg`) revealed that single-coordinate bounded viewports struggle when code definitions are non-local:
- In `CH-08`, the test failure stack trace pointed to line 42 of `src/ensure.rs` (the invocation of the macro).
- However, the underlying macro definition and syntax fix required editing `src/macros.rs` (a distant file).
- The single-coordinate viewport centered on `src/ensure.rs`, forcing the replacement model to emit exploratory `read_file` commands to locate `src/macros.rs`.

### Architectural Determination: Option A (Safe Single-Coordinate Baseline)
> **v0.3 can and should safely ship using existing single/bounded coordinates.**

#### Architectural Rationale
1. **Empirical Dominance of Single-Coordinate Local Repairs:** Across the 18 challenges evaluated in Phases 8.4A, 8.4B, and 8.5, **83.3% of tasks (15 of 18)** were resolved with local single-file coordinates. In all 6 causal Fail $\to$ Pass rescues, single-coordinate bounded viewports were 100% sufficient to unlock immediate Turn 1 repair continuation.
2. **Constitutional Safety of Frozen v0.2 Substrate:** Single-coordinate viewport slicing is already frozen, tested, and verified in `src/core/viewport.ts` and `src/core/trace-slice.ts`. Relying on it introduces zero speculative heuristic ranking.
3. **Multi-Coordinate Synthesis as Post-v0.3 Research:** Deterministically ranking and assembling multiple disjoint code windows (e.g. Call Site Viewport + Declaration Site Viewport) without token explosion requires empirical multi-coordinate heuristics. This is formally classified as a **post-v0.3 research question (Phase 11 / v0.4)**.

---

## 7. Causal Reproduction Plan

To guarantee that the production TypeScript implementation of v0.3 preserves historical experimental behavior before release, a frozen 4-gate reproduction suite is pre-registered below:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    v0.3 CAUSAL REPRODUCTION SUITE PLAN                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Gate 1: Phase 8.3B Stagnation Detection Replay                              │
│ • Corpus: 8 frozen historical trajectories (34 turns) from Phase 8.3B       │
│ • Required: 7/8 stagnation signals (87.5% recall), 0 false alarms (100%     │
│   specificity), 0 premature stops. Strict matching of trigger rules.        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Gate 2: Phase 8.4A Handoff Viewport Extraction Replay                       │
│ • Corpus: CH-01 (Rust Walkdir) and CH-03 (Node isNumeric) failure states    │
│ • Required: Viewport extraction matches target declaration coordinates;     │
│   100% character agreement with Phase 8.4A handoff viewports; 0 CoT leakage.│
├─────────────────────────────────────────────────────────────────────────────┤
│ Gate 3: Phase 8.4B Local Handoff Packet Assembly Replay                     │
│ • Corpus: 5 switched challenges from Phase 8.4B replication cohort          │
│ • Required: Exact assembly of git diff, failure coordinates, and prior      │
│   failed mutation receipts across Rust, Node, Go, Python tasks.             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Gate 4: Phase 8.5 Cross-Substrate Invariance Replay                         │
│ • Corpus: CH-01 (Local 3B -> Remote Llama 8B) handoff state                 │
│ • Required: Generated HandoffPacket is identical regardless of downstream   │
│   consumer. Zero model-specific adaptations injected into packet bytes.     │
└─────────────────────────────────────────────────────────────────────────────┘
```

*(Note: These gates are architectural specifications only. No test runs or experiments are executed during Phase 10.1).*

---

## 8. Strict Negative Exclusions

To protect WTF's constitutional integrity, the following components are **permanently excluded** from v0.3:

1. **NO Model Execution or API Clients:** WTF does not call Ollama, OpenAI, Anthropic, OpenRouter, or local LLMs.
2. **NO Autonomous Schedulers or Switching Engines:** WTF does not decide when to switch models or manage process loops.
3. **NO Routing or Compatibility Selectors:** WTF does not evaluate model capability profiles or match tasks to models.
4. **NO Model Profile Registries:** No JSON catalogs or dictionaries of model parameter counts or strengths.
5. **NO Capability Handshake Probes:** No eye charts or calibration probes in production runtime.
6. **NO Discrete Decision Layers (JUG/Jev):** Excluded per Phase 8.J1 and 8.6 findings (0% lift in local repair).
7. **NO Speculative Root-Cause Analysis:** WTF reports observable traceback frames; it does not claim to know the semantic cause of an error.
8. **NO Solution Generation:** WTF never suggests a fix or edits code autonomously.

---

## 9. Deliverables & Production Module Inventory for Implementation

When implementation is authorized, the following three production modules will be added to `src/core/`:

1. `src/core/trajectory-ledger.ts` (~250 LOC TypeScript):
   - Implements `TrajectoryLedger` class.
   - Enforces append-only storage and epistemic provenance tags.
   - Computes cumulative arithmetic counters across turns.
2. `src/core/stagnation-detector.ts` (~200 LOC TypeScript):
   - Implements `evaluateTrajectoryHealth()` function.
   - Encodes frozen Phase 8.3B decision rules and thresholds.
   - Emits pure `TrajectoryStagnationSignal` with zero autonomous policy actions.
3. `src/core/handoff-compiler.ts` (~220 LOC TypeScript):
   - Implements `compileHandoffPacket()` function.
   - Composes v0.2 `TraceSlice` and `BoundedViewport` with git diff and ledger receipts.
   - Emits canonical `HandoffPacket` with zero chain-of-thought leakage.

---

## 10. Final Architectural Affirmation

> **Agents act. WTF proves. Humans decide.**  
> **Observe trajectory. Preserve reality. Signal stagnation. Decide nothing.**
