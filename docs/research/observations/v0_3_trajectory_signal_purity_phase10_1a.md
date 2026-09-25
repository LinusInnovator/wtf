# WTF Phase 10.1A — Trajectory Signal Purity Audit

**Status:** COMPLETE AUDIT & HARDENING (ZERO IMPLEMENTATION — ZERO EXPERIMENTS — ZERO REDESIGN)  
**Date:** September 2026  
**Target Release:** WTF `v0.3.0`  
**Governing Rule:**  
> *Observe facts. Threshold facts. Signal patterns. Never claim to know what the intelligence is thinking.*

---

## 1. Executive Summary & Purpose

Phase 10.1 specified the three production components of WTF v0.3 (`TrajectoryLedger`, `TrajectoryStagnationDetector`, `HandoffCompiler`).  
Phase 10.1A hardens that specification by performing an exhaustive **epistemic purity audit** on every input, derived counter, equality comparison, and emitted label.

The purpose of this audit is to eliminate any vestige of cognitive speculation, anthropomorphic projection, or policy leakage before any TypeScript implementation begins.

### Key Audit Outcomes
1. **Cognitive Inferences Eliminated:** Phrases such as "without new hypothesis", "unable to synthesize valid syntax", "semantic surrender", "premature finish", and "falsified approach" have been completely eradicated from runtime descriptions and diagnostic strings.
2. **Ambiguous Comparisons Formally Defined:** Exact deterministic functions are specified for `recentErrorsIdentical`, `patchRepeated`, `isCoordinateGrounded`, and `isUnresolvedFailing`.
3. **Four-Tier Epistemic Separation Enforced:** Every rule in `TrajectoryStagnationDetector` is decomposed strictly into:
   - **OBSERVATION:** Factual physical state directly measured.
   - **THRESHOLD:** Frozen numerical parameter.
   - **SIGNAL:** Heuristic pattern classification emitted to external consumers.
   - **POLICY:** Forbidden inside WTF (0 autonomous decisions).
4. **HandoffCompiler Purified:** All references to "Falsified Approaches" and "Unresolved Residuals" are replaced with strictly factual execution records (`priorFailedMutations` and `unresolvedVerificationStatus`). Zero chain-of-thought or reasoning artifacts are permitted.

---

## 2. The Four-Tier Epistemic Separation

WTF v0.3 enforces a strict structural distinction between facts, parameters, signals, and policies:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE FOUR-TIER EPISTEMIC SEPARATION                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. OBSERVATION (Physical Reality / Derived Deterministic)                   │
│    • Direct measurements from OS, subprocesses, filesystem, and Git         │
│    • E.g.: `exitCode !== 0`, `rejectionCount === 4`, `action === 'READ'`   │
│    • Epistemic Status: FACT                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. THRESHOLD (Frozen Numeric Heuristic)                                     │
│    • Empirically established integer cutoffs from Phase 8.3B research       │
│    • E.g.: `IDLE_LIMIT = 3`, `REJECTION_LIMIT = 4`, `GRACE_WINDOW = 2`      │
│    • Epistemic Status: CONFIGURED PARAMETER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. SIGNAL (Heuristic Pattern Classification)                                │
│    • The output emitted by WTF when Observation meets Threshold             │
│    • E.g.: `TRAJECTORY_STAGNATION`, `TRAJECTORY_INTERFACE_FRICTION`         │
│    • Epistemic Status: INFORMATIVE SIGNAL (Never a claim of model competence)│
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. POLICY (Control Actions — FORBIDDEN INSIDE WTF)                          │
│    • Deciding to halt, retry, switch models, re-prompt, or route            │
│    • Epistemic Status: EXTERNAL POLICY DECISION (Reserved for human/harness) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Forensic Audit of Problematic Terminology

Every term flagged in the audit prompt is examined, purified, and grounded below:

### 3.1 "without new hypothesis"
- **Historical Usage (Phase 8.3B):** *"Model applied mutation that failed verification, then stalled for >= 3 turns without synthesizing a revised fix; semantic stagnation."*
- **The Defect:** "Hypothesis" and "synthesizing a fix" are unobservable mental states. WTF cannot know if the model is thinking of a hypothesis, daydreaming, or deadlocked.
- **Purification:**
  - **OBSERVATION:** Following an enacted mutation that resulted in a non-zero verification exit code, the agent emitted consecutive actions where `canonicalAction in ('READ', 'SHELL')`.
  - **THRESHOLD:** Consecutive non-mutating turns $\ge 3$.
  - **SIGNAL:** `TRAJECTORY_STAGNATION (trigger: 'post_mutation_non_mutating_turn_limit_reached')`.
  - **Emitted Evidence Summary:** `"3 consecutive non-mutating actions (READ/SHELL) observed following an unresolved mutation."`

### 3.2 "persistent patch application failure"
- **Historical Usage (Phase 8.3B):** *"Model unable to synthesize valid patch syntax across >= 4 consecutive attempts; syntax/anchor synthesis boundary reached."*
- **The Defect:** "Unable to synthesize valid syntax" claims insight into the model's internal capability ceiling.
- **Purification:**
  - **OBSERVATION:** The action compiler rejected candidate mutations across consecutive turns with `{ ok: false }`.
  - **THRESHOLD:** Consecutive action compiler rejections $\ge 4$.
  - **SIGNAL:** `TRAJECTORY_STAGNATION (trigger: 'consecutive_action_compiler_rejections_exceeded')`.
  - **Emitted Evidence Summary:** `"4 consecutive candidate mutations rejected by ActionCompiler (anchor mismatches or invalid replacement spans)."`

### 3.3 "premature FINISH" / "semantic surrender"
- **Historical Usage (Phase 8.3B):** *"Model terminated with unsolved verification failure after grounding target coordinates; semantic boundary reached."*
- **The Defect:** "Premature" and "surrender" imply normative judgments about when an agent "ought" to finish.
- **Purification:**
  - **OBSERVATION:** The agent emitted `canonicalAction === 'FINISH'` while the latest `verificationPassed === false` and the declared target file matches a failure frame in the traceback.
  - **THRESHOLD:** `isFinishRequested === true` AND `verificationPassed === false` AND `isCoordinateGrounded === true`.
  - **SIGNAL:** `TRAJECTORY_STAGNATION (trigger: 'finish_emitted_with_unresolved_verification')`.
  - **Emitted Evidence Summary:** `"Agent emitted FINISH action while verification command is failing on grounded workspace coordinate."`

### 3.4 "navigation wander"
- **Historical Usage (Phase 8.3B):** *"Model trapped in navigation friction without grounding/modifying code."*
- **The Defect:** "Wander" and "trapped" anthropomorphize unguided search.
- **Purification:**
  - **OBSERVATION:** The agent emitted consecutive actions where `canonicalAction in ('READ', 'SHELL')` with zero attempted mutations and no file matching the error traceback.
  - **THRESHOLD:** Consecutive non-mutating turns $\ge 3$ AND `isCoordinateGrounded === false` AND `appliedMutationsCount === 0`.
  - **SIGNAL:** `TRAJECTORY_INTERFACE_FRICTION (trigger: 'consecutive_ungrounded_reads_exceeded')`.
  - **Emitted Evidence Summary:** `"3 consecutive read/shell actions observed without target coordinate grounding or code mutations."`

### 3.5 "unresolved failure"
- **Historical Usage (Phase 8.4):** *"Unresolved residual failure."*
- **The Defect:** "Residual" implies cognitive work remaining.
- **Purification:**
  - **OBSERVATION:** The subprocess verification command exited with code $\ne 0$.
  - **THRESHOLD:** `exitCode !== 0`.
  - **SIGNAL:** Factual state: `VERIFICATION_FAILING (exit_code: X)`.
  - **Emitted Evidence Summary:** `"Verification command exited with non-zero status code."`

---

## 4. Formal Deterministic Comparison Functions

To eliminate ambiguity, all equality checks used by `TrajectoryStagnationDetector` must be governed by strict deterministic algorithms:

### 4.1 Exact Error Output Matching (`recentErrorsIdentical`)
To verify whether two verification runs produced identical diagnostic output without being confused by dynamic timing strings (e.g. `Ran 5 tests in 0.12s`):

```typescript
/**
 * Deterministically compares two verification output snippets for structural equality.
 * Strips ANSI escape sequences, whitespace trailing noise, and execution timing lines.
 */
export function areVerificationOutputsIdentical(outputA: string, outputB: string): boolean {
  if (outputA === outputB) return true;

  const normalize = (text: string): string => {
    return text
      // 1. Strip ANSI escape codes
      .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
      // 2. Strip common execution timing noise (e.g. "in 0.412s", "Time: 123ms")
      .replace(/\b(?:in\s+\d+(?:\.\d+)?(?:ms|s)|Time:\s*\d+(?:\.\d+)?(?:ms|s))\b/gi, '')
      // 3. Normalize all line endings to \n
      .replace(/\r\n/g, '\n')
      // 4. Trim individual lines
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  return normalize(outputA) === normalize(outputB);
}
```

### 4.2 Exact Patch Duplication (`patchRepeated`)
To determine whether an agent has emitted a byte-for-byte duplicate mutation attempt:

```typescript
export interface MutationAttemptRecord {
  targetFile: string;
  oldText?: string;
  newText?: string;
  replacementContent?: string;
}

/**
 * Deterministically compares two candidate mutations for duplicate content.
 * Evaluates target path and replacement strings byte-for-byte.
 */
export function areMutationsIdentical(
  a: MutationAttemptRecord,
  b: MutationAttemptRecord
): boolean {
  // Normalize target file path relative to workspace
  const pathA = a.targetFile.trim().replace(/\\/g, '/');
  const pathB = b.targetFile.trim().replace(/\\/g, '/');
  if (pathA !== pathB) return false;

  // Compare replacement payloads
  const contentA = (a.newText ?? a.replacementContent ?? '').trim();
  const contentB = (b.newText ?? b.replacementContent ?? '').trim();

  // If old_text anchor is present, it must also match
  const anchorA = (a.oldText ?? '').trim();
  const anchorB = (b.oldText ?? '').trim();

  return contentA === contentB && anchorA === anchorB;
}
```

### 4.3 Coordinate Grounding (`isCoordinateGrounded`)
To determine whether an agent's actions intersect verified failure locations on disk:

```typescript
import * as path from 'node:path';
import { TraceFrame } from './trace-slice.js';

/**
 * Deterministically checks if a declared target file matches any workspace
 * source coordinate extracted by TraceSlice from verification output.
 */
export function isCoordinateGrounded(
  declaredFile: string | undefined,
  traceFrames: TraceFrame[]
): boolean {
  if (!declaredFile || traceFrames.length === 0) return false;

  const normDeclared = path.normalize(declaredFile.trim()).replace(/\\/g, '/');

  return traceFrames.some(frame => {
    const normFrameFile = path.normalize(frame.file.trim()).replace(/\\/g, '/');
    return normDeclared === normFrameFile || normDeclared.endsWith('/' + normFrameFile);
  });
}
```

### 4.4 Unresolved Verification Failure (`isUnresolvedFailing`)
To evaluate verification status with zero ambiguity:

```typescript
export interface VerificationReceipt {
  executed: boolean;
  exitCode?: number;
}

/**
 * Evaluates whether verification has been executed and remains failing.
 */
export function isUnresolvedFailing(receipt: VerificationReceipt): boolean {
  return receipt.executed === true && receipt.exitCode !== 0;
}
```

---

## 5. Complete Rule-by-Rule Audit Matrix of the Stagnation Detector

Every rule in `evaluateTrajectoryHealth()` is audited against the Four-Tier standard:

| Rule | OBSERVATION (Fact) | THRESHOLD (Param) | SIGNAL (Heuristic Output) | POLICY (Action Forbidden in WTF) |
| :--- | :--- | :--- | :--- | :--- |
| **Rule 1: Terminal Pass** | `latestTurn.verificationPassed === true` | Strict Boolean `true` | `TRAJECTORY_PASS` (Confidence: HIGH) | None. (Harness decides to complete task). |
| **Rule 2: Early Turns Grace** | `currentTurn <= 2 && !isFinishRequested` | `EARLY_TURNS_GRACE_WINDOW = 2` | `TRAJECTORY_CONTINUE` (Confidence: MODERATE) | None. (Agent continues normal turn loop). |
| **Rule 3A: Finish in Nav Loop** | `isFinishRequested === true && consecutiveNavTurns >= 3 && appliedMutations === 0` | `NAVIGATION_LOOP_THRESHOLD = 3` | `TRAJECTORY_INTERFACE_FRICTION` | None. (Harness may alert or re-prompt). |
| **Rule 3B: Finish after Action Fail** | `isFinishRequested === true && consecutiveActionFails >= 2` | `ACTION_FAIL_THRESHOLD = 2` | `TRAJECTORY_ACTION_FRICTION` | None. (Harness may inspect syntax error). |
| **Rule 3C: Finish on Grounded Error** | `isFinishRequested === true && verificationPassed !== true && isCoordinateGrounded === true` | `exitCode !== 0 && grounded === true` | `TRAJECTORY_STAGNATION` | None. (Harness may offer handoff or exit). |
| **Rule 4: Persistent Action Rejections**| `actionStatus in ('failed', 'rejected') && consecutiveActionFailures >= 4` | `PERSISTENT_ACTION_FAILURE_THRESHOLD = 4` | `TRAJECTORY_STAGNATION` | None. (Harness decides whether to halt). |
| **Rule 4B: Transitory Action Friction** | `actionStatus in ('failed', 'rejected') && consecutiveActionFailures < 4` | `< 4 attempts` | `TRAJECTORY_ACTION_FRICTION` | None. (Agent permitted to retry edit). |
| **Rule 5A: Post-Mutation Idle Stalling**| `consecutivePostMutationIdleTurns >= 3 && appliedMutations >= 1` | `POST_MUTATION_IDLE_THRESHOLD = 3` | `TRAJECTORY_STAGNATION` | None. (Harness decides whether to handoff). |
| **Rule 5B: Error / Patch Oscillation** | `appliedMutations >= 2 && (recentErrorsIdentical \|\| patchRepeated)` | `MUTATION_OSCILLATION_THRESHOLD = 2` | `TRAJECTORY_STAGNATION` | None. (Harness decides whether to handoff). |
| **Rule 5C: Mutation Ceiling Exhaustion** | `appliedMutations >= 3 && verificationPassed !== true` | `MUTATION_CEILING_WITHOUT_PASS = 3` | `TRAJECTORY_STAGNATION` | None. (Harness decides whether to handoff). |
| **Rule 5D: Active Mutation Convergence**| `appliedMutations >= 1 && consecutiveIdleTurns < 3` | `< 3 idle turns` | `TRAJECTORY_CONTINUE` | None. (Agent observes compiler delta). |
| **Rule 6: Ungrounded Navigation Loop** | `consecutiveNavTurns >= 3 && appliedMutations === 0 && !isCoordinateGrounded` | `NAVIGATION_LOOP_THRESHOLD = 3` | `TRAJECTORY_INTERFACE_FRICTION` | None. (Harness may inject coordinates). |
| **Rule 7: Default Observation Fallback**| Trajectory signals active without threshold violations | No threshold fired | `TRAJECTORY_CONTINUE` | None. (Normal turn progression). |

---

## 6. HandoffCompiler Semantic Leakage Audit

The `HandoffCompiler` is inspected for semantic leakage and cognitive projection:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HANDOFF COMPILER SEMANTIC LEAKAGE AUDIT                  │
├──────────────────────────────┬──────────────────────────────┬───────────────┤
│ Historical / Research Field  │ Purified v0.3 Production     │ Epistemic     │
│ (Potential Leakage)          │ Representation               │ Status        │
├──────────────────────────────┼──────────────────────────────┼───────────────┤
│ "FALSIFIED APPROACHES"       │ `priorFailedMutations`       │ FACTUAL       │
│ Implies WTF knows the model's│ Factual execution receipts of│ EXECUTION     │
│ cognitive hypothesis.        │ applied patches that exited  │ RECEIPT       │
│                              │ with non-zero test codes.    │               │
├──────────────────────────────┼──────────────────────────────┼───────────────┤
│ "UNRESOLVED RESIDUAL"        │ `unresolvedVerificationStatus`│ FACTUAL      │
│ Implies WTF diagnoses what   │ Factual statement of current │ EXECUTION     │
│ semantic skill is missing.   │ test command, exit code, and │ STATUS        │
│                              │ error trace snippet.         │               │
├──────────────────────────────┼──────────────────────────────┼───────────────┤
│ "TASK INTENT"                │ `taskIntent`                 │ UNVERIFIED    │
│ Could be mistaken for        │ Explicitly tagged as         │ INTELLIGENCE  │
│ verified specification.      │ `INTELLIGENCE_SUPPLIED_CLAIM`│ CLAIM         │
├──────────────────────────────┼──────────────────────────────┼───────────────┤
│ "BOUNDED CODE VIEWPORT"      │ `boundedViewport`            │ DERIVED       │
│ Could be mistaken for a fix  │ Strictly raw disk bytes with │ DETERMINISTIC │
│ or suggested edit span.      │ line numbers. Zero edits.    │ PROJECTION    │
├──────────────────────────────┼──────────────────────────────┼───────────────┤
│ "CHAIN-OF-THOUGHT / SCRATCH" │ COMPLETELY EXCLUDED (0 bytes)│ STRICTLY      │
│ Risk of hallucination leak.  │ Zero reasoning tokens passed.│ ENFORCED      │
└──────────────────────────────┴──────────────────────────────┴───────────────┘
```

### Audit Findings for HandoffCompiler
1. **Semantic Leakage: ZERO.**
2. **Chain-of-Thought Transferred: EXACTLY 0 BYTES.**
3. **Inferred Solutions Injected: EXACTLY 0.**
4. **Conclusion:** `HandoffCompiler` is 100% compliant with WTF constitutional purity.

---

## 7. Hardening Adjustments to Phase 10.1 Specification

Based on this audit, three targeted terminology updates are applied to the Phase 10.1 architecture specification (`docs/research/observations/v0_3_trajectory_runtime_architecture_phase10_1.md`):

1. **Rule 5 Description Hardened:**  
   - *Was:* `"Agent applied mutation that failed verification, then stalled for >= 3 turns without authoring a new patch"` (implies knowing authoring intent).  
   - *Now:* `"3 consecutive non-mutating actions (READ/SHELL) recorded after an unresolved mutation."`
2. **Rule 3 Description Hardened:**  
   - *Was:* `"Agent terminated with unresolved verification failure after grounding failure coordinates"` (implies intentional termination).  
   - *Now:* `"FINISH action emitted while verification command is failing on grounded workspace coordinate."`
3. **Comparison Signatures Formalized:**  
   - Reference the exact deterministic functions `areVerificationOutputsIdentical`, `areMutationsIdentical`, and `isCoordinateGrounded` directly in the specification.

---

## 8. Final Audit Sign-Off Block

```markdown
PHASE 10.1A: COMPLETE
RULES AUDITED: 7
SEMANTIC INFERENCES REMOVED: 5 ("without new hypothesis", "unable to synthesize syntax", "semantic surrender", "premature finish", "falsified approach")
AMBIGUOUS COMPARISONS FORMALIZED: 4 (areVerificationOutputsIdentical, areMutationsIdentical, isCoordinateGrounded, isUnresolvedFailing)
HEURISTIC SIGNALS: TRAJECTORY_STAGNATION, TRAJECTORY_CONTINUE, TRAJECTORY_PASS, TRAJECTORY_INTERFACE_FRICTION, TRAJECTORY_ACTION_FRICTION, TRAJECTORY_UNKNOWN
POLICY DECISIONS: 0 (Strictly externalized to human/harness)
HANDOFF SEMANTIC LEAKAGE: NO (0 bytes CoT, 0 solution hints, 100% factual receipts)
CONSTITUTIONAL BOUNDARY PRESERVED: YES
READY FOR IMPLEMENTATION: YES
IMPLEMENTATION: NO
NEW EXPERIMENTS: NO

RULE:

OBSERVE FACTS.
THRESHOLD FACTS.
SIGNAL PATTERNS.
NEVER CLAIM TO KNOW WHAT THE INTELLIGENCE IS THINKING.
```
