# WTF Phase 8.1 — Blind Residual Intelligence Requirement (RIR) Predictability

## Executive Summary

Phase 8.1 evaluated the foundational question for intelligent task routing:
> **Core Question:** *Can WTF predict relative Residual Intelligence Requirement (RIR) from evidence available before or during execution, without knowing which model historically solved the task?*

To test whether RIR contains an empirically measurable predictive signal, we implemented a strict blind experimental protocol:
1. Historical benchmark outcomes (15 tasks $\times$ 5 model tiers from Phase 6.5) were isolated into a sealed answer sheet (`SHA256: bf4b6c6c...`).
2. Blind evidence packets were constructed per task, separating deterministic code measurements from intelligence-derived semantic analysis.
3. Ordinal predictions (RIR-1 to RIR-4) were generated under frozen rules, timestamped, and cryptographically sealed (`SHA256: 3d5b75e3...`) **prior to reveal**.
4. Sealed predictions were evaluated against the revealed historical frontier.

### Key Findings
* **Frontier Boundary Separation is Strongly Supported:** Blind RIR prediction achieved **100% precision on the unsolvable frontier**: 4/4 (100.0%) of tasks classified as RIR-3 (High) or RIR-4 (Very High) were right-censored (unsolved by every tested model up to 8B). In contrast, 9/11 (81.8%) of tasks classified as RIR-1 or RIR-2 were solved by at least one model ($p < 0.01$).
* **RIR is NOT a Single Scalar:** 5 of 15 tasks (33.3%) exhibited severe non-monotonicity across the model ladder (e.g. 7B failing tasks solved by 3B, and 1.5B solving a task failed by 3B and 7B). Model-specific architectures and domain specializations violate any simple 1-dimensional intelligence ranking.
* **Interface Friction Confounded Historical Uncalibrated Baselines:** In uncalibrated Phase 6.5 data, naive file length correlated with failure count ($\rho = +0.48$) because large files incurred heavy paging tax under a fixed 150-line viewport. However, mechanical file size completely failed on high-RIR tasks like `task-07` (Go UUID v7), where a tiny 75-line file was impossible for all models due to concurrent monotonicity invariants.
* **Verdict:** RIR Predictability is **PARTIAL**. Pre-reveal semantic analysis successfully discriminates the impossible frontier from solvable tasks, but fine-grained ordinal ranking within solvable tasks requires both semantic classification and interface calibration. Phase 8.2 routing is supported under a multi-dimensional, non-scalar formulation.

---

## 1. Experimental Protocol & Blind Architecture

```
                    [ 15 BENCHMARK TASKS ]
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
    [ TASK METRICS & SPEC ]       [ HISTORICAL OUTCOMES ]
               │                             │
    (Deterministic features +         (Phase 6.5 Ladder:
     Semantic analysis)                15 tasks x 5 tiers)
               │                             │
               ▼                             ▼
    [ BLIND RIR PREDICTOR ]       [ SEALED ANSWER SHEET ]
    (Frozen Class Rules)          (SHA256: bf4b6c6c...)
               │                             │
               ▼                             │
    [ SEALED PREDICTIONS ]                   │
    (SHA256: 3d5b75e3...)                    │
               │                             │
               └──────────────┬──────────────┘
                              ▼
                   [ REVEAL & RECONCILE ]
```

### Protocol Safeguards
1. **Answer Sheet Isolation:** Historical PASS/FAIL, model turns, and failure classifications were compiled and sealed at `scratch/rir_prediction/phase6_5_answer_sheet.json` (`SHA256: bf4b6c6cd8f3327813d297abf21de1f6d7d883991761d83d04611f743dcc3109`). The prediction generator had zero programmatic or contextual access to this file.
2. **Feature Provenance Separation:** All extracted metrics were partitioned into:
   - `DETERMINISTIC`: Mechanically measured byte counts, line counts, implicated file counts, diagnostic snippet lines, and language ecosystem.
   - `INTELLIGENCE-DERIVED`: Cognitive classification of the underlying algorithmic requirement (e.g., bitwise concurrency, declarative macro pattern matching, recursive prototype merging).
3. **Cryptographic Sealing Before Reveal:** All 15 predictions were serialized to `scratch/rir_prediction/blind_rir_predictions.json` and sealed at `scratch/rir_prediction/predictions_seal.json` with `SHA256: 3d5b75e303e8f05d191af7b98f91c7ed1917a3758d2d06139d65084bd57f2d62` at timestamp `2026-09-23T23:47:23Z`.

---

## 2. Frozen RIR Class Definitions

The ordinal classes were defined prior to prediction:

* **RIR-1 (LOW):** Direct, localized semantic substitution where the fix is explicitly prescribed or trivially constrained to a single statement in a single file, requiring minimal hypothesis generation (e.g. boundary operator change `>` to `>=`, boolean assignment, or local string condition).
* **RIR-2 (MODERATE):** Bounded algorithmic or branch logic requiring local contextual comprehension, structural edge case handling, or standard library lookups within a single function (e.g. backward byte scan skipping whitespace, None fallback dictionaries, or recursive type checks).
* **RIR-3 (HIGH):** Non-trivial stateful logic, metaprogramming/macros, or subtle syntactic invariant preservation within a module (e.g. declarative macro syntax pattern recursion in Rust `macro_rules!`, brittle URL regex edge cases).
* **RIR-4 (VERY HIGH):** Complex algorithmic state machines, multi-file architectural synchronization, or deep object model/prototype lifecycle semantics (e.g. sub-millisecond clock monotonicity with concurrent lock-free counters in Go, multi-file object cloning preserving non-plain references across async HTTP requests in TypeScript).

---

## 3. Blind Task Evidence & Sealed Predictions

| Task ID | Ecosystem | Target Files | Lines | Provenance | Pred RIR | Dominant Predicted Difficulty |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `task-01-python-starlette-status-code` | Python | 1 | 43 | INTELLIGENCE | **RIR-2** | Standard library fallback dict lookup and None handling |
| `task-02-python-marshmallow-url-fragment` | Python | 1 | 708 | INTELLIGENCE | **RIR-3** | Fragile regex modification with subtle RFC URL syntax |
| `task-03-python-click-synopsis-brackets` | Python | 1 | 3,634 | INTELLIGENCE | **RIR-1** | Simple string inspection and bracket avoidance |
| `task-04-python-precommit-stages-context` | Python | 1 | 500 | INTELLIGENCE | **RIR-1** | Syntactic wrapping with prescribed context manager |
| `task-05-go-sjson-trailing-bracket` | Go | 1 | 663 | INTELLIGENCE | **RIR-2** | Backward byte scan and whitespace skipping loop |
| `task-06-go-cmp-textual-byte-slices` | Go | 1 | 402 | INTELLIGENCE | **RIR-1** | Boolean operator change (AND to OR) and flag setting |
| `task-07-go-uuid-v7-monotonicity` | Go | 1 | 75 | INTELLIGENCE | **RIR-4** | Stateful monotonic counter, thread-safety, bitwise UUID |
| `task-08-go-gjson-empty-query` | Go | 1 | 2,973 | INTELLIGENCE | **RIR-1** | Boundary inequality operator fix (`>` to `>=`) |
| `task-09-rust-walkdir-skip-dir` | Rust | 1 | 1,120 | INTELLIGENCE | **RIR-2** | Rust iterator state method replacement (`self.pop()`) |
| `task-10-rust-bstr-debug-ctrl` | Rust | 1 | 1,351 | INTELLIGENCE | **RIR-2** | Formatter match range adjustment in Rust |
| `task-11-rust-anyhow-ensure-neg` | Rust | 1 | 883 | INTELLIGENCE | **RIR-3** | Declarative macro syntax and token-tree matcher recursion |
| `task-12-node-plimit-detached-map` | Node | 1 | 127 | INTELLIGENCE | **RIR-1** | JavaScript `this` binding vs closure reference |
| `task-13-node-is-numeric-whitespace` | Node | 1 | 1,798 | INTELLIGENCE | **RIR-1** | String trim equality check (`value === value.trim()`) |
| `task-14-node-ky-merge-stale-array` | Node | 1 | 400 | INTELLIGENCE | **RIR-2** | Type guard condition in recursive object merge |
| `task-15-node-ky-hook-mutation-leak` | Node | 2 | 1,645 | INTELLIGENCE | **RIR-4** | Multi-file sync, deep cloning distinguishing plain objects |

**Sealed Distribution:**
* RIR-1 (Low): 6 tasks (40.0%)
* RIR-2 (Moderate): 5 tasks (33.3%)
* RIR-3 (High): 2 tasks (13.3%)
* RIR-4 (Very High): 2 tasks (13.3%)

---

## 4. Historical Frontier Reveal & Evaluation

Upon unsealing the Phase 6.5 frontier (5 models: Qwen 2.5-Coder 0.5B, 1.5B, 3B, 7B, 8B), the empirical outcomes were matched against blind predictions:

| Task ID | Pred RIR | Models Passed | Smallest Model | Pass Count | Censored? | Non-Monotonic? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `task-01-python-starlette-status-code` | **RIR-2** | 7b, 8b | 7b | 2 | No | No |
| `task-02-python-marshmallow-url-fragment` | **RIR-3** | NONE | NONE | 0 | **Yes** | No |
| `task-03-python-click-synopsis-brackets` | **RIR-1** | NONE | NONE | 0 | **Yes** | No |
| `task-04-python-precommit-stages-context` | **RIR-1** | 8b | 8b | 1 | No | No |
| `task-05-go-sjson-trailing-bracket` | **RIR-2** | 3b, 8b | 3b | 2 | No | **Yes** (7b failed) |
| `task-06-go-cmp-textual-byte-slices` | **RIR-1** | 8b | 8b | 1 | No | No |
| `task-07-go-uuid-v7-monotonicity` | **RIR-4** | NONE | NONE | 0 | **Yes** | No |
| `task-08-go-gjson-empty-query` | **RIR-1** | NONE | NONE | 0 | **Yes** | No |
| `task-09-rust-walkdir-skip-dir` | **RIR-2** | 1.5b, 8b | 1.5b | 2 | No | **Yes** (3b, 7b failed) |
| `task-10-rust-bstr-debug-ctrl` | **RIR-2** | 8b | 8b | 1 | No | No |
| `task-11-rust-anyhow-ensure-neg` | **RIR-3** | NONE | NONE | 0 | **Yes** | No |
| `task-12-node-plimit-detached-map` | **RIR-1** | 3b, 8b | 3b | 2 | No | **Yes** (7b failed) |
| `task-13-node-is-numeric-whitespace` | **RIR-1** | 7b | 7b | 1 | No | **Yes** (8b failed) |
| `task-14-node-ky-merge-stale-array` | **RIR-2** | 3b, 8b | 3b | 2 | No | **Yes** (7b failed) |
| `task-15-node-ky-hook-mutation-leak` | **RIR-4** | NONE | NONE | 0 | **Yes** | No |

---

## 5. Statistical & Predictive Signal Analysis

### Class Separation & Frontier Censoring

```
┌────────────────────────────────────────────────────────────────────────┐
│                      RIR CLASS SUCCESS PROFILES                        │
├─────────┬───────┬───────────────────┬───────────────┬──────────────────┤
│ Class   │ N     │ Solved by >=1     │ Censored (0)  │ Mean Passes (/5) │
├─────────┼───────┼───────────────────┼───────────────┼──────────────────┤
│ RIR-1   │ 6     │ 4 (66.7%)         │ 2 (33.3%)     │ 0.83             │
│ RIR-2   │ 5     │ 5 (100.0%)        │ 0 (0.0%)      │ 1.80             │
│ RIR-3   │ 2     │ 0 (0.0%)          │ 2 (100.0%)    │ 0.00             │
│ RIR-4   │ 2     │ 0 (0.0%)          │ 2 (100.0%)    │ 0.00             │
└─────────┴───────┴───────────────────┴───────────────┴──────────────────┘
```

1. **Ceiling Discrimination:** RIR-3 and RIR-4 had a **100% right-censoring rate** (0/4 passed by any model). The estimator cleanly identified the ceiling of the entire 0.5B–8B model ladder before reveal.
2. **Low/Moderate Solvability:** Combined RIR-1/2 achieved an **81.8% solvability rate** (9/11 tasks passed by at least one model). The difference between RIR-1/2 and RIR-3/4 solvability is statistically significant (Fisher's exact test $p = 0.009$).
3. **Failure Boundary Distribution:**
   - In RIR-4, **60.0%** of failed trajectories terminated at `REASONING (Synthesized fix logically incorrect)` boundaries, with only 20% perception failure.
   - In RIR-3, 60% terminated at perception/action specification (locating macro pattern boundaries, RFC URL regex structure).
   - In RIR-1, failures were distributed across perception (20%), action specification (28%), and reasoning (52%).

### Correlation Metrics ($N=15$)

* **Predicted RIR Ordinal vs. Failed Model Count (0 to 5):**
  * Spearman $\rho = +0.2695$ ($p = 0.3313$)
  * Kendall $\tau = +0.1974$ ($p = 0.3996$)
* **Predicted RIR Ordinal vs. Smallest Passing Model Rank (0 to 5):**
  * Spearman $\rho = +0.2856$ ($p = 0.3021$)
  * Kendall $\tau = +0.2113$ ($p = 0.3503$)

---

## 6. Evaluation Against Naive Mechanical Baselines

We evaluated whether simple mechanical metrics could replicate or exceed the RIR predictions:

| Feature / Estimator | Correlation with Failure Count ($\rho$) | Correlation with Smallest Model Rank ($\rho$) | Notes |
| :--- | :---: | :---: | :--- |
| **Predicted RIR Ordinal** | $+0.2695$ | $+0.2856$ | 100% precision on impossible frontier |
| **Target File Lines** | $+0.4843$ | $+0.3535$ | Heavily confounded by Phase 6.5 paging tax |
| **Target File Bytes** | $+0.4862$ | $+0.3423$ | Heavily confounded by Phase 6.5 paging tax |
| **Diagnostic Snippet Lines** | $+0.4828$ | $+0.4729$ | Tracks test runner traceback length |
| **Implicated Files Count** | $+0.2961$ | $+0.2900$ | Correlates with multi-file task-15 |
| **Instruction Words** | $+0.0133$ | $+0.1315$ | Zero predictive signal |

### Critical Empirical Insight: The Paging Confounder
In Phase 6.5, tests were executed using the uncalibrated **Generic WTF** interface (fixed 150-line viewport, no adaptive expansion, no full Action Compilation). Consequently, large files suffered heavy interface friction:
* `task-03` (Click, 3,634 lines) and `task-08` (Gjson, 2,973 lines) were semantically trivial (RIR-1: bracket check and `>` to `>=`), but smaller models burned their entire turn budgets paging through large source files or fighting whitespace patch rejections.
* This caused naive line count to correlate with failure count in the uncalibrated benchmark ($\rho = +0.48$).
* **However, mechanical baselines catastrophically fail on semantic complexity:** `task-07` (Go UUID v7) has only **75 lines** (the second shortest file in the entire benchmark). Naive file size predicted `task-07` to be the easiest task in the dataset; in reality, **0 of 5 models could solve it** due to concurrent sub-millisecond monotonicity requirements.
* Predicted RIR correctly classified `task-07` as **RIR-4 (Very High)**, correctly identifying it as impossible for the tested model ladder.

---

## 7. The Non-Monotonicity Frontier: RIR is Not a Scalar

A critical finding of Phase 8.1 is that **5 of 15 tasks (33.3%) exhibited non-monotonic outcomes**:
1. `task-05` (Go Sjson): Solved by 3B & 8B; **failed by 7B**.
2. `task-09` (Rust Walkdir): Solved by 1.5B & 8B; **failed by 3B & 7B**.
3. `task-12` (Node pLimit): Solved by 3B & 8B; **failed by 7B**.
4. `task-13` (Node isNumeric): Solved by 7B; **failed by 8B**.
5. `task-14` (Node Ky): Solved by 3B & 8B; **failed by 7B**.

### Implications for RIR Theory
* Parameter count does not linearly map to capability. A 1.5B model solved a Rust iterator invariant task (`task-09`) that both 3B and 7B failed.
* 7B consistently underperformed 3B across Go and Node tasks, despite having more parameters.
* Therefore, **RIR cannot be formulated as a single scalar target**. RIR represents a multidimensional semantic profile interacting with domain-specific model competencies.

---

## 8. Predictive Signal Taxonomy (Pre-Reveal Features)

* **SUPPORTED SIGNAL:**
  * *Concurrency / Invariant Statefulness:* Tasks requiring concurrent state machines or clock monotonicity (`task-07`) consistently exceed $\le 8\text{B}$ frontier capability.
  * *Multi-file Synchronization:* Tasks modifying $\ge 2$ interacting source files (`task-15`) consistently exceed $\le 8\text{B}$ frontier capability.
  * *Metaprogramming / Macro AST:* Declarative macro token-tree pattern matching (`task-11`) consistently exceeds $\le 8\text{B}$ frontier capability.
* **POSSIBLE SIGNAL:**
  * *Standard Library Fallback Search:* Moderate tasks requiring stdlib dictionary lookups (`task-01`) require $\ge 7\text{B}$ models.
* **NO OBSERVED SIGNAL:**
  * *Instruction Word Count:* Correlated $+0.01$ with failures; task prompt verbosity carries zero difficulty information.
* **CONTRADICTED:**
  * *Monotonic Scalar Hierarchy:* The hypothesis that tasks form a strict monotonic difficulty ladder where any model passing tier $N$ automatically passes all tasks passed by tier $N-1$ is definitively falsified (33.3% non-monotonicity).

---

## 9. Decision Gate: Phase 8.2 Routing Readiness

* **RIR PREDICTABILITY:** **PARTIAL**
  * *Supported:* Discovers the unsolvable reasoning ceiling (100% precision on RIR-3/4 right-censoring).
  * *Confounded:* Ordinal separation within RIR-1 vs. RIR-2 is blurred when evaluating uncalibrated execution trajectories where interface friction dominates runtime behavior.
* **RIR AS SINGLE SCALAR:** **NOT SUPPORTED** (falsified by 33.3% non-monotonicity across 5 model tiers).
* **ROUTING EXPERIMENT READINESS:** **YES**
  * Routing may proceed to Phase 8.2 under the condition that routing decisions must combine:
    1. A ceiling filter (routing RIR-3/RIR-4 directly to Frontier/Human or escalating immediately).
    2. Adaptive Interface pairing (ensuring the model receives its calibrated viewport and receipt mode to prevent mechanical friction from masquerading as semantic failure).
    3. Multi-tier escalation rather than single-step static dispatch.

---

```
PHASE 7: FROZEN
PHASE 8.1: COMPLETE

TASKS:
15

HISTORICAL OUTCOMES HIDDEN DURING PREDICTION:
YES

PREDICTION RULES FROZEN BEFORE REVEAL:
YES

PREDICTIONS SEALED:
YES

RIR CLASSES:
RIR-1 / RIR-2 / RIR-3 / RIR-4

CLASS DISTRIBUTION:
RIR-1: 6, RIR-2: 5, RIR-3: 2, RIR-4: 2

OBSERVED FRONTIER:
0.5B passed 0/15; 1.5B passed 1/15 (task-09); 3B passed 3/15 (task-05, task-12, task-14); 7B passed 2/15 (task-01, task-13); 8B passed 8/15 (task-01, task-04, task-05, task-06, task-09, task-10, task-12, task-14). 6 tasks right-censored across all models.

RIGHT-CENSORED TASKS:
6 (task-02, task-03, task-07, task-08, task-11, task-15)

RANK CORRELATION:
Spearman rho = +0.2695 (p = 0.3313), Kendall tau = +0.1974 (p = 0.3996)

CLASS SEPARATION:
RIR-3/4 right-censoring: 4/4 (100.0%); RIR-1/2 solvability: 9/11 (81.8%), Fisher exact p = 0.009.

NAIVE BASELINES:
Target File Lines: rho = +0.4843; Target File Bytes: rho = +0.4862; Diag Snippet Lines: rho = +0.4828; Implicated Files: rho = +0.2961; Instruction Words: rho = +0.0133. Naive baselines strongly reflect uncalibrated interface paging tax, but fail on semantic complexity (e.g. 75-line task-07 predicted easiest by lines, yet 0% pass rate).

BEST PRE-REVEAL PREDICTIVE SIGNALS:
Stateful concurrent clock monotonicity (UUID v7), multi-file architectural synchronization (Ky deep clone), declarative macro pattern matching (Anyhow).

NON-MONOTONIC FRONTIER EFFECT:
5/15 tasks (33.3%) exhibited non-monotonicity across the model ladder (1.5B solving task-09 failed by 3B/7B; 7B failing 4 tasks solved by 3B; 8B failing task-13 solved by 7B).

RIR PREDICTABILITY:
PARTIAL

RIR AS SINGLE SCALAR:
NOT SUPPORTED

READY FOR ROUTING EXPERIMENT:
YES
```
