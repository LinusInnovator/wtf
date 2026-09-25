# WTF Research Report: v0.3 Trajectory State & Handoff Runtime Implementation (Phase 10.2)

**Status:** COMPLETE  
**Date:** September 2026  
**Author:** Linus & Antigravity  
**Baseline:** v0.2.0 Frozen (`ed1dbea`)  
**Hardened Specifications:**  
- [`docs/research/observations/v0_3_trajectory_runtime_architecture_phase10_1.md`](v0_3_trajectory_runtime_architecture_phase10_1.md)  
- [`docs/research/observations/v0_3_trajectory_signal_purity_phase10_1a.md`](v0_3_trajectory_signal_purity_phase10_1a.md)  
**Governing Rule:** *IMPLEMENT THE SENSOR AND THE MEMORY. DO NOT IMPLEMENT THE DRIVER.*

---

## 1. Executive Summary

Phase 10.2 transitions WTF from an ephemeral, single-turn invariant execution substrate (v0.2) into a trajectory-aware evidence engine (v0.3).

In strict adherence to the Phase 10.1 architecture and Phase 10.1A purity audit, Phase 10.2 implements the three core production modules without introducing any autonomous policy decisions, model execution, routing, switching, model profiles, or reasoning speculation:

1. **`src/core/trajectory-ledger.ts`**: An append-only, strictly immutable factual turn ledger with compile-time and runtime epistemic provenance classification (`DETERMINISTIC_REALITY`, `DERIVED_DETERMINISTIC_STATE`, `INTELLIGENCE_SUPPLIED_CLAIM`).
2. **`src/core/stagnation-detector.ts`**: A pure, passive sensor evaluating observable trajectory health against the frozen Phase 8.3B decision hierarchy and Phase 10.1A four formal deterministic comparison functions. It emits strictly informational pattern signals (`TRAJECTORY_PASS`, `TRAJECTORY_CONTINUE`, `TRAJECTORY_INTERFACE_FRICTION`, `TRAJECTORY_ACTION_FRICTION`, `TRAJECTORY_STAGNATION`, `TRAJECTORY_UNKNOWN`) and zero autonomous policy actions.
3. **`src/core/handoff-compiler.ts`**: A deterministic context-boundary compiler that projects current working code viewports (via v0.2 `BoundedViewport`), failure coordinates (via v0.2 `TraceSlice`), and uncommitted repository deltas into a bounded continuation packet (`HandoffPacket`), strictly stripping chain-of-thought, scratchpads, and model reasoning histories.

---

## 2. Component Implementation Details

### 2.1 TrajectoryLedger (`src/core/trajectory-ledger.ts`)

- **Append-Only Immutability:** All recorded turns are deeply or shallowly frozen using `Object.freeze()`. The internal `turns` array is private, and `getTurns()` returns a defensive shallow copy of immutable records.
- **Epistemic Provenance Integrity:** Every field on `TrajectoryTurnRecord` is mapped to an authoritative provenance category:
  - `DETERMINISTIC_REALITY`: `turnIndex`, `timestamp`, `sessionId`, `actionStatus`, `actionRejectionReason`, `enactedDiff`, `verificationExecuted`, `verificationCommand`, `verificationExitCode`, `verificationDurationMs`, `verificationPassed`, `verificationOutputSnippet`.
  - `DERIVED_DETERMINISTIC_STATE`: `canonicalAction`, `extractedCoordinates`, `errorDeltaFromPrevious`, `cumulativeNavigationTurns`, `cumulativeActionFailures`, `cumulativePostMutationIdleTurns`, `isCoordinateGrounded`, `hasEverGrounded`.
  - `INTELLIGENCE_SUPPLIED_CLAIM`: `rawActionName`, `rawActionArgs`, `declaredTargetFile`, `declaredIntent`, `isFinishRequested`.
  *Constitutional Invariant:* Intelligence claims are never promoted to factual reality without physical verification (e.g. `declaredTargetFile` is compared against physically extracted traceback frames before setting `isCoordinateGrounded`).
- **Cumulative State Arithmetic:** Cumulative counters (`cumulativeNavigationTurns`, `cumulativeActionFailures`, `cumulativePostMutationIdleTurns`) and error deltas (`identical`, `changed`, `resolved`, `first_observation`, `none`) are derived deterministically on turn append.
- **Serialization:** Full JSON serialization and deserialization routines (`serializeToJson()`, `deserializeFromJson()`) with schema versioning (`wtf/trajectory-ledger/0.3`).

### 2.2 TrajectoryStagnationDetector (`src/core/stagnation-detector.ts`)

- **Four Formal Comparison & Grounding Functions:**
  1. `areVerificationOutputsIdentical(outputA, outputB)`: Normalizes ANSI escape sequences, whitespace trailing noise, line-endings, and execution timing annotations (e.g. `Time: 120ms`, `Failed in 0.412s`, `[412ms]`).
  2. `areMutationsIdentical(a, b)`: Evaluates target path, anchor text, and replacement content byte-for-byte, requiring non-empty payload to establish identity.
  3. `isCoordinateGrounded(declaredFile, traceFrames)`: Checks path normalization and suffix containment against verified trace frames.
  4. `isUnresolvedFailing(receipt)`: Validates that execution occurred and exited with non-zero status.
- **Seven Hardened Rules (Phase 8.3B Hierarchy):**
  - **Rule 1 (Terminal Pass Override):** `verificationPassed === true` $\to$ `TRAJECTORY_PASS` (Confidence: HIGH).
  - **Rule 3 (Unresolved Finish Handling):** `isFinishRequested && !verificationPassed`:
    - 3A: Nav loop $\ge 3$ ungrounded turns without edits $\to$ `TRAJECTORY_INTERFACE_FRICTION`.
    - 3B: Action failure $\ge 2$ consecutive rejections $\to$ `TRAJECTORY_ACTION_FRICTION`.
    - 3C: Grounded error $\to$ `TRAJECTORY_STAGNATION`.
    - 3D: Ungrounded state $\to$ `TRAJECTORY_UNKNOWN`.
  - **Rule 4 (Mechanical Action Failure vs. Persistent Action Rejection):**
    - 4A: $\ge 4$ consecutive rejections $\to$ `TRAJECTORY_STAGNATION`.
    - 4B: $< 4$ consecutive rejections $\to$ `TRAJECTORY_ACTION_FRICTION`.
  - **Rule 5 (Post-Mutation Stagnation & Oscillation):**
    - 5A: Post-edit idle stall $\ge 3$ read/shell turns $\to$ `TRAJECTORY_STAGNATION`.
    - 5B: Error delta oscillation (2 identical errors) or repeated patch $\to$ `TRAJECTORY_STAGNATION`.
    - 5C: Mutation ceiling exhaustion ($\ge 3$ edits without pass) $\to$ `TRAJECTORY_STAGNATION`.
    - 5D: Active post-mutation evaluation ($< 3$ idle turns) $\to$ `TRAJECTORY_CONTINUE`.
  - **Rule 6 (Ungrounded Navigation Loop):** $\ge 3$ read/shell turns without grounding or edits $\to$ `TRAJECTORY_INTERFACE_FRICTION`.
  - **Rule 2 (Early Turns Grace Window):** Turns $\le 2$ without mutations $\to$ `TRAJECTORY_CONTINUE`.
  - **Rule 7 (Default Fallback):** Normal observation $\to$ `TRAJECTORY_CONTINUE`.
- **Zero Policy Invariant:** Emitted signals are purely informational telemetry. No autonomous abort, retry, model switch, prompt re-engineering, or scheduling logic exists inside WTF.

### 2.3 HandoffCompiler (`src/core/handoff-compiler.ts`)

- **Substrate Reuse:** Directly invokes v0.2 `extractTraceFrames()` and `renderBoundedViewport()`.
- **Packet Structure (`HandoffPacket`):**
  - `taskIntent`: Verbatim original user task prompt.
  - `targetFile`: Top failure coordinate from verified traceback.
  - `failureCoordinates`: Array of extracted `TraceFrame` objects.
  - `boundedViewport`: Windowed snippet of active source file centered at failure line with pointer indicator (`==>`).
  - `repositoryState`: Uncommitted git diff and modified file list.
  - `currentVerification`: Executed command, exit code, and stdout/stderr snippet.
  - `priorFailedMutations`: Purely factual ledger extract of attempted patch anchors, replacement summaries, enactment status, and resulting compiler errors.
  - `unresolvedVerificationStatus`: Deterministic summary sentence of active failure state.
- **Zero Cognitive Leakage:**
  - Zero chain-of-thought (`think`, `thought`, reasoning tokens).
  - Zero scratchpads or internal hypothesis narratives.
  - Zero candidate patches or speculative solutions.
  - Completely deterministic rendering via `formatHandoffMarkdown()`.

---

## 3. Test Coverage & Verification

### 3.1 New Test Suites Added
Three dedicated test suites were implemented:
1. `test/trajectory-ledger.test.ts` (6 tests):
   - Append-only immutability and record freezing.
   - Exact provenance categorization across all record fields.
   - Promotion resistance: intelligence claims never override reality without verification.
   - Cumulative arithmetic tracking (navigation turns, action failures, post-mutation idle turns).
   - Verification error delta calculation (`first_observation`, `identical`, `changed`, `resolved`).
   - JSON serialization and deserialization integrity.
2. `test/stagnation-detector.test.ts` (14 tests):
   - All 4 formal deterministic comparison functions.
   - All 7 hardened trajectory rules.
   - Boundary threshold tests ($\pm 1$ turn for navigation loops, post-mutation idle, action failures, and mutation ceiling).
   - Empty and missing evidence fail-closed behavior.
   - Complete absence of policy decisions.
3. `test/handoff-compiler.test.ts` (6 tests):
   - Complete handoff packet compilation from v0.2 primitives.
   - Strict factual logging of prior failed mutations.
   - Zero chain-of-thought, scratchpad, or model reasoning history inclusion.
   - Deterministic zero-ANSI markdown rendering matching Phase 8.4A reference.
   - Deterministic packet reproduction across identical inputs.
   - Safe fail-closed behavior on non-existent files or empty tracebacks.

### 3.2 Verification Results
- **Unit & Integration Tests:** 17/17 test files passed, 156/156 tests passed (130 existing v0.2 tests + 26 new v0.3 tests).
- **TypeScript Typecheck (`npm run typecheck`):** Clean (0 errors).
- **Production Build (`npm run build`):** Clean (`dist/cli.js` 121.3kb, `dist/evidence-compiler.js` 11.5kb).
- **Acceptance Gauntlet (`npm run gauntlet`):** 100/100 points across all 10 real-world scenarios.

---

## 4. Phase Verification Checklist

| Criterion | Target | Actual | Status |
| :--- | :--- | :--- | :--- |
| Baseline Preservation | v0.2.0 Frozen | Clean git diff on v0.2 core files | **PRESERVED** |
| Production Modules | 3 files | `trajectory-ledger.ts`, `stagnation-detector.ts`, `handoff-compiler.ts` | **IMPLEMENTED** |
| Formal Comparison Functions | 4 functions | `areVerificationOutputsIdentical`, `areMutationsIdentical`, `isCoordinateGrounded`, `isUnresolvedFailing` | **VERIFIED** |
| Hardened Trajectory Rules | 7 rules | Rules 1, 2, 3(A-D), 4(A-B), 5(A-D), 6, 7 | **VERIFIED** |
| Provenance Boundaries | 3 tiers | `DETERMINISTIC_REALITY`, `DERIVED_DETERMINISTIC_STATE`, `INTELLIGENCE_SUPPLIED_CLAIM` | **VERIFIED** |
| Policy Separation | Zero actions | Zero abort/retry/switch/route in WTF | **PRESERVED** |
| Cognitive Isolation | Zero CoT | Zero reasoning/scratchpad stored or transferred | **PRESERVED** |
| Total Tests Passing | $\ge 156$ | 156 / 156 (100%) | **PASS** |
| Gauntlet Score | 100 / 100 | 100 / 100 | **PASS** |
| TypeScript Check | 0 errors | 0 errors | **PASS** |
| Distribution Build | 0 errors | 0 errors | **PASS** |
| Causal Reproduction | Not run | Reserved for Phase 10.3 | **DEFERRED** |
