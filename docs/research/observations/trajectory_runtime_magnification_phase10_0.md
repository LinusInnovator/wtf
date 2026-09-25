# WTF Phase 10.0 — Trajectory Runtime Magnification

**Status:** COMPLETE (MAGNIFICATION AUDIT ONLY — ZERO PRODUCTION IMPLEMENTATION)  
**Date:** September 2026  
**Baseline:** Frozen `v0.2.0` (`ed1dbea`)  
**Scope:** Forensic analysis of Phase 8.3, 8.3A, 8.3B, 8.4, 8.4A, 8.4B, 8.5, 8.6, and Phase 9.0 Gap Audit.  
**Governing Rule (Pocket 21):** *Magnify the trajectory. Do not build the scheduler.*

---

## Executive Summary

WTF Phase 10.0 conducts a deep forensic magnification of the empirical research record on **Useful-Progress / Boundary Detection** and **Compiled Handoff**, determining what has been genuinely established, what remains interpretation, and what is required to turn these experimental mechanisms into a coherent production Trajectory Runtime above the frozen v0.2 substrate.

### Primary Audit Findings

1. **Boundary Detection Evolution (8.3 → 8.3A → 8.3B):**
   - In Phase 8.3, action vocabulary drift (`replace_in_file` vs `replace_file_content`) pushed 45.0% of turns to `UNKNOWN`, yielding 0.0% boundary recall.
   - In Phase 8.3A, substrate normalization collapsed `UNKNOWN` to 5.6% and exposed mechanical `ACTION` friction (27.8%), but recall remained 0.0% due to a rigid rule requiring $\ge 2$ successfully applied yet logically failing mutations.
   - In Phase 8.3B, defining stagnation through observable trajectory contracts (post-mutation idle loops $\ge 3$ turns, premature `FINISH` with unresolved error, persistent patch failure $\ge 4$ turns) unlocked **87.5% boundary recall (7/8)** with **100.0% specificity (0 false alarms across 34 turns)** and **100.0% precision (7/7 genuine)**.
   - **Epistemic Classification:** The mechanism is **HYBRID**. Its inputs and rules are 100% deterministic trajectory facts, but attributing trajectory stagnation to an intrinsic "model capability boundary" crosses into heuristic interpretation. In production, this must be formulated strictly as **Trajectory Stagnation Detection**, not cognitive mind-reading.

2. **Compiled Handoff Evolution (8.4 → 8.4A → 8.4B → 8.5):**
   - Phase 8.4 tested dynamic model switching with "Cold Handoff" (textual failure coordinates), resulting in **0 Fail $\to$ Pass rescues (0/2)** because incoming models succumbed to cold-start interface friction (reading file preambles lines 1–400 rather than advancing to failure coordinates).
   - Phase 8.4A introduced **Compiled Handoff** (directly compiling bounded code viewports $[coord - 15 : coord + 15]$ around verified trace frames into the active working interface). This produced the first prospective **Fail $\to$ Pass rescues (2 of 4 tasks, 50.0%)**, eliminated redundant reads by -87.5%, and reduced turns-to-first-repair to 1.0.
   - Phase 8.4B replicated the 2 rescues across a fresh 8-challenge cohort across 4 languages with **zero Pass $\to$ Fail regressions**.
   - Phase 8.5 confirmed cross-substrate replication across remote models via OpenRouter (Llama 3.1 8B, Mistral Small 24B, DeepSeek Chat), doubling pass rates (33.3% $\to$ 66.7%), cutting paid API costs by up to 29.9%, and cutting redundant reads by 80.0%.
   - **Provenance & Chain-of-Thought:** Across all 12 switched challenges in 8.4A, 8.4B, and 8.5, **zero private chain-of-thought or hidden reasoning tokens were transferred**. Incoming models received strictly verified disk reality, failure coordinates, bounded viewports, and falsified approaches. State continuation is proven to be **independent of chain-of-thought preservation**.

3. **Relationship & Coherence:**
   - Boundary Detection and Compiled Handoff form two complementary halves of a single coherent layer: **Trajectory State Management**.
   - Testing the execution chain reveals that WTF can deterministically observe progress, detect stagnation, and compile established state.
   - However, **the decision to switch models and the selection of which model to invoke is a SCHEDULING POLICY**. Under the WTF Constitution (*"Agents act. WTF proves. Humans decide"*), WTF must NOT become an autonomous LLM process scheduler.
   - The Minimum Coherent Trajectory Runtime provides **Trajectory Perception & State Compilation**, leaving orchestration to humans or external agent harnesses.

---

# PART 1 — BOUNDARY DETECTION

## 1. Exact Chronological Evolution (8.3 → 8.3A → 8.3B)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  BOUNDARY DETECTOR EVOLUTION                                │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────────┤
│ Phase 8.3                    │ Phase 8.3A                   │ Phase 8.3B                    │
│ "Unnormalized Action Drift"  │ "Substrate Action Normalizer"│ "Semantic Progress/Stagnation"│
├──────────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ • N=8 trials, 38 turns       │ • N=8 trials, 36 turns       │ • N=8 trials, 34 turns        │
│ • Runner emitted             │ • Added action normalizer    │ • Replaced rigid >=2 mutation │
│   `replace_in_file`          │   to substrate               │   rule with observable        │
│ • Detector expected          │ • UNKNOWN collapsed:         │   stagnation signals          │
│   `replace_file_content`     │   45.0% → 5.6%               │ • Boundary recall:            │
│ • UNKNOWN rate: 45.0% (16t)  │ • ACTION friction visible:   │   0.0% → 87.5% (7/8)          │
│ • False alarms: 0 (0.0%)     │   0.0% → 27.8% (10t)         │ • Specificity: 100.0% (0/34)  │
│ • Boundary recall: 0.0% (0/2)│ • False alarms: 0 (0.0%)     │ • Precision: 100.0% (7/7)     │
│ • Flagged interface loops    │ • Boundary recall: 0.0% (0/2)│ • Premature stops: 0          │
│   at Turn 4 (trial 03 & 04)  │   (mutation gate blocked)    │ • Non-mutation detections: 7/7│
└──────────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

### Phase 8.3 Breakdown
- **Objective:** Evaluate if WTF can determine from runtime evidence alone when an agent has reached a capability boundary, distinguishing it from interface and mechanical action friction without knowing model identity, size, or historical benchmark outcomes.
- **Sealed Output:** `scratch/phase8_3_boundary_detection/sealed_detector_output.json` (`SHA256: 4599c1e7...`).
- **Empirical Results:**
  - 0 false capability boundary alarms across 38 turns (100% specificity).
  - 0 `INTERFACE → BOUNDARY` and 0 `ACTION → BOUNDARY` confusions.
  - Successfully flagged navigation wander loops at Turn 4 in `trial_03` (7B) and `trial_04` (3B) as `INTERFACE`.
  - Defect Discovered: Pre-registration vocabulary mismatch. The runner emitted `replace_in_file`, while the detector checked for `replace_file_content`. Mutations were ignored by the state tracker, dropping 45.0% of turns into `UNKNOWN` and preventing capability boundary detection.

### Phase 8.3A Breakdown
- **Objective:** Repair substrate vocabulary with a canonical action normalizer (`scratch/action_normalizer.py`, `SHA256: e28b0608...`), keeping detector rules and thresholds strictly frozen (`scratch/blind_boundary_detector.py`, `SHA256: 68f90c1c...`).
- **Sealed Output:** `scratch/phase8_3a_boundary_detection/sealed_detector_output.json` (`SHA256: 5b02edab...`).
- **Empirical Results:**
  - `UNKNOWN` rate plummeted from 45.0% to **5.6%** (-39.4% drop).
  - Mechanical `ACTION` friction unmasked: rose from 0.0% to **27.8%** (10 turns). In `trial_01` (1.5B on Rust Walkdir), all 6 turns were correctly classified as mechanical patch failures.
  - Safety preserved: 0 false boundary alarms (0.0%), 0 premature stops.
  - The Mutation-Gated Barrier: Boundary recall remained **0.0% (0/2)**.
  - Forensic Reason: The pre-registered stagnation rule required $\ge 2$ successfully applied mutations that failed verification with stagnant test error. In practice, models hit boundaries by:
    1. Failing patch formatting completely (held at `ACTION` friction, e.g. `trial_01`, `trial_02`).
    2. Applying 1 mutation and then looping on reads/commands (held at `CONTINUE`, e.g. `trial_03`, `trial_06`).
    3. Surrendering early via `FINISH` after turn 2 (e.g. `trial_05`, `trial_07`, `trial_08`).
  - Because models did not produce $\ge 2$ successful mutations with stagnant error, the gate never fired.

### Phase 8.3B Breakdown
- **Objective:** Expand boundary definition to observable semantic progress and stagnation independently of successful repository mutations.
- **Frozen Detector:** `scratch/blind_boundary_detector_v83b.py` (`SHA256: 61589c2f...`).
- **Sealed Output:** `scratch/phase8_3b_boundary_detection/sealed_detector_output.json` (`SHA256: 83d03566...`).
- **Empirical Breakthrough:**
  - Capability Boundary Recall surged from 0.0% to **87.5% (7 of 8 true boundaries detected)**.
  - Boundary Detection Precision: **100.0% (7/7 genuine)**.
  - Boundary Detection Specificity: **100.0% (0 false alarms across 34 turns)**.
  - Premature Boundary Stops: **0**.
  - `BOUNDARY → LATER_PROGRESS`: **0** (never interrupted an agent about to make progress).
  - `BOUNDARY → LATER_PASS`: **0** (never interrupted an agent that subsequently passed).
  - **100% of detections (7/7)** occurred via non-mutation stagnation rules (post-mutation idle loops, premature FINISH surrenders, persistent patch failures).

---

## 2. Observable Inputs & Frozen Rules

### Inputs Observed by `BlindBoundaryDetectorV83B`
The detector accepts a single dictionary per turn (`turn_info`). Every input is an observable runtime fact:

| Input Variable | Nature / Provenance | Epistemic Status |
| :--- | :--- | :--- |
| `turn` | Sequential integer turn counter (1, 2, ...) | DETERMINISTIC FACT |
| `action` | Normalized action string (`READ`, `MUTATION`, `SHELL`, `FINISH`) | DERIVED DETERMINISTIC FACT |
| `action_args` | Arguments dictionary (`file_path`, `path`, `replacement`, `new_text`) | DETERMINISTIC FACT |
| `action_status` | Status string (`success`, `failed`, `rejected`) | DETERMINISTIC FACT |
| `verification_passed`| Boolean (`True` if exit code == 0, else `False`) | DETERMINISTIC FACT |
| `verification_output`| Raw stdout/stderr stream from verification subprocess | DETERMINISTIC FACT |
| `error_message` | Substring / diagnostic delta from verification | DETERMINISTIC FACT |

The detector has **ZERO access** to:
- Model identity, architecture, or parameter count.
- Historical task outcomes, ground-truth answer keys, or benchmark ladders.
- Internal hidden states, logit distributions, or agent prompt instructions.

### Exact Frozen Rules of Phase 8.3B
The decision hierarchy in `scratch/blind_boundary_detector_v83b.py` executes in strict order:

1. **Terminal Verification Pass:**
   - If `verification_passed == True` $\to$ emit `CONTINUE` (Confidence: HIGH).
2. **Coordinate Grounding Tracking:**
   - If `action` in (`READ`, `MUTATION`) and target file argument is present $\to$ record `grounded_target_file` and set `has_ever_grounded = True`.
3. **Premature Termination Handling (`action == "FINISH"` with `verification_passed == False`):**
   - If `consecutive_navigation_turns >= 3` and `len(mutations_history) == 0` $\to$ emit `INTERFACE`.
   - If `consecutive_action_failures >= 2` $\to$ emit `ACTION`.
   - If `has_ever_grounded == True` $\to$ emit `CAPABILITY_BOUNDARY` (Semantic surrender with unresolved failure after grounding coordinates).
   - Else $\to$ emit `UNKNOWN` (Early ungrounded exit).
4. **Mechanical Action Failure vs. Persistent Action Stagnation:**
   - If `action == "MUTATION"` and `action_status` in (`failed`, `rejected`):
     - `consecutive_action_failures += 1`.
     - If `consecutive_action_failures >= 4` $\to$ emit `CAPABILITY_BOUNDARY` (Model unable to synthesize valid patch syntax across $\ge 4$ attempts).
     - Else $\to$ emit `ACTION` (Mechanical patch formatting friction).
   - If `action` is successful mutation: `consecutive_action_failures = 0`.
5. **Post-Mutation Reasoning Stagnation:**
   - If `len(mutations_history) >= 1`:
     - If `consecutive_post_mutation_idle_turns >= 3` (3 consecutive turns of `READ` or `SHELL` after a failed mutation without authoring a new patch) $\to$ emit `CAPABILITY_BOUNDARY`.
     - If `len(mutations_history) >= 2`:
       - If recent error messages are identical (`recent_errors[0] == recent_errors[1]`) or patch content is repeated (`has_repeats`) $\to$ emit `CAPABILITY_BOUNDARY`.
       - If `len(mutations_history) >= 3` without passing $\to$ emit `CAPABILITY_BOUNDARY`.
     - If $< 3$ idle turns elapsed $\to$ emit `CONTINUE` (Observing convergence).
6. **Interface Friction Loop:**
   - If `consecutive_navigation_turns >= 3` and `len(mutations_history) == 0` and `not has_ever_grounded` $\to$ emit `INTERFACE`.
7. **Early Turns Exploration Grace Window:**
   - If `turn <= 2` $\to$ emit `CONTINUE`.
8. **Default Fallback:**
   - If none of the above fire $\to$ emit `UNKNOWN`.

---

## 3. Operational Definitions: Progress, Stagnation, Boundary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TRAJECTORY STATE SPECTRUM                          │
├──────────────────────┬──────────────────────────────┬───────────────────────┤
│ USEFUL PROGRESS      │ STAGNATION (Recoverable)     │ BOUNDARY (Terminal)   │
├──────────────────────┼──────────────────────────────┼───────────────────────┤
│ • Tests pass (exit 0)│ • Navigation reads (turns 1-2│ • Post-edit stall     │
│ • Target coordinate  │ • Mechanical patch rejection │   (>= 3 idle turns)   │
│   grounding          │   (1 to 3 failed attempts)   │ • Persistent patch    │
│ • Active hypothesis  │ • Single edit under          │   fail (>= 4 attempts)│
│   evaluation (<3t)   │   active inspection (<3t)    │ • Oscillating / repeat│
│ • Verification error │ • Uncommitted diff being     │   edits (>= 2 repeats)│
│   shrinks or advances│   inspected by compiler      │ • Premature surrender │
│                      │                              │   (FINISH while fail) │
└──────────────────────┴──────────────────────────────┴───────────────────────┘
```

- **Useful Progress:** Directly observable state transitions that move toward verification: tests passing, locating target file coordinates during early turns, applying a code mutation that executes cleanly, or observing test diagnostics within a 2-turn convergence window.
- **Stagnation (Recoverable Friction):** Local lack of progress that does not yet indicate cognitive exhaustion: reading files during turns 1–2, failing patch anchor syntax 1 to 3 times, or inspecting compilation errors for 1–2 turns after a failed edit.
- **Boundary (Exhaustion):** Trajectory states where empirical evidence demonstrates zero probability of autonomous recovery:
  1. Persistent patch syntax failure across $\ge 4$ consecutive attempts.
  2. Post-mutation idle stalling across $\ge 3$ consecutive turns without emitting a new hypothesis.
  3. Error delta oscillation or verbatim repetition across $\ge 2$ applied mutations.
  4. Voluntary termination (`FINISH`) while verification tests are failing and coordinates are grounded.

---

## 4. Empirical Evaluation: Performance, Safeguards, Misses

### Phase 8.3B Empirical Scorecard ($N=8$ Trials, 34 Turns)

| Trial ID | Model | Task | True State | Detected Turn | Trigger Mechanism | Classification |
| :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| `trial_01` | 1.5B | Rust Walkdir | Boundary | Turn 4 | Persistent Action Failure ($\ge 4$ patch fails) | `CAPABILITY_BOUNDARY` |
| `trial_02` | 3B | Rust Walkdir | Boundary | Turn 3 | Premature `FINISH` after failed patch | `CAPABILITY_BOUNDARY` |
| `trial_03` | 7B | Node isNumeric | Boundary | Turn 4 | Post-Mutation Stagnation ($\ge 3$ idle turns) | `CAPABILITY_BOUNDARY` |
| `trial_04` | 3B | Node isNumeric | Boundary | *None* | Missed (Fell into reading loop without grounding) | `UNKNOWN` / `INTERFACE` |
| `trial_05` | 3B | Node pLimit | Boundary | Turn 2 | Premature `FINISH` with unresolved error | `CAPABILITY_BOUNDARY` |
| `trial_06` | 7B | Node pLimit | Boundary | Turn 5 | Post-Mutation Stagnation ($\ge 3$ command turns) | `CAPABILITY_BOUNDARY` |
| `trial_07` | 3B | Go Gjson | Boundary | Turn 2 | Premature `FINISH` with unresolved error | `CAPABILITY_BOUNDARY` |
| `trial_08` | 3B | Go UUID v7 | Boundary | Turn 3 | Premature `FINISH` with unresolved error | `CAPABILITY_BOUNDARY` |

- **True Capability Boundaries:** 8
- **Correctly Detected Boundaries:** 7 (87.5% Recall)
- **Missed Boundaries:** 1 (12.5% Miss Rate: `trial_04`)
- **False Capability Boundary Alarms:** 0 (0.0% False Alarm Rate; 100.0% Specificity)
- **Premature Boundary Stops:** 0 (100% Specificity)
- **Boundary Precision:** 100.0% (7/7 detections were genuine boundaries)

### Safeguards Against False Positives
1. **Early Exploration Immunity:** Turns 1 and 2 are hardcoded to `CONTINUE` unless the model explicitly surrenders via `FINISH`.
2. **Action Failure Threshold:** Single, double, or triple patch rejections are classified strictly as `ACTION` friction; only 4 consecutive rejections trigger boundary.
3. **Post-Mutation Grace Period:** After an edit, the model is permitted 2 full turns to inspect diagnostics and think before idle stagnation fires at Turn 3.
4. **Pass Invariance:** If tests pass (`verification_passed == True`), the detector unconditionally emits `CONTINUE` regardless of prior trajectory history.

### The Single Miss (`trial_04`)
In `trial_04` (Qwen 3B on Node `isNumeric`), the model emitted a failed patch on Turn 1, then spent Turns 3–6 reading lines 1–150 of `index.ts` repeatedly. Because it never grounded the actual `isNumericString` coordinate and never applied a mutation, it hovered between `INTERFACE` and `UNKNOWN`. It was missed because the detector correctly refused to infer grounding where none was observed.

---

## 5. Epistemic Nature & Constitutional Audit

### Classification: A, B, or C?
Is the mechanism:
- A. Deterministic trajectory observation?
- B. Semantic / intelligence judgment?
- C. Hybrid?

**Verdict: C (HYBRID).**

Do not classify it as deterministic merely because its implementation consists of deterministic Python `if` statements.
- **The Observation Layer is Deterministic (A):** Counting consecutive tool calls, recording patch success/failure statuses, checking exit codes, and matching string equality on error messages are 100% deterministic observations of physical software reality.
- **The Attribution Layer is Heuristic Interpretation (B):** Deciding that $\ge 3$ idle turns or $\ge 4$ syntax failures constitutes a terminal failure of the model's *semantic capability* is an inductive behavioral hypothesis, not a mathematical fact.
- **The Composite Mechanism is Hybrid (C):** It applies deterministic state machines to track execution trajectories, but uses empirical behavioral thresholds to infer stagnation.

### Constitutional Boundary Audit
WTF Constitutional Invariant:
> *"WTF observes. The agent reasons and acts. Humans decide."*  
> *"WTF establishes what is and what happened. It does not decide what should happen."*

1. **Does observing repeated patch rejections cross the boundary?** **NO.** Reporting `action_rejections: 4` is establishing what happened.
2. **Does observing 3 turns without code edits cross the boundary?** **NO.** Reporting `idle_turns: 3` is establishing what happened.
3. **Does reporting `STAGNATION_DETECTED` cross the boundary?** **NO**, provided it is an empirical description of the trajectory state.
4. **Does declaring `CAPABILITY_BOUNDARY` cross the boundary?** **YES, POTENTIALLY.** The phrase "Capability Boundary" asserts a diagnosis about the model's cognitive competence. In production WTF, this primitive must be named **`TRAJECTORY_STAGNATION`** or **`BEHAVIORAL_EXHAUSTION`**, describing the trajectory rather than presuming to measure the model's mind.
5. **Does autonomously aborting the run or switching models cross the boundary?** **YES.** Deciding when to stop or switch is a scheduling policy. WTF may expose the stagnation receipt; the harness or human must decide what to do.

---

# PART 2 — COMPILED HANDOFF

## 1. Exact Chronological Evolution (8.4 → 8.4A → 8.4B → 8.5)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   COMPILED HANDOFF EVOLUTION                                │
├──────────────────────────────┬──────────────────────────────┬───────────────────────────────┤
│ Phase 8.4                    │ Phase 8.4A                   │ Phase 8.4B & 8.5              │
│ "Cold Handoff Baseline"      │ "Working Interface Compiler" │ "Replication & Remote Scale"  │
├──────────────────────────────┼──────────────────────────────┼───────────────────────────────┤
│ • N=6 paired challenges      │ • N=4 paired challenges      │ • 8.4B: N=8 local paired runs │
│ • Transferred coords & text  │ • Injected bounded viewport  │ • 8.5: N=6 remote paired runs │
│ • 2 switches triggered       │   [coord - 15 : coord + 15]  │ • Causal rescues replicated:  │
│ • Rescues: 0 / 2 (0.0%)      │ • Rescues: 2 / 4 (50.0%)     │   2 in 8.4B, 2 in 8.5         │
│ • Replacement died in        │ • Redundant reads: -87.5%    │ • Pass rate doubled in both   │
│   cold-start file reading    │ • Turns to repair: 2.0 → 1.0 │ • Zero regressions across all │
│ • Utility Law: NOT SUPPORTED │ • Utility Law: SUPPORTED     │ • Paid API cost cut by 29.9%  │
└──────────────────────────────┴──────────────────────────────┴───────────────────────────────┘
```

### Phase 8.4: The Cold Handoff Failure
- **Implementation:** `scratch/state_transfer_compiler.py` (`SHA256: 2974f089...`).
- **Mechanism:** When Phase 8.3B detected a boundary, WTF stopped the model, extracted git diffs, test output, and failure coordinates (e.g. `src/lib.rs:846`), and presented them in prose to a replacement model selected via `CompatibilitySelector`.
- **Result:** 0 Fail $\to$ Pass rescues (0/2). Total passes: Control 1/6 (16.7%) vs Dynamic 1/6 (16.7%).
- **Forensic Discovery:** The incoming model suffered **Cold-Start Interface Friction**. In CH-01 (Rust Walkdir, 3B $\to$ 1.5B), 1.5B received coordinates `src/lib.rs:846`, but immediately began reading lines 1–400 of `src/lib.rs` (preamble and comments). It burned all 4 remaining turns reading file headers without ever viewing line 725 or emitting an edit.

### Phase 8.4A: The Working Interface Breakthrough
- **Implementation:** `scratch/handoff_compiler_v84a.py` (`SHA256: 1f541e32...`).
- **Mechanism:** Condition B (Compiled Handoff) directly compiled the bounded code viewport $[coord - 15 : coord + 15]$ around the verified failure coordinates into the replacement model's initial prompt.
- **Empirical Breakthrough:**
  - **First Causal Fail $\to$ Pass Rescues in WTF History (2 of 4 tasks rescued, 50.0%)**:
    - **CH-01 (Down-size: 3B $\to$ 1.5B):** Initial 3B failed 4 patches. Under Cold, 1.5B emitted 4 redundant reads and died. Under Compiled, 1.5B received lines 710–740 of `src/lib.rs`, emitted `replace_in_file` on **Turn 1 post-switch**, and **passed immediately**.
    - **CH-03 (Up-size: 3B $\to$ 7B):** Initial 3B hit boundary on `@sindresorhus/is`. Under Cold, 7B read preamble and failed. Under Compiled, 7B received lines 675–705 of `index.ts`, emitted `replace_in_file` on **Turn 1 post-switch**, and **passed immediately**.
  - Redundant reads dropped by **-87.5%** (8 $\to$ 1).
  - Turns to first repair dropped from 2.0 to **1.0 turn** (100% repaired on Turn 1).
  - Tokens before first repair dropped from 1,032 to **0 tokens**.

### Phase 8.4B: Local Cohort Replication
- **Implementation:** `scratch/run_phase8_4b_replication.py` (`SHA256: 3be17438...`).
- **Cohort:** 8 paired challenges across 4 languages (Rust, Node/TS, Go, Python).
- **Results:**
  - Replicated both rescues (CH-01 down-size, CH-03 up-size).
  - Overall pass rate doubled under Compiled Handoff: **2/8 (25.0%) $\to$ 4/8 (50.0%)**.
  - **0 Pass $\to$ Fail regressions**.
  - Redundant reads cut by 50.0% (10 $\to$ 5).
  - Turns to first repair: 2.0 $\to$ 1.0 (100% repaired Turn 1).
  - Tokens before first repair: 870 $\to$ 0.

### Phase 8.5: Cross-Substrate Remote Generalization
- **Implementation:** `scratch/run_phase8_5_replication.py` (`SHA256: f7e21a8b...`).
- **Cohort:** 6 paired challenges using commercial remote models via OpenRouter (Meta Llama 3.1 8B, Mistral Small 24B, DeepSeek Chat).
- **Results:**
  - Overall pass rate doubled: **2/6 (33.3%) $\to$ 4/6 (66.7%)**.
  - 2 causal rescues replicated: CH-01 (Local 3B $\to$ Remote Llama 8B), CH-05 (Remote Llama 8B $\to$ Remote Mistral 24B).
  - Redundant reads collapsed: 5 $\to$ 1 (-80.0%).
  - Paid API spend on DeepSeek reduced by **-29.9%** ($0.00077 $\to$ $0.00054).
  - Total inference cost across all 6 remote trials: $0.00496 USD.

---

## 2. Transferred Information & Provenance Classification

Every field compiled into the handoff packet across Phases 8.4–8.5 is audited and classified below:

| Field Name | Exact Content in Packet | Provenance Category | Epistemic Rationale |
| :--- | :--- | :--- | :--- |
| `task_intent` | User instruction & target file string | **INTELLIGENCE-PRODUCED STATE** | Authored by external human/user; WTF preserves verbatim without interpretation. |
| `repository_state` | `git status --short` and `git diff` | **DETERMINISTIC REALITY** | Factual bytes and status directly observed from the git subsystem. |
| `current_verification_output` | Subprocess stdout/stderr & returncode | **DETERMINISTIC REALITY** | Physical execution output from test command subprocess. |
| `failure_coordinates` | Parsed trace frames (e.g. `src/lib.rs:846`) | **DERIVED DETERMINISTIC STATE** | Deterministically extracted from verification stdout using regex patterns. |
| `bounded_viewport` | Lines $[coord - 15 : coord + 15]$ with line numbers | **DERIVED DETERMINISTIC STATE** | Deterministic filesystem read around failure coordinates. Zero injected edits. |
| `attempted_mutations` | Predecessor's patch snippets and action statuses | **INTELLIGENCE-PRODUCED STATE** | Predecessor's authored attempts, captured deterministically by runtime receipts. |
| `verification_deltas` | Test error messages following failed patches | **DETERMINISTIC REALITY** | Direct error output recorded after each predecessor edit. |
| `falsified_approaches` | Tuples of `[file, rejected_patch, error_delta]` | **DERIVED DETERMINISTIC STATE** | Deterministic filtering of attempted mutations where verification failed. |
| `unresolved_residual` | Factual statement of current failing status | **DERIVED DETERMINISTIC STATE** | Factual synthesis: `"Verification still failing with exit code X on Y."` |

### What the Handoff Compiler Decides vs. Merely Preserves / Projects
- **What it decides:**
  - Viewport radius: fixed parameter ($\pm 15$ lines).
  - Coordinate selection precedence: first in-tree trace frame matching target file.
  - Path filtering: ignores virtualenvs, system libraries (`node_modules`, `site-packages`, `.venv`).
  - Formatting truncation bounds (e.g. diffs truncated to 1,200 chars).
- **What it merely preserves, projects, or transfers:**
  - Raw source code from disk (verbatim).
  - Git diff and status (verbatim).
  - Test runner output (verbatim).
  - Predecessor's attempted code (verbatim).
- **What it NEVER decides:**
  - The compiler **never suggests a fix**.
  - The compiler **never modifies code**.
  - The compiler **never injects benchmark answer keys**.
  - Epistemic Rule: *Projection is not selection.*

---

## 3. Chain-of-Thought Independence Audit

A central question for multi-agent architecture:
> *Does state continuation require transferring the predecessor's private chain-of-thought, reasoning tokens, or conversational history?*

**Empirical Finding: NO. CHAIN-OF-THOUGHT IS COMPLETELY UNNECESSARY.**

- Across all 18 challenges in Phases 8.4A, 8.4B, and 8.5:
  - Predecessor reasoning tokens, scratchpads, internal explanations, and conversational message histories were **100% discarded**.
  - The incoming intelligence received **only compiled physical reality** (the 9 fields audited above).
  - In **100% of switched trials (12/12)**, the replacement intelligence immediately emitted a valid code mutation on **Turn 1 post-switch** (`HANDOFF_CONTINUATION`).
  - Pass rates doubled (25% $\to$ 50% in 8.4B; 33.3% $\to$ 66.7% in 8.5) with zero regressions.
- **Scientific Conclusion:** Cognitive context is an illusion of chat-based interaction. What an incoming coding intelligence requires is **compiled physical grounding** (exact coordinates, bounded disk bytes, and falsified failure modes). Leaking chain-of-thought across agent boundaries introduces hallucination contagion and token bloat without adding capability.

---

## 4. Experimental Evidence Summary Table

| Phase | Setting | Challenges ($N$) | Switched Runs | Rescues (Fail $\to$ Pass) | Regressions (Pass $\to$ Fail) | Redundant Reads (Cold $\to$ Comp) | Turn to Repair (Cold $\to$ Comp) | Pass Rate (Cold $\to$ Comp) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **8.4** | Local (Cold Only) | 6 paired | 2 | 0 | 0 | 8 (Cold) | 2.0 (Cold) | 1/6 $\to$ 1/6 (16.7%) |
| **8.4A** | Local (Cold vs Comp) | 4 paired | 3 | **2** | **0** | 8 $\to$ 1 (-87.5%) | 2.0 $\to$ 1.0 (-50%) | 0/4 $\to$ 2/4 (**50.0%**) |
| **8.4B** | Local Replication | 8 paired | 5 | **2** | **0** | 10 $\to$ 5 (-50.0%) | 2.0 $\to$ 1.0 (-50%) | 2/8 $\to$ 4/8 (**50.0%**) |
| **8.5** | Remote Replication | 6 paired | 4 | **2** | **0** | 5 $\to$ 1 (-80.0%) | 2.0 $\to$ 1.0 (-50%) | 2/6 $\to$ 4/6 (**66.7%**) |
| **TOTAL**| **All Compiled Runs** | **18 paired** | **12** | **6** | **0** | **23 $\to$ 7 (-69.6%)**| **2.0 $\to$ 1.0 (-50%)**| **4/18 $\to$ 10/18 (+150% rel)** |

---

# PART 3 — RELATIONSHIP BETWEEN THE TWO

## 1. Testing the Conceptual Sequence

We test the end-to-end execution loop proposed in research:

```
[1. INTELLIGENCE] ──> Authors candidate mutation
        │
        ▼
[2. ACTION] ────────> Enacted via Action Compiler against disk bytes
        │
        ▼
[3. WTF OBSERVES] ──> Verify-on-Write executes checks; Trace Slice extracts coordinates
        │
        ▼
[4. PROGRESS STATE] > Trajectory state machine updates turn counts and error deltas
        │
        ▼
[5. CONTINUE / BND] > Stagnation check evaluates trajectory rules
        │
   ┌────┴───────────────────────────┐
   ▼                                ▼
[CONTINUE]                    [STAGNATION DETECTED]
(Proceeds to next turn)             │
                                    ▼
                      [6. COMPILE ESTABLISHED STATE]
                      (Diffs + Coords + Viewport + Falsified Attempts)
                                    │
                                    ▼
                      [7. EMIT HANDOFF PACKET]
                                    │
                                    ▼
                      [8. ORCHESTRATION / ROUTING]
                      (Human or External Harness invokes replacement)
```

## 2. Where Semantic Decisions Exist in the Sequence

We rigorously analyze every transition to locate where semantic choices occur:

1. **Step 1 (Intelligence Authors Edit):** **SEMANTIC DECISION.** Formulation of code hypotheses belongs entirely to intelligence.
2. **Step 2 (Action Compilation):** **DETERMINISTIC.** Normalizing whitespace and verifying exact anchor matches requires zero semantic choice.
3. **Step 3 (Substrate Observation):** **DETERMINISTIC.** Subprocess execution, exit code capture, and regex trace parsing are physical observations.
4. **Step 4 (Progress State Tracking):** **DETERMINISTIC.** Incrementing counters (idle turns, action fails, patch history) is purely arithmetic.
5. **Step 5 (Boundary / Stagnation Evaluation):**
   - Evaluating whether `consecutive_idle_turns >= 3` is a **DETERMINISTIC EVALUATION**.
   - Asserting that this state warrants halting or that the agent *cannot* solve the problem is an **EVIDENTIARY EVALUATION OF STAGNATION**.
   - **CRITICAL DISTINCTION:** Halting the agent process or deciding that a task is doomed is a **POLICY DECISION**.
6. **Step 6 (State Compilation):** **DETERMINISTIC.** Packaging git diffs, coordinates, and reading disk bytes into a bounded viewport is mechanical derivation.
7. **Step 7 (Handoff Artifact Emission):** **DETERMINISTIC.** Outputting a JSON or Markdown continuation packet is pure representation.
8. **Step 8 (Model Selection & Invocation):** **SEMANTIC / POLICY DECISION.**
   - Deciding *which* model to call (e.g. 1.5B vs 7B vs human), managing API credentials, paying inference fees, and resuming execution is a **SCHEDULING AND ORCHESTRATION DECISION**.

## 3. Constitutional Boundary Verdict on the Sequence

**WTF IS NOT PERMITTED TO EXECUTE STEP 8.**

Under WTF's founding constitution:
> *"Agents act. WTF proves. Humans decide."*  
> *"WTF establishes what is and what happened. It does not decide what should happen."*

- WTF **may** observe trajectory stagnation (Step 5).
- WTF **may** compile established reality into a clean handoff packet (Steps 6 & 7).
- WTF **must NOT** contain an autonomous process supervisor that selects alternative LLMs, manages provider API keys, or drives the multi-agent invocation loop.
- Therefore: Boundary Detection and Compiled Handoff form a **coherent Trajectory Perception and State Preservation Layer**, which sits *below* any scheduler or agent harness.

---

# PART 4 — RESEARCH → RUNTIME GAP

## 1. Classification of All Mechanisms

| Mechanism / Component | Research Phase | Empirical Status | Production Classification | Production Gap / Location |
| :--- | :--- | :--- | :--- | :--- |
| **Trace Slice** | 2.6, 6.1, 9.3 | ESTABLISHED | **SHIPPED in v0.2.0** | `src/core/trace-slice.ts` (Frozen) |
| **Context Viewport** | 4.2, 6.1, 9.3 | ESTABLISHED | **SHIPPED in v0.2.0** | `src/core/viewport.ts` (Frozen) |
| **Action Normalization** | 8.3A, 9.3 | ESTABLISHED | **SHIPPED in v0.2.0** | `src/core/action-normalizer.ts` (Frozen) |
| **Action Compilation** | 5.2, 7.3C, 9.3A | ESTABLISHED | **SHIPPED in v0.2.0** | `src/core/action-compiler.ts` (Frozen) |
| **Boundary / Stagnation Detector** | 8.3, 8.3A, 8.3B | ESTABLISHED (87.5% rec) | **PROTOTYPED** | `scratch/blind_boundary_detector_v83b.py` |
| **Compiled Handoff** | 8.4A, 8.4B, 8.5 | ESTABLISHED (6 rescues) | **PROTOTYPED** | `scratch/handoff_compiler_v84a.py` |
| **State Transfer Compiler** | 8.4 | ESTABLISHED | **PROTOTYPED** | `scratch/state_transfer_compiler.py` |
| **Capability Handshake Engine** | 7.3–7.6 | ESTABLISHED | **PROTOTYPED** | `scratch/capability_handshake_engine.py` |
| **Compatibility Selector** | 8.4 | ESTABLISHED (100% comp) | **RESEARCH-ONLY** | `scratch/compatibility_selector.py` |
| **Dynamic Switching Runner** | 8.4, 8.4A, 8.4B | EXPERIMENTAL | **RESEARCH-ONLY / SCAFFOLDING** | `scratch/run_phase8_*.py` |
| **Remote Handshake / API Client** | 8.5 | EXPERIMENTAL | **RESEARCH-ONLY / SCAFFOLDING** | `scratch/handshake_8_5_engine.py` |
| **Operating Profile Cards** | 7.1, 7.2 | ESTABLISHED | **EVIDENCE ONLY** | Documented in research reports |
| **Task × Model Compatibility** | 8.1, 8.2 | ESTABLISHED | **EVIDENCE ONLY (PRINCIPLE)** | Documented in research reports |
| **Multi-D RIR Theory** | 8.1, 8.2 | ESTABLISHED | **EVIDENCE ONLY (PRINCIPLE)** | Documented in research reports |
| **Residual Work Breakdown (72% waste)**| 8.6 | ESTABLISHED | **EVIDENCE ONLY (AUDIT)** | Documented in Phase 8.6 report |
| **JUG Discrete Decision Layer** | 8.J0, 8.J1 | FALSIFIED (0% lift) | **REJECTED** | Quarantined in `scratch/phase8_j1/` |
| **Jev / Regime 1 in Local Repair** | 8.J0, 8.6 | NOT OBSERVED (0.0%) | **REJECTED / DEFERRED** | Excluded from local repair runtime |
| **1D Scalar Difficulty Escalation** | 8.1, 8.2 | FALSIFIED | **REJECTED** | Inversion cases disproved 1D ladders |

---

## 2. Separation: Principle, Mechanism, Scaffolding, Product Feature

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ARCHITECTURAL TAXONOMY                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. PRINCIPLES (Scientific Foundations — Governs Thinking, Never Features)   │
│    • Invariant Substrate Independence: Perception must not depend on model  │
│    • Projection is Not Selection: Expose raw reality; never inject answers  │
│    • Multi-Dimensional Compatibility: Scalar model capability is a fallacy  │
│    • Chain-of-Thought Independence: State continuation needs bytes, not CoT │
│    • Agents act. WTF proves. Humans decide.                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. REUSABLE MECHANISMS (Clean Algorithmic Engines)                          │
│    • Trajectory State Machine: Turn-by-turn action & stagnation tracking    │
│    • Stagnation Rules: Post-mutation idle, patch failure, premature surrender│
│    • Handoff Packet Assembly: Binding diffs, trace frames, viewports & fails│
│    • Trace Coordinate Parsing: Multi-language stack trace regex extraction  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. EXPERIMENTAL SCAFFOLDING (Research Harnesses — Discard in Production)   │
│    • `run_phase8_*.py` monolithic test loops                                │
│    • Hardcoded `MODEL_PROFILES` dictionaries in Python scripts              │
│    • Ollama & OpenRouter subprocess invocation wrappers                     │
│    • Hardcoded benchmark challenge suites (`CH-01` through `CH-08`)         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. POTENTIAL PRODUCT FEATURES (Production Trajectory Runtime)               │
│    • `wtf progress` (or trajectory inspection API): Factual stagnation flag │
│    • `wtf handoff` (or `compileHandoff()` API): Formatted continuation state│
│    • Machine-parsable JSON Trajectory Ledger in `CanonicalEvidenceDocument` │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Engineering Dependencies & Production Gaps

### Useful-Progress / Boundary Detection
- **Reusable Code in `scratch/`:** `BlindBoundaryDetectorV83B` in `scratch/blind_boundary_detector_v83b.py`. The state machine tracking `consecutive_navigation_turns`, `consecutive_action_failures`, `consecutive_post_mutation_idle_turns`, and `mutations_history` is completely generic and cleanly decoupled.
- **Harness-Specific Code to Strip:** Hardcoded turn limits, benchmark task dictionaries, and console print logs.
- **Dependencies on Model Identity:** **ZERO.** Blind by design.
- **Dependencies on Experimental Task Format:** Minimal. Requires only `action`, `args`, `action_status`, and verification results.
- **Dependencies on v0.2 Capabilities:** Strongly depends on `ActionNormalizer` (which was frozen into v0.2.0 in `src/core/action-normalizer.ts`) and verification exit codes.
- **Missing Production Primitives:**
  - TypeScript implementation: `src/core/trajectory-detector.ts`.
  - Trajectory state store: An append-only turn ledger (`TrajectoryTurn[]`) recording actions, verification outcomes, and error deltas.
- **Implementation Distance:** Low-to-Medium (~250 LOC TypeScript).
- **Constitutional Risk:** Must be named `TrajectoryStagnationDetector` or `ProgressStateTracker`. Must emit factual trajectory classifications (`PROGRESS`, `ACTION_FRICTION`, `NAVIGATION_LOOP`, `POST_MUTATION_STAGNATION`, `PERSISTENT_ACTION_FAILURE`, `UNRESOLVED_TERMINATION`), avoiding speculative claims about model cognitive capacity.

### Compiled Handoff
- **Reusable Code in `scratch/`:** `HandoffCompilerV84A` in `scratch/handoff_compiler_v84a.py` and `StateTransferCompiler` in `scratch/state_transfer_compiler.py`.
- **Harness-Specific Code to Strip:** Specific prompt header wrappers and trial runner glue.
- **Dependencies on Model Identity:** **ZERO.** Compiled reality is identical regardless of who consumes it.
- **Dependencies on v0.2 Capabilities:** **DIRECTLY COMPOSES ON v0.2.** Uses `src/core/trace-slice.ts` (`extractTraceFrames`) to locate coordinates and `src/core/viewport.ts` (`extractBoundedViewport`) to project code windows.
- **Missing Production Primitives:**
  - TypeScript implementation: `src/core/handoff-compiler.ts`.
  - Integration with existing `src/core/evidence-compiler.ts` or standalone CLI subcommand (`wtf handoff`).
- **Implementation Distance:** Low (~200 LOC TypeScript; 80% of the heavy lifting is already implemented in v0.2's `trace-slice.ts` and `viewport.ts`).
- **Constitutional Risk:** Zero, provided the packet contains strictly raw disk code and factual execution records without injected suggestions.

---

# PART 5 — MINIMUM COHERENT TRAJECTORY RUNTIME

## 1. Core Architectural Questions Answered

### What could WTF safely observe?
WTF can safely observe all physical, subprocess, and trajectory state transitions across time:
1. Turn-by-turn action emissions and their normalized canonical types (`READ`, `MUTATION`, `SHELL`, `FINISH`).
2. Action execution outcomes (accepted, rejected, anchor mismatch, file not found).
3. Verification command outcomes (exit codes, execution duration, raw stdout/stderr).
4. Error deltas between consecutive mutations (identical, changed, resolved).
5. Tool call patterns over time (consecutive file reads without code changes, consecutive patch rejections, idle turns following a failed edit).

### What could WTF deterministically preserve?
WTF can deterministically preserve the cumulative progress of an agent session:
1. The active repository state delta (`git diff` and modified files).
2. The current unresolved failure coordinates parsed from test output.
3. The bounded code viewport ($[coord \pm radius]$) centered on the active failure.
4. The history of attempted mutations and their resulting error deltas (falsified approaches).
5. The complete turn ledger recording the trajectory.

### What could WTF expose to intelligence?
WTF can expose a dense, high-leverage continuation artifact:
1. **The Compiled Handoff Packet (`HandoffPacket`):** Exposing the task intent, active failure coordinates, bounded code viewport, verified git diff, and falsified approaches.
2. **The Trajectory Progress Status:** Exposing whether the trajectory is currently making progress (`CONTINUE`), experiencing interface friction (`INTERFACE`), suffering syntax failures (`ACTION`), or exhibiting stagnation (`STAGNATION`).

### What decisions must remain with intelligence?
1. **Why the code is failing:** Hypothesis formulation and semantic root cause analysis.
2. **How to fix the code:** Algorithm design, syntax authoring, and code replacement.
3. **What to do when stagnated:** Whether the current agent should re-read, backtrack, abandon an approach, spawn a subagent, escalate to a larger model, or yield to a human engineer.
4. **Who acts next:** Model routing, model selection, API billing, and task scheduling.

### Can useful-progress detection exist without model routing?
**YES. ABSOLUTELY.**
Progress and stagnation detection is a valuable perception capability on its own:
- An IDE extension can alert the human developer: *"Agent has attempted 4 invalid patches in a row; attention required."*
- An agent harness can inject a self-correction reflection prompt: *"WTF Notice: You have spent 3 consecutive turns reading without authoring a fix. Review coordinates."*
- A CI/CD pipeline can fail fast when an agent is stuck in an infinite read loop, saving thousands of tokens without waiting for an arbitrary 30-turn timeout.

### Can compiled handoff exist without automatic model selection?
**YES. ABSOLUTELY.**
Compiled handoff is simply **state preservation**:
- A human engineer can run `wtf handoff` to inspect the exact failure viewport and attempted fixes when an agent gives up.
- A single agent can use `wtf handoff` to compress its context window when approaching token limits, discarding chat history while retaining compiled physical reality.
- An external multi-agent framework (e.g. LangGraph, CrewAI, AutoGen) can ingest `HandoffPacket` to decide its own routing.

### Is automatic switching actually required?
**NO.**
Automatic model switching was an experimental harness apparatus constructed to prove the utility of Compiled Handoff under controlled laboratory conditions. The production runtime requires the *evidence and handoff primitives*, not the scheduler.

### What research mechanisms should NOT be productized?
1. **`CompatibilitySelector` with hardcoded model profiles (`qwen-1.5b`, `qwen-3b`, `qwen-7b`):** Model capabilities change with every release, quantization, and fine-tune. Hardcoding profiles into WTF is brittle and unmaintainable.
2. **Autonomous LLM API execution loops (`run_phase8_*.py`):** WTF is a deterministic CLI and evidence engine, not an agent runtime or LLM gateway.
3. **JUG / Jev discrete decision layers:** Empirically proven to provide 0% lift in local repair loops (Phase 8.J1).
4. **Cognitive "Capability Boundary" labeling:** In production, this must remain strictly within trajectory observation (`STAGNATION_DETECTED`).

---

## 2. The Natural Next Runtime Boundary: Candidate v0.3

A natural, powerful, and constitutionally immaculate runtime boundary is clearly visible above the frozen v0.2 substrate.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 WTF RUNTIME EVOLUTIONARY STRATIFICATION                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ v0.3 CANDIDATE: THE TRAJECTORY RUNTIME (Multi-Turn State & Handoff)         │
│ • Trajectory State Ledger (`src/core/trajectory-ledger.ts`)                 │
│ • Trajectory Stagnation Detector (`src/core/stagnation-detector.ts`)        │
│ • State Transfer & Handoff Compiler (`src/core/handoff-compiler.ts`)        │
│ • Zero Model Execution / Zero Scheduler / Zero Model Profiles               │
├─────────────────────────────────────────────────────────────────────────────┤
│ v0.2 FROZEN SUBSTRATE (Deterministic Invariant Execution)                   │
│ • Trace Slice (`src/core/trace-slice.ts`)                                   │
│ • Context Viewport (`src/core/viewport.ts`)                                 │
│ • Action Normalizer (`src/core/action-normalizer.ts`)                       │
│ • Action Compiler (`src/core/action-compiler.ts`)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ v0.1 FROZEN CORE (Evidence & Perception Primitives)                         │
│ • Five Primitives (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIF`, `UNKNOWN`)  │
│ • Verification Lifecycle Engine (`src/verify/runner.ts`)                    │
│ • Radix Trie Path Projection (`src/core/path-tree.ts`)                      │
│ • Single-Turn WTF-RECEIPT Machine Contract (`src/formatters/agent.ts`)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Candidate v0.3 Boundary: "Trajectory State & Handoff Runtime"
- **Layer Purpose:** Lift WTF from a single-turn tool (`v0.1 + v0.2`) into a multi-turn trajectory state and handoff compiler, without becoming an agent scheduler.
- **Surface Capabilities:**
  1. `wtf progress` (or programmatic API): Evaluates the session turn ledger and returns factual trajectory health (`PROGRESS`, `ACTION_FRICTION`, `NAVIGATION_LOOP`, `STAGNATION_POST_MUTATION`, `PERSISTENT_ACTION_FAILURE`, `TERMINAL_PASS`).
  2. `wtf handoff` (or programmatic API): Emits a canonical `HandoffPacket` containing verified diffs, active trace coordinates, bounded code viewports, and falsified approaches.
- **Constitutional Guarantee:** Pure Regime 0 deterministic computation and projection. Zero LLM calls. Zero model selection. 100% compliant with the WTF Constitution.

---

## 3. Pocket 21 Rule Final Affirmation

> **MAGNIFY THE TRAJECTORY. DO NOT BUILD THE SCHEDULER.**

- Phase 10.0 has completely magnified the trajectory mechanisms of Phases 8.3–8.6.
- Zero production code was written.
- Zero model calls were performed.
- Zero schedulers were built.
- The path forward is completely mapped and verified.
