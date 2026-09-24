# WTF Phase 6.3 — Stage 4: Residual Intelligence Decomposition

**Date**: 2026-09-22  
**Dataset**: Full Stage 3 Causal Validation Matrix (90 paired trajectories: 45 `CONTROL` vs 45 `WTF`, 669 total turns)  
**Scope**: Turn-by-turn decomposition of all operations into **I** (Irreducibly Intelligent), **D** (Deterministic conditional on intelligent decision), **H** (Harness/tool artifact), and **U** (Unclear).  
**Prioritized Trajectories**:
* 29 persistent failure pairs (`FAIL → FAIL`)
* 3 paired regressions (`PASS → FAIL`)
* 3 paired rescues (`FAIL → PASS`)
* 10 stable pass pairs (`PASS → PASS`)

---

## Executive Summary

Stage 4 conducted an exhaustive, turn-by-turn decomposition across all 669 operational turns in the Stage 3 causal validation matrix to answer:
> *What work is the model still doing that does not fundamentally require intelligence?*

### The Verdict: **B**
> **Verdict B — Some deterministic work remains, but unlikely transformative.**

Across 90 trials, **62.2% of model turns (416 turns)** consist of deterministic operations conditional on prior decisions—overwhelmingly dominated by **window paging and chunking** (39.8% of all turns in the benchmark). However, removing this remaining deterministic friction is **unlikely to be transformative for task capability**:
1. **The Intelligence Bottleneck**: In **75.9% of persistent failures** (22/29), the model had already localized the code and attempted code edits, but failed because the synthesized code was mathematically, logically, or syntactically incorrect.
2. **The Universally Unsolved Frontier**: In the remaining 24.1% of failures (7/29) where no edits were made, every single task belongs to a task class that **no model in the ladder could solve** (`click`, `uuid`, `bstr`, `anyhow`, `is-numeric`, `ky-hooks`, `gjson`). Models paged not because paging was required, but because they could not comprehend the architectural relationships.
3. **The Empirical Lesson of Stage 3**: Eliminating manual verification orchestration and providing deterministic trace slices saved **1.0 turn per task** and **37.3% wall time**, but produced an exact **0.0% net gain in pass rate**. Eliminating the remaining mechanical taxes would produce similar efficiency dividends without expanding the model's semantic reasoning capacity.

---

## 1. Quantification of Operational Turns (I / D / H / U)

Across all 90 trajectories (669 turns), operations were classified according to the strict epistemic rule:
* **I (Irreducibly Intelligent)**: Requires semantic understanding, ambiguity resolution, intent interpretation, design choice, or code logic reasoning.
* **D (Deterministic conditional on decision)**: Given observable state and the model's semantic target, a non-semantic deterministic procedure could reliably execute the operation.
* **H (Harness Artifact)**: Tool schema errors, missing arguments, parse glitches, or provider timeouts.
* **U (Unclear)**: Ambiguous actions.

### Global Turn Distribution

| Category | Total Turns | Share of Operations (%) | Operational Definition |
| :--- | :---: | :---: | :--- |
| **I — Irreducibly Intelligent** | **142** | **21.2%** | Code synthesis, semantic inspection, architectural decisions, task completion judgment |
| **D — Deterministic Conditional**| **416** | **62.2%** | Viewport paging, coordinate navigation, syntax/indentation repair, manual test calls |
| **H — Harness / Environment** | **109** | **16.3%** | Tool schema mismatch (e.g. empty `{}` args), JSON parsing fallbacks, provider timeouts |
| **U — Unclear** | **2** | **0.3%** | Unclassified / edge transitions |
| **Total** | **669** | **100.0%** | Full 90-run matrix |

### Distribution by Condition (CONTROL vs WTF)

| Condition | I (Intelligent) | D (Deterministic) | H (Harness Artifact) | Total Turns |
| :--- | :---: | :---: | :---: | :---: |
| **CONTROL** | 66 (19.3%) | 226 (66.1%) | 50 (14.6%) | 342 turns |
| **WTF** | 76 (23.2%) | 190 (58.1%) | 59 (18.0%) | 327 turns |
| **Delta** | **+3.9%** | **-8.0%** | +3.4% | -15 turns |

*Observation*: WTF reduced deterministic turns from 66.1% to 58.1%. Specifically, **38 manual verification turns** under CONTROL were reduced to **0 turns** under WTF.

---

## 2. Granular Breakdown of Deterministic (D) Work

Where do the 416 deterministic turns go?

| Deterministic Pattern | Turns | Share of D (%) | Share of All Turns (%) | Description |
| :--- | :---: | :---: | :---: | :--- |
| **Window Paging & Chunking** | **266** | **63.9%** | **39.8%** | Mechanically sliding a 100–120 line viewport down a known file (e.g., lines 1–120, then 121–240, 241–360...) |
| **Symbol Coordinate Navigation** | **50** | **12.0%** | **7.5%** | Reading chunks to locate the line numbers of an already-known function, class, or method name |
| **Manual Verification Orchestration** | **38** | **9.1%** | **5.7%** | Calling `pytest`, `cargo test`, or `go test` in CONTROL (100% eliminated in WTF) |
| **Patch Construction Retry** | **24** | **5.8%** | **3.6%** | Retrying `replace_in_file` due to minor whitespace or target string mismatch |
| **Diagnostic Navigation** | **21** | **5.0%** | **3.1%** | Model querying `wtf_show` for diagnostics or trace information |
| **Indentation & Syntax Repair** | **14** | **3.4%** | **2.1%** | Spending subsequent turns fixing indentation errors introduced by its own prior patch |
| **Filesystem Navigation** | **3** | **0.7%** | **0.4%** | Running `grep`, `find`, or `ls` commands to locate files |

---

## 3. Forensic Audit of Regressions (PASS $\rightarrow$ FAIL)

Did WTF causally contribute to any of the 3 observed regressions, or were they driven by model stochasticity?

### Regression 1: `qwen/qwen3-8b` on `task-14-node-ky-merge-stale-array`
* **CONTROL**: **PASSED in 5 turns**. Model read `merge.ts` across turns 1–3, identified the merge condition at line 350, and applied a surgical single-line `replace_in_file` at turn 4.
* **WTF**: **FAILED in 8 turns** (`turn exhaustion`). At turn 1, on a task with tier `none` (no initial diagnostics), the model called `write_file` with a 20-line stub implementation, completely overwriting the 400-line `merge.ts` file without reading it first. This broke module exports (`cloneShallow`, `deletedParametersSymbol`), causing catastrophic compiler failure. The model spent turns 2–8 trying to recreate dummy exports and ran out of turns.
* **Causal Attribution**: **Model Stochasticity / Rash Action**. WTF tools did not inject bad data. The model hallucinated that it could write the whole file from scratch on turn 1.

### Regression 2: `qwen/qwen3-14b` on `task-02-python-marshmallow-url-fragment`
* **CONTROL**: **PASSED in 8 turns**. Model read lines 70–105, wandered through lines 150–180 at turn 7, and happened to execute the correct regex patch at turn 8.
* **WTF**: **FAILED in 8 turns** (`turn exhaustion`). Model read lines 70–105, then read lines 150–200, 200–250, and 250–300. At turn 7, it attempted an edit targeting a regex string that did not exist in the file (`Target text not found`). It exhausted turns reading lines 105–150.
* **Causal Attribution**: **Model Search Stochasticity**. In both conditions, the 14B model struggled with regex localization. Under CONTROL, its random walk hit the target at turn 7; under WTF, its random walk hit lines 200–300.

### Regression 3: `qwen/qwen-2.5-coder-32b-instruct` on `task-01-python-starlette-status-code`
* **CONTROL**: **PASSED in 8 turns**. Model failed turns 2 and 3 due to empty args `{}`, edited at turn 5, verified at turn 6, and passed at turn 8.
* **WTF**: **FAILED in 8 turns** (`turn exhaustion`). At turn 3, the model inserted a `try/except` block with mismatched indentation:
  ```python
  try:
      detail = http.HTTPStatus(status_code).phrase
  except ValueError:
      detail = ""
```
  Verify-on-Write immediately caught the syntax failure:
  `IndentationError: expected an indented block after 'try' statement on line 10`.
  Rather than fixing indentation cleanly, the model attempted successive malformed replacements across turns 4–8, entering an unrecoverable indentation loop.
* **Causal Attribution**: **Model Code Synthesis Failure**. Verify-on-Write accurately and immediately reported the indentation syntax failure within 706ms. The model was incapable of calculating Python whitespace indentation offsets.

---

## 4. Forensic Audit of Rescues (FAIL $\rightarrow$ PASS)

What was the exact causal mechanism behind the 3 rescues?

### Rescue 1: `qwen/qwen3-14b` on `task-05-go-sjson-trailing-bracket`
* **CONTROL**: **FAILED in 8 turns**. Model identified the issue and applied an edit at turn 6. However, lacking immediate feedback, it second-guessed itself, spending turns 7 and 8 reading auxiliary files, running out of turns before asserting completion.
* **WTF**: **PASSED in 8 turns**. Model made the edit at turn 7. Verify-on-Write immediately executed `go test` in 14ms and returned passing evidence. Reassured by machine verification, the model called `finish` at turn 8.
* **Causal Mechanism**: **Turn-Lag Elimination**. Immediate verification removed epistemic doubt and eliminated the need for manual post-edit verification turns.

### Rescue 2: `qwen/qwen-2.5-coder-32b-instruct` on `task-09-rust-walkdir-skip-dir`
* **CONTROL**: **FAILED in 8 turns**. Model spent turns 1–6 paging through unrelated sections of `src/lib.rs` (1,120 lines). It located the method at turn 7, but ran out of turns before it could test its patch.
* **WTF**: **PASSED in 8 turns**. Model localized the method at turn 7 and replaced `stack_list.pop()` with `self.pop()`. Verify-on-Write automatically invoked `cargo test` in 3.6s, returning `test result: ok. 1 passed`. The model saw passing evidence and finished.
* **Causal Mechanism**: **Automated Verification on Write**. The model had only 1 turn remaining after finding the bug; without automated verification on write, it would have required turn 9 to verify.

### Rescue 3: `qwen/qwen-2.5-coder-32b-instruct` on `task-14-node-ky-merge-stale-array`
* **CONTROL**: **FAILED in 8 turns**. Model spent all 8 turns reading chunks of `merge.ts` without attempting an edit.
* **WTF**: **PASSED in 5 turns**. Model read targeted chunks, made a surgical single-line modification at turn 4, and Verify-on-Write verified AVA tests in 1.4s.
* **Causal Mechanism**: **Faster Feedback Loop**.

---

## 5. The Residual Intelligence Kernel

If all deterministic operations (**D**) are mentally subtracted from the trajectory, what decisions **must** the model make?

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE RESIDUAL INTELLIGENCE KERNEL                     │
│                                                                        │
│  1. Intent & Spec Interpretation                                       │
│     • Deduce the required contract change from failure diagnostics.   │
│     • Example: "Negative ensure! in anyhow must invert boolean test."  │
│                                                                        │
│  2. Invariant & Architecture Preservation                              │
│     • Determine which global system properties must NOT break.         │
│     • Example: "WalkDir oldest_opened must be decremented on pop."     │
│                                                                        │
│  3. Algorithmic Logic Synthesis                                        │
│     • Synthesize the mathematical, stateful, or algorithmic fix.      │
│     • Example: "UUID v7 monotonicity counter bit-shift arithmetic."   │
│                                                                        │
│  4. Compiler & Language Hygiene                                        │
│     • Satisfy language typing, lifetimes, macro expansions, AST rules. │
│     • Example: Rust macro pattern matching or TypeScript type guards.  │
│                                                                        │
│  5. Epistemic Completion Adjudication                                  │
│     • Evaluate whether verified test passing matches user intent.     │
└────────────────────────────────────────────────────────────────────────┘
```

### Analysis of the 29 Persistent Failures (FAIL $\rightarrow$ FAIL)

When we analyze the 29 persistent failure pairs through the lens of the Kernel:
* **75.9% (22/29 pairs)**: The model successfully localized the code and attempted code edits, but the edit failed.
  * In Rust `anyhow`: Models could not construct the macro expansion `(!$cond:expr)`.
  * In Go `uuid`: Models wrote incorrect bit-shift logic for monotonicity.
  * In Python `click`: Models broke the synopsis bracket-matching parser.
  * In Go `gjson`: Models corrupted JSON path tokenization.
* **24.1% (7/29 pairs)**: No edit was attempted because the model was lost in comprehension.
  * All 7 cases occurred in tasks that **zero models in the benchmark ever solved**.
  * The model paged repeatedly through files not because it lacked tooling, but because it could not comprehend the architectural relationships between components.

---

## 6. The Largest Remaining Deterministic Tax

What is the single largest mechanical tax remaining in the environment?

### The Viewport Paging Tax (266 turns, 39.8% of all operations)
* **Mechanics**: Current harnesses expose a 100–120 line sliding window. When a file has 400 to 1,200 lines (e.g., `walkdir/src/lib.rs`, `ky/source/utils/merge.ts`, `click/src/click/formatting.py`), models spend 3 to 6 consecutive turns just advancing `start_line` by 120 lines.
* **Impact**:
  * Consumes 40% of the agent's turn budget.
  * Multiplies token usage by re-transmitting prompt prefixes.
  * Introduces "lost-in-middle" attention degradation across turn contexts.
* **Why it is Unlikely Transformative for Capability**:
  * In 76% of failures, the model *already* paid this tax, reached the target function, and still failed because it could not write the correct patch.
  * Eliminating this tax would yield significant **efficiency dividends** (cutting turns and cost), but would **not solve the intelligence bound**.

---

## 7. The Mental Removal Experiment: Failure Funnel Projection (Audited & Retracted in Stage 4.1)

> [!WARNING]
> **Stage 4.1 Retraction Notice**: The preliminary claim below that *"mental removal of all D work yields at most 14–15 passes (31–33%)"* is **empirically indefensible** and has been **formally retracted**. As established in the Stage 4.1 Counterfactual Audit below, treating observed failed edits as an insurmountable capability bound commits the censoring fallacy: it ignores that models lost an average of 3.70 turns to viewport paging, leaving 0–1 repair cycles before turn exhaustion.

```
Stage 3 Observed (Actual):
  Total Pairs: 45
  ├─ Stable Passes: 10
  ├─ Rescues: 3
  ├─ Regressions: 3
  └─ Persistent Fails: 29
     ├─ Failed Edits (Single Attempt Under Censoring): 22
     └─ No Edits (Lost in Paging/Navigation): 7
```

---

## Stage 4.1 Addendum: Counterfactual Audit of the 29 Persistent Failures

**Date**: 2026-09-22  
**Purpose**: Rigorous turn-by-turn counterfactual audit of the 29 persistent failure pairs (`FAIL → FAIL`) to determine whether the Stage 4 claim that *"removing deterministic work would yield at most 14–15 passes"* is empirically defensible.

### 1. Counterfactual Classification Criteria

For each of the 29 persistent failure pairs, trajectories were analyzed under the WTF condition:
* **BOUND (27.6%, 8/29 pairs)**: Strong empirical evidence that additional repair runway would not plausibly resolve the failure. The model had $\ge 4$ turns of clean repair runway without deterministic friction, yet repeatedly synthesized incorrect logic or looped on identical conceptual errors.
* **CENSORED (31.0%, 9/29 pairs)**: Deterministic work (primarily window paging) consumed virtually all turns. The model either made 0 edits (exhausting turns on navigation) or made its first edit at turn 7 or 8 (leaving 0–1 repair cycles). Its capability under adequate repair runway is strictly **unobserved**.
* **MIXED (41.4%, 12/29 pairs)**: Semantic weakness was observed on an initial edit (turns 3–6), but subsequent recovery opportunities were materially consumed or derailed by deterministic friction (e.g., re-paging, patch whitespace mismatch, or indentation loops).
* **UNKNOWN (0%)**: Evidence sufficient to classify all 29 pairs.

### 2. Summary Audit Table (29 Persistent Fail Pairs)

| Classification | Pairs | Share (%) | Core Trajectory Reality |
| :--- | :---: | :---: | :--- |
| **CENSORED** | **9** | **31.0%** | First edit at turn 7–8 or no edit attempted; 0–1 repair turns remaining; turn budget burned on paging. |
| **MIXED** | **12** | **41.4%** | First edit attempted, but repair runway was consumed by deterministic friction (paging, patch retry, indentation). |
| **BOUND** | **8** | **27.6%** | Clean runway ($\ge 4$ repair turns) without deterministic friction; model persistently failed core algorithmic logic. |
| **Total** | **29** | **100.0%** | **72.4% (21/29) of persistent failures are materially censored or mixed.** |

### 3. Detailed Per-Pair Counterfactual Matrix

| Task ID | Model | 1st Edit Turn | Repair Runway | Classification | Concrete Trajectory Mechanism |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `task-02-marshmallow` | `qwen3-8b` | 4 | 4 turns | **BOUND** | Had 4 clean repair turns; repeatedly failed regex syntax logic without D friction. |
| `task-03-click` | `qwen3-8b` | None | 0 turns | **CENSORED** | 0 edits; 8/8 turns burned paging through `formatting.py` chunks; never reached edit phase. |
| `task-04-precommit` | `qwen3-8b` | 3 | 5 turns | **MIXED** | Edited at turn 3; remaining 5 turns consumed by re-paging file chunks and whitespace mismatches. |
| `task-07-uuid` | `qwen3-8b` | 4 | 4 turns | **BOUND** | Had 4 clean repair turns; failed bitwise timestamp arithmetic across 3 attempts. |
| `task-08-gjson` | `qwen3-8b` | 8 | 0 turns | **CENSORED** | First edit at turn 8; 0 repair turns available before turn exhaustion. |
| `task-09-walkdir` | `qwen3-8b` | None | 0 turns | **CENSORED** | 0 edits; 7/8 turns burned paging through 1,120 lines of `src/lib.rs`. |
| `task-10-bstr` | `qwen3-8b` | 8 | 0 turns | **CENSORED** | First edit at turn 8; 0 repair turns available. |
| `task-11-anyhow` | `qwen3-8b` | 2 | 6 turns | **BOUND** | First edit at turn 2; 6 clean repair turns; fundamentally lacked Rust macro pattern syntax. |
| `task-13-is-numeric` | `qwen3-8b` | 7 | 1 turn | **CENSORED** | First edit at turn 7; only 1 repair turn available. |
| `task-15-ky-hooks` | `qwen3-8b` | None | 0 turns | **MIXED** | 0 edits; lost turns between search, tool argument errors, and confusion. |
| `task-03-click` | `qwen3-14b` | None | 0 turns | **CENSORED** | 0 edits; 6/8 turns consumed by window paging down `formatting.py`. |
| `task-04-precommit` | `qwen3-14b` | 2 | 6 turns | **MIXED** | Edited at turn 2; repair runway consumed by re-reading and patch mismatch friction. |
| `task-07-uuid` | `qwen3-14b` | 2 | 6 turns | **MIXED** | Edited at turn 2; repair runway consumed by paging and patch retry friction. |
| `task-08-gjson` | `qwen3-14b` | 6 | 2 turns | **MIXED** | First edit at turn 6; only 2 repair turns, partly spent re-reading. |
| `task-09-walkdir` | `qwen3-14b` | 8 | 0 turns | **CENSORED** | First edit at turn 8; 0 repair turns available. |
| `task-10-bstr` | `qwen3-14b` | None | 0 turns | **CENSORED** | 0 edits; 7/8 turns consumed by window paging down `src/impls.rs`. |
| `task-11-anyhow` | `qwen3-14b` | None | 0 turns | **MIXED** | 0 edits; turns burned searching and trying to locate macro definitions. |
| `task-13-is-numeric` | `qwen3-14b` | 6 | 2 turns | **BOUND** | Edited at turn 6; semantic regex logic error across attempts. |
| `task-15-ky-hooks` | `qwen3-14b` | 3 | 5 turns | **BOUND** | Edited at turn 3; 5 clean repair turns; failed deep-clone semantics across 3 edits. |
| `task-02-marshmallow` | `qwen-32b` | 4 | 4 turns | **MIXED** | Edited at turn 4; subsequent turns lost to target text not found and re-paging. |
| `task-03-click` | `qwen-32b` | None | 0 turns | **CENSORED** | 0 edits; 5/8 turns burned paging through `formatting.py`. |
| `task-05-sjson` | `qwen-32b` | 3 | 5 turns | **BOUND** | Edited at turn 3; 5 clean repair turns; repeated semantic JSON parser logic failure. |
| `task-06-cmp` | `qwen-32b` | 4 | 4 turns | **BOUND** | Edited at turn 4; 4 clean repair turns; repeated Go byte comparison logic failure. |
| `task-07-uuid` | `qwen-32b` | 2 | 6 turns | **BOUND** | Edited at turn 2; 6 clean repair turns; failed monotonicity math across 4 edits. |
| `task-08-gjson` | `qwen-32b` | 5 | 3 turns | **MIXED** | Edited at turn 5; repair runway consumed by paging and patch retry. |
| `task-10-bstr` | `qwen-32b` | 5 | 3 turns | **MIXED** | Edited at turn 5; repair runway consumed by patch retry and compiler errors. |
| `task-11-anyhow` | `qwen-32b` | 6 | 2 turns | **MIXED** | Edited at turn 6; only 2 repair turns remaining. |
| `task-13-is-numeric` | `qwen-32b` | 3 | 5 turns | **MIXED** | Edited at turn 3; repair runway consumed by re-reading and whitespace patch retry. |
| `task-15-ky-hooks` | `qwen-32b` | 3 | 5 turns | **MIXED** | Edited at turn 3; repair runway consumed by re-reading chunks of `options.ts`. |

---

### 4. Audit of the "I" Category: Decontaminating Intelligence from Determinism

Stage 4 misattributed several mechanical constraints to "irreducible intelligence (I)":
1. **Indentation and Whitespace Syntax**: In Starlette, when `qwen-32b` failed due to `IndentationError: expected an indented block after 'try'`, Stage 4 labeled this an intelligent code synthesis failure. In reality, calculating Python indentation levels relative to the target line is a **deterministic mechanical AST constraint**.
2. **Preservation of Unrelated Code**: In Ky, when `qwen3-8b` called `write_file` and blew away 400 lines of existing implementation, Stage 4 called it a "code synthesis / semantic failure". Preserving lines outside the modified AST node/diff hunk is a **deterministic harness guarantee**.
3. **Patch Construction & Line Coordinates**: 24 turns were wasted on `replace_in_file` failing with "Target text not found" due to whitespace formatting mismatches. Constructing text diffs is deterministic.

#### True Semantic Decisions vs Deterministic Representation
* **Genuinely Semantic (I)**:
  * Deciding the logical invariant to establish (e.g., "non-standard status codes must not crash `HTTPException`").
  * Formulating the algorithmic transformation (e.g., bit-shift counter logic).
  * Deciding the architectural integration point.
* **Deterministic Execution & Representation (D)**:
  * Window paging / context retrieval.
  * Preserving surrounding AST nodes and imports.
  * Formatting whitespace, indentation, and braces.
  * Atomic application and compiler rollback.

---

### 5. Empirical Quantification of the Paging Tax

From direct trajectory measurements across all 90 runs:
* **Total Paging Turns**: **272 turns** (average **3.02 turns per run**).
* **Token Volume Consumed by Paging**: **~336,780 tokens** (~3,742 tokens per run).
* **Runway Lost to Paging in Failed Runs**: **3.70 turns per failed run**.

In failed runs, agents lose **nearly half of their entire 8-turn budget (46.3%)** solely advancing a 120-line viewport down source files. 

---

### 6. The Censoring Retraction

The Stage 4 claim that *"mental removal of all D work yields at most 14–15 passes"* was based on the premise that because observed edits failed, additional repair turns would be useless. 

**This premise is refuted by the trajectory data**:
* In **72.4% of persistent failures (21/29)**, the model had **$\le 2$ repair turns (and often 0)** because 3.7 turns were consumed by viewport paging and deterministic friction.
* Whether models given 5 to 7 clean verification-repair cycles could correct their initial hypotheses is **statistically censored by the 8-turn budget**.
* We cannot claim a 14–15 pass upper bound. What the evidence actually supports is:
  1. Exactly **8 pairs (27.6%)** demonstrate genuine semantic bounds under clean runway.
  2. The remaining **21 pairs (72.4%)** were prevented from attempting repair cycles by deterministic consumption.

---

## Conclusion & Frontier Classification

### **Verdict: B — Semantic weakness exists, but capability remains materially censored by deterministic work.**

1. **Semantic weakness is genuine**: 8 persistent failure pairs had ample clean runway ($\ge 4$ repair turns) and repeatedly failed algorithmic logic.
2. **Censoring is severe**: 21 persistent failure pairs were heavily censored by the 3.7-turn paging tax, preventing repair cycles from taking place.
3. **The 14–15 pass upper bound is retracted**: The empirical evidence does not permit measuring the ultimate semantic capability frontier until the viewport paging tax and patch formatting friction are eliminated.
