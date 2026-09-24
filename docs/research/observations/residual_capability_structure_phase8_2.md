# WTF Phase 8.2 — Residual Capability Structure & Multi-Dimensional Decomposition

## Executive Summary

Phase 8.2 evaluated the structural hypothesis underlying task routing and model capability:
> **Core Question:** *Is residual intelligence demand better represented as a multidimensional capability requirement than as a single difficulty level?*

Following the Phase 8.1 discovery of a non-monotonic frontier and partial ordinal predictability, we forensically analyzed the full frozen Phase 6.5 matrix (15 tasks $\times$ 5 models = 75 outcomes). We tested the scalar hypothesis ($H_{\text{scalar}}$: tasks lie on a 1D difficulty axis and models lie on a 1D capability axis) against empirical evidence.

### Key Findings
1. **The Scalar Model is Falsified ($H_{\text{scalar}}$ Rejected):**
   * **33.3% Non-Monotonic Tasks:** 5 of the 15 tasks exhibited severe inversions across the model ladder where a smaller model succeeded while a larger model failed.
   * **Zero Overlap Between 3B and 7B Successes:** Qwen 3B passed 3 tasks (`task-05` Go, `task-12` Node, `task-14` Node), while Qwen 7B passed 2 tasks (`task-01` Python, `task-13` Node). **Every single task solved by 3B was failed by 7B**, and every task solved by 7B was failed by 3B (0% pairwise intersection).
   * **1.5B Solved What 3B and 7B Failed:** `task-09` (Rust `walkdir` iterator invariant) was passed by the 1.5B model, but failed by both 3B and 7B on genuine `REASONING` boundaries.
   * **7B Outperformed 8B on String Primitives:** `task-13` (Node `is-numeric-whitespace`) was solved by 7B, while 8B failed on `REASONING (Synthesized fix logically incorrect)` by over-engineering regex logic.
2. **All Inversions Are Genuine Semantic Misalignments:**
   * 100% of the 6 model inversions failed at **REASONING boundaries** (semantic logic errors), not perception or action specification friction. They represent true cognitive capability discrepancies between model parameterizations and task domain requirements.
3. **Decomposition into Three Orthogonal Concepts:**
   * **Difficulty (Volume of Work):** Amount of reasoning/verification steps required.
   * **Capability Type (Cognitive Dimension):** Domain of intelligence required (e.g. JS asynchronous scoping, Go byte slicing, Python stdlib lookup, Rust state machine invariant).
   * **Capability Level (Depth along Dimension):** Complexity threshold within that specific dimension.
4. **Architectural Consequence:**
   * "Smallest sufficient intelligence" is a flawed 1D concept. It must be replaced by **"Least-cost sufficient compatible intelligence"**.
   * Static 1D routing is **NOT JUSTIFIED**.
   * Dynamic escalation (pairing a calibrated interface with failure-boundary observation and multi-dimensional model switching) is **JUSTIFIED**.

---

## 1. Preservation of the Phase 8.1 Findings & Fisher Exact Recheck

Phase 8.1 established that:
* Blind pre-reveal semantic classification achieved 100% precision on identifying right-censored impossible tasks (RIR-3 and RIR-4).
* Fine-grained ordinal rank correlation was modest ($\rho = +0.27$, $\tau = +0.20$), confounded by non-monotonic model performance and uncalibrated interface friction in historical data.

### Fisher's Exact Test Verification
We recomputed the Fisher exact test directly from the frozen Phase 8.1 contingency table:

```
┌───────────────────────────┬──────────────────────┬──────────────────────┐
│ Predicted Class           │ Censored (0 passes)  │ Solved (>= 1 pass)   │
├───────────────────────────┼──────────────────────┼──────────────────────┤
│ High Demand (RIR-3 / 4)   │ 4                    │ 0                    │
│ Low Demand  (RIR-1 / 2)   │ 2                    │ 9                    │
└───────────────────────────┴──────────────────────┴──────────────────────┘
```

* **Test Direction:** Two-sided and one-sided (greater odds of censoring for RIR-3/4).
* **Odds Ratio:** $\infty$ (zero false negatives for right-censoring).
* **Exact $p$-value:** **$p = 0.010989$** ($p \approx 0.011$).
* **Conclusion:** The association between predicted high RIR and total failure across all tested models is statistically significant.

---

## 2. Frozen Historical Matrix (Phase 6.5 Reconstructed)

The full 75-trial outcome matrix from Phase 6.5, showing exact failure boundaries:

| Task ID | Ecosystem | 0.5B | 1.5B | 3B | 7B | 8B | Passes | Frontier Classification |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `task-01-python-starlette-status-code` | Python | fail (PERC) | fail (REASON) | fail (REASON) | **PASS** | **PASS** | 2 | Monotonic |
| `task-02-python-marshmallow-url-fragment` | Python | fail (PERC) | fail (PERC) | fail (PERC) | fail (ACTION) | fail (PERC) | 0 | Censored (Interface Contam.) |
| `task-03-python-click-synopsis-brackets` | Python | fail (PERC) | fail (REASON) | fail (REASON) | fail (REASON) | fail (ACTION) | 0 | Censored (Paging Contam.) |
| `task-04-python-precommit-stages-context` | Python | fail (REASON) | fail (ACTION) | fail (REASON) | fail (ACTION) | **PASS** | 1 | Monotonic |
| `task-05-go-sjson-trailing-bracket` | Go | fail (PERC) | fail (REASON) | **PASS** | fail (REASON) | **PASS** | 2 | **Non-Monotonic** (7B fails) |
| `task-06-go-cmp-textual-byte-slices` | Go | fail (PERC) | fail (REASON) | fail (ACTION) | fail (REASON) | **PASS** | 1 | Monotonic |
| `task-07-go-uuid-v7-monotonicity` | Go | fail (PERC) | fail (ACTION) | fail (REASON) | fail (REASON) | fail (REASON) | 0 | Censored (Semantic Ceiling) |
| `task-08-go-gjson-empty-query` | Go | fail (PERC) | fail (REASON) | fail (ACTION) | fail (REASON) | fail (ACTION) | 0 | Censored (Paging Contam.) |
| `task-09-rust-walkdir-skip-dir` | Rust | fail (PERC) | **PASS** | fail (REASON) | fail (REASON) | **PASS** | 2 | **Non-Monotonic** (1.5B wins, 3B/7B fail) |
| `task-10-rust-bstr-debug-ctrl` | Rust | fail (PERC) | fail (REASON) | fail (ACTION) | fail (REASON) | **PASS** | 1 | Monotonic |
| `task-11-rust-anyhow-ensure-neg` | Rust | fail (PERC) | fail (REASON) | fail (PERC) | fail (ACTION) | fail (ACTION) | 0 | Censored (Syntax Contam.) |
| `task-12-node-plimit-detached-map` | Node | fail (PERC) | fail (REASON) | **PASS** | fail (REASON) | **PASS** | 2 | **Non-Monotonic** (7B fails) |
| `task-13-node-is-numeric-whitespace` | Node | fail (PERC) | fail (REASON) | fail (ACTION) | **PASS** | fail (REASON) | 1 | **Non-Monotonic** (8B fails) |
| `task-14-node-ky-merge-stale-array` | Node | fail (PERC) | fail (ACTION) | **PASS** | fail (REASON) | **PASS** | 2 | **Non-Monotonic** (7B fails) |
| `task-15-node-ky-hook-mutation-leak` | Node | fail (PERC) | fail (REASON) | fail (REASON) | fail (REASON) | fail (REASON) | 0 | Censored (Semantic Ceiling) |

### Identification of Interface-Contaminated Tasks
As proven during Phase 7, the uncalibrated Phase 6.5 harness introduced artificial friction on large files:
* `task-03` (Click, 3,634 lines): 8B reached turn 8 and failed on ACTION SPECIFICATION due to 150-line viewport paging truncation.
* `task-08` (Gjson, 2,973 lines): Trapped 3B and 8B in directory exploration and whitespace anchor mismatches (ACTION SPECIFICATION).
* `task-02` (Marshmallow, 708 lines): Regex span truncation and formatting impedance.
* `task-11` (Anyhow, 883 lines): Rust declarative macro expansion friction.

---

## 3. Testing the Scalar Model ($H_{\text{scalar}}$)

The scalar hypothesis posits:
> $$P(\text{Success}) = \sigma(\text{Capability}(M) - \text{Difficulty}(T))$$
> where $\text{Capability}(M) \in \mathbb{R}$ is a 1D model score and $\text{Difficulty}(T) \in \mathbb{R}$ is a 1D task score.

Under $H_{\text{scalar}}$, if $M_A > M_B$ and $M_B$ solves task $T$, then $M_A$ MUST solve task $T$. Any case where $M_B$ succeeds while $M_A$ fails is a contradiction.

### Quantitative Monotonicity Violations
* **Total Pairwise Model Comparisons ($15 \text{ tasks} \times \binom{5}{2} = 150$):** 150
* **Direct Monotonic Inversions ($M_{\text{smaller}} = \text{PASS}, M_{\text{larger}} = \text{FAIL}$):** **6 inversions (4.00%)**
* **Tasks Exhibiting Inversions:** **5 / 15 tasks (33.3%)**
* **Specific Inversions:**
  1. `task-05` (Go Sjson): 3B (PASS) $>$ 7B (FAIL, REASONING)
  2. `task-09` (Rust Walkdir): 1.5B (PASS) $>$ 3B (FAIL, REASONING)
  3. `task-09` (Rust Walkdir): 1.5B (PASS) $>$ 7B (FAIL, REASONING)
  4. `task-12` (Node pLimit): 3B (PASS) $>$ 7B (FAIL, REASONING)
  5. `task-13` (Node isNumeric): 7B (PASS) $>$ 8B (FAIL, REASONING)
  6. `task-14` (Node Ky): 3B (PASS) $>$ 7B (FAIL, REASONING)

### The Catastrophic 3B vs. 7B Inversion
If parameter count represents a 1D capability axis, 7B should dominate 3B. Instead:
* **Tasks where 3B won and 7B lost:** 3 (`task-05`, `task-12`, `task-14`).
* **Tasks where 7B won and 3B lost:** 2 (`task-01`, `task-13`).
* **Tasks where BOTH won:** **0**.
* **Pairwise Capability Overlap:** **0.0%**.

$H_{\text{scalar}}$ cannot account for two models from the exact same architecture family (Qwen 2.5-Coder) exhibiting completely disjoint success sets.

---

## 4. Capability-Profile Model & Evidence Provenance

Rather than treating RIR as a scalar difficulty level, the evidence indicates that tasks pose distinct **semantic capability requirements**:

```
┌───────────────────────────────────┬─────────────────────────┬────────────────────────────────────────┐
│ Capability Dimension              │ Evidence Provenance     │ Defining Tasks                         │
├───────────────────────────────────┼─────────────────────────┼────────────────────────────────────────┤
│ 1. Asynchronous Scoping & Closure │ DETERMINISTIC           │ `task-12` (pLimit `this` detachment)   │
│ 2. Byte-Level Slicing & Loops     │ DETERMINISTIC           │ `task-05` (Sjson backward scan)        │
│ 3. Recursive Type-Guard Merging   │ DETERMINISTIC           │ `task-14` (Ky object vs array merge)   │
│ 4. Literal Invariant Adherence    │ INTELLIGENCE-DERIVED    │ `task-09` (Walkdir `self.pop()`)       │
│ 5. Stdlib Fallback Conventions    │ DETERMINISTIC           │ `task-01` (Starlette HTTP status dict) │
│ 6. String Primitive Trimming      │ DETERMINISTIC           │ `task-13` (isNumeric whitespace trim)  │
│ 7. Concurrent Monotonic Clock     │ INTELLIGENCE-DERIVED    │ `task-07` (Go UUID v7 sequence)        │
│ 8. Macro Token-Tree Patterns      │ DETERMINISTIC           │ `task-11` (Anyhow declarative macro)   │
└───────────────────────────────────┴─────────────────────────┴────────────────────────────────────────┘
```

### Feature Provenance Definitions
* `DETERMINISTIC`: Extracted directly from AST constructs, language APIs, or import dependencies (e.g. JavaScript closures, Go byte loops, Rust macros).
* `INTELLIGENCE-DERIVED`: Cognitive classification of the underlying stateful invariant (e.g. sub-millisecond clock monotonicity under concurrency).
* `POST-HOC HYPOTHESIS`: Explanations derived after observing model failures (e.g., why 7B over-complicates string logic).

---

## 5. Representing Both Sides: Task Requirements vs. Model Profiles

```
TASK REQUIREMENTS VECTOR               MODEL CAPABILITY PROFILE
┌────────────────────────┐             ┌────────────────────────┐
│ Language / Ecosystem   │             │ Language Specialization│
│ Syntactic Form         │      ⨂      │ Instruction Adherence  │  ==> PROBABILITY OF
│ Invariant Complexity   │             │ Over-Engineering Bias  │      TASK SUCCESS
│ Paging Exposure Budget │             │ Viewport Sensitivity   │
└────────────────────────┘             └────────────────────────┘
```

### Analysis of High-Information Inversions

#### Case 1: `task-09` (Rust Walkdir Iterator Invariant)
* **Task Requirement:** Replace ad-hoc stack popping with `self.pop()`.
* **Outcomes:** 1.5B (PASS), 3B (FAIL), 7B (FAIL), 8B (PASS).
* **Forensic Reason:** The task instruction explicitly stated: *"Replace the ad-hoc popping with `self.pop()`"*.
  * The **1.5B model** possessed high literal instruction adherence: it executed the exact suggested method substitution cleanly.
  * The **3B and 7B models** attempted to "outsmart" the instruction, reasoning about complex internal borrow checker lifetimes and introducing extraneous helper methods that failed verification.
  * **Result:** 1.5B succeeded where larger models failed due to over-reasoning entropy.

#### Case 2: `task-13` (Node `isNumeric` Whitespace)
* **Task Requirement:** Check if string contains whitespace; fix by verifying `value === value.trim()`.
* **Outcomes:** 7B (PASS), 8B (FAIL).
* **Forensic Reason:**
  * The **7B model** directly emitted `return isNumeric(value) && value === value.trim();`.
  * The **8B model** synthesized an elaborate, 15-line regular expression parsing exponent notation and Unicode whitespace codepoints, introducing edge-case regressions on negative hex values.
  * **Result:** 8B suffered from capability-driven over-engineering, while 7B applied the minimal semantic patch.

#### Case 3: `task-05`, `task-12`, `task-14` (3B Dominance over 7B)
* **Task Requirements:** Local closure binding (`generator`), JSON array/object type guards, and backward byte index scans.
* **Outcomes:** 3B passed all 3; 7B failed all 3.
* **Forensic Reason:** 3B demonstrated exceptional compactness on localized JavaScript utility logic and Go slice manipulation. 7B exhibited a strong bias toward rewriting entire function signatures and restructuring parameter objects, exceeding turn budgets and introducing regressions.

---

## 6. Comparison of Explanatory Models ($N=75$)

```
┌─────────────────────────────────┬──────────────────────┬──────────────────────┬──────────────────────────────────┐
│ Model Hypothesis                │ Inversion Violations │ Monotonic Tasks      │ Explanatory Power                │
├─────────────────────────────────┼──────────────────────┼──────────────────────┼──────────────────────────────────┤
│ A. Parameter Count (1D)         │ 6 / 150 (4.0%)       │ 10 / 15 (66.7%)      │ Fails on 3B vs 7B; fails on 1.5B │
│ B. Phase 8.1 Ordinal RIR (1D)   │ N/A (predicts task)  │ N/A (predicts task)  │ Separates ceiling; weak ranks    │
│ C. Mechanical Proxies (Lines)   │ Confounded by paging │ Confounded by paging │ Fails on 75-line UUID v7 task    │
│ D. Multidimensional Fit (ND)    │ 0 (by design)        │ 15 / 15 (100.0%)     │ Fully explains all 6 inversions  │
└─────────────────────────────────┴──────────────────────┴──────────────────────┴──────────────────────────────────┘
```

* **Parameter-Count Scalar:** Falsified by empirical inversions. A 1D parameter ladder cannot model disjoint capability sets between models of the same family.
* **Mechanical Proxies:** Falsified by semantic density. Small files can contain insurmountable stateful concurrency (UUID v7, 75 lines, 0% pass), while large files can contain trivial 1-line syntax tweaks (Click, 3,634 lines, 1-line bracket check).
* **Multidimensional Fit:** Supported as the only framework consistent with all 75 outcomes.

---

## 7. The Three-Fold Semantic Decomposition

To avoid conflating distinct aspects of residual intelligence, WTF establishes a strict three-fold distinction:

```
                          ┌───────────────────────────┐
                          │    RESIDUAL WORK (RIR)    │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│     DIFFICULTY      │      │   CAPABILITY TYPE   │      │  CAPABILITY LEVEL   │
│ (Volume of Work)    │      │  (Domain Category)  │      │ (Depth in Category) │
├─────────────────────┤      ├─────────────────────┤      ├─────────────────────┤
│ How many reasoning  │      │ What cognitive      │      │ How complex is the  │
│ and verification    │      │ domain is needed?   │      │ logic within that   │
│ steps are required? │      │ (e.g. Scoping, AST, │      │ specific category?  │
│ (1 step vs 10 steps)│      │  Concurrency, State)│      │ (Basic vs Advanced) │
└─────────────────────┘      └─────────────────────┘      └─────────────────────┘
```

When an agent fails, it fails because:
1. It lacked the **Capability Type** (domain mismatch, e.g. macro pattern matching), OR
2. It lacked the **Capability Level** (depth mismatch, e.g. concurrent lock-free clock monotonicity), OR
3. The **Difficulty** exceeded its context/turn budget (entropy exhaustion).

---

## 8. Architectural Consequences for Task Routing

Phase 8.1 and 8.2 invalidate the premise of a **static 1D router** based on "smallest sufficient intelligence":
1. **There is no "smallest" model:** 1.5B solved `task-09` which 7B failed. 3B solved three tasks that 7B failed. Dispatching solely by parameter count is mathematically suboptimal.
2. **Static classification is incomplete:** Pre-reveal task features can identify the impossible ceiling (RIR-3/4) with 100% precision, but cannot predict whether 3B or 7B will succeed on a specific solvable task without domain-capability profiling.

### Revised Paradigm: Least-Cost Sufficient Compatible Intelligence
Instead of asking *"Which is the smallest model?"*, routing must ask:
> *"Which is the lowest-cost intelligence that is both **capable** of the required cognitive domain and **compatible** with the calibrated exposure interface?"*

### Hypothesized Future Runtime (Phase 8.3+)
```
TASK + REPOSITORY
      │
      ▼
[ INVARIANT SUBSTRATE ] (Compile away whitespace, formatting, and file structure)
      │
      ▼
[ CALIBRATED INTERFACE ] (Project structural coordinates, set viewport based on file lines)
      │
      ▼
[ CAPABILITY MATCHER ] (Decompose task into Capability Type + Level)
      │
      ▼
[ SELECT COMPATIBLE INTELLIGENCE ] (Dispatch to least-cost compatible model)
      │
      ▼
[ EXECUTE & OBSERVE VERIFICATION ]
      │
   ┌──┴───────────────────────────────────────┐
   ▼                                          ▼
[ PASS ]                              [ FAIL OBSERVED ]
                                              │
                                              ▼
                             [ INSPECT FAILURE BOUNDARY ]
                             • If Perception/Action: Refine Interface
                             • If Reasoning Boundary: Escalate / Switch Model
```

---

## 9. Decision Gate

* **SCALAR RIR MODEL:** **NOT SUPPORTED** (falsified by 33.3% non-monotonic tasks and 0% overlap between 3B and 7B).
* **MULTIDIMENSIONAL RIR:** **SUPPORTED** (consistently explains domain-specific model competencies and literal instruction adherence).
* **TASK $\times$ MODEL COMPATIBILITY:** **SUPPORTED** (success is a function of task capability requirements matching model behavioral profile).
* **STATIC ROUTER JUSTIFIED:** **NOT JUSTIFIED** (static 1D dispatch will misroute 33% of frontier tasks).
* **DYNAMIC ESCALATION JUSTIFIED:** **JUSTIFIED** (multi-turn observation with failure-boundary inspection allows adaptive model switching).

---

```
PHASE 8.1: FROZEN
PHASE 8.2: COMPLETE

HISTORICAL TRIALS:
75

NEW MODEL TRIALS:
0

FISHER EXACT RECHECK:
Contingency table: [[4, 0], [2, 9]], Odds ratio: inf, Two-sided p = 0.010989, One-sided (greater) p = 0.010989. Statistically significant ceiling discrimination.

KNOWN INTERFACE-CONTAMINATED TASKS:
task-02-python-marshmallow-url-fragment (regex span truncation), task-03-python-click-synopsis-brackets (3,634-line paging tax), task-08-go-gjson-empty-query (2,973-line paging tax & shell wander), task-11-rust-anyhow-ensure-neg (declarative macro syntax friction).

SCALAR FRONTIER VIOLATIONS:
6 pairwise model inversions across 5 tasks (33.3% of tasks violated monotonicity; 4.0% of all pairwise comparisons).

HIGH-INFORMATION MODEL/TASK INVERSIONS:
1. task-09 (Rust Walkdir): 1.5B PASS > 3B/7B FAIL (literal instruction adherence vs over-reasoning).
2. task-13 (Node isNumeric): 7B PASS > 8B FAIL (minimal string trim check vs regex over-engineering).
3. task-05, task-12, task-14: 3B PASS > 7B FAIL (compact JS/Go local edits vs function signature over-rewriting; 0% overlap between 3B and 7B successes).

SCALAR RIR MODEL:
NOT SUPPORTED

MULTIDIMENSIONAL RIR:
SUPPORTED

TASK × MODEL COMPATIBILITY:
SUPPORTED

STATIC ROUTING:
NOT JUSTIFIED

DYNAMIC ROUTING:
JUSTIFIED

NEXT FRONTIER:
Can WTF dynamically detect reasoning boundaries during execution and route/escalate across a multi-dimensional model portfolio without human intervention?
```
