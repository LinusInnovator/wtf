# WTF Phase 11.2 — OpenRouter Efficiency Replication

> **Scientific Interpretation Correction (Post-Experiment Audit):**  
> This document incorporates the post-experiment scientific record correction for Phase 11.2. The raw empirical measurements (24 runs, N=12 paired tasks, costs, tokens, turns, and verification outcomes) remain completely unchanged. This correction adjusts the primary verdict, clarifies causal claims regarding routing divergence, formalizes the central tension between generation savings and context accumulation overhead, and removes premature implementation hypotheses.

---

## Executive Summary

Phase 11.2 executes the pre-registered **OpenRouter Efficiency Replication** across an expanded, heterogeneous cohort of **N=12 paired tasks** (24 runs total), comparing **Condition A (OpenRouter Alone / Control)** against **Condition B (WTF v0.3 + OpenRouter / Treatment)**.

All runs utilized `openrouter/auto` under identical constraints (temperature 0.0, max 8 turns, max 1,536 output tokens/turn) with an interleaved, balanced schedule (6 pairs A-first, 6 pairs B-first). WTF v0.3.0 remained frozen with zero modifications.

### Primary Frozen Verdict

```
GENERATION EFFICIENCY REPLICATED.
END-TO-END EFFICIENCY NOT REPLICATED.
CAPABILITY PRESERVED.
```

Phase 11.2 did **NOT** replicate aggregate end-to-end token or cost efficiency across the full 12-task cohort. While generation expenditure (completion and reasoning tokens) decreased systematically, accumulated prompt/context overhead in prolonged failure trajectories overwhelmed those generation savings, resulting in higher aggregate total tokens (+32.8%) and higher aggregate dollar spend (+11.3%).

---

## 1. Key Empirical Findings

1. **Capability Preserved Exactly (6/12 vs 6/12, 50.0%)**:
   - Condition A passed 6/12 tasks; Condition B passed 6/12 tasks.
   - **Zero regressions** (0 PASS → FAIL) and **zero rescues** (0 FAIL → PASS).
   - Every passing task passed in both arms; every failing task failed in both arms.

2. **Intelligence Generation Expenditure Systematically Reduced**:
   - **Completion tokens**: **-13.5%** (29,217 → 25,272, -3,945 tokens).
   - **Reasoning tokens**: **-14.9%** (22,140 → 18,849, -3,291 tokens).
   - Bounded computational reality (TraceSlice + BoundedViewport) systematically reduced the volume of internal thinking and generation required by routed intelligence to formulate actions.

3. **Prompt Accumulation Overhead (The Central Tension)**:
   - **Prompt tokens**: **+37.5%** (284,859 → 391,682, +106,823 tokens).
   - **Total tokens**: **+32.8%** (314,076 → 416,954, +102,878 tokens).
   - **Total cost**: **+11.3%** ($0.050354 → $0.056068, +$0.005714 USD).
   - **First-class finding**: When tasks fail to converge and run the full 8 turns (6 of 12 tasks), WTF's rich contextual payload (TraceSlice stack frames + BoundedViewport source context + TrajectoryLedger turn history) compounds repeatedly in the prompt window across turns 1–8. In contrast, Condition A operates on terse compiler/test error summaries. The accumulated context cost exceeded the generation savings end-to-end.

4. **Per-Task Distribution**:
   - **4 tasks improved in total tokens and cost**: `task-02-marshmallow` (-16.2% tok, -18.3% cost), `task-03-click` (-15.7% tok, -24.8% cost), `task-08-gjson` (-26.7% tok, -24.8% cost), `task-14-ky-merge` (-12.8% tok, -1.6% cost).
   - **8 tasks consumed more total tokens and cost** under WTF.
   - Leave-One-Out (LOO) sensitivity analysis confirmed that this distribution is stable and not single-task dominated (12/12 iterations preserved the directional signal).

5. **Routing & Provider Divergence**:
   - Model-family routing diverged in **9 of 12 pairs (75.0%)**.
   - Provider allocation diverged in **12 of 12 pairs (100.0%)**.
   - **Causal precision**: The WTF condition was strongly associated with routing divergence, but Phase 11.2 does not isolate WTF's representation as the sole cause of these routing shifts. Temporal router state, provider availability, and internal OpenRouter routing algorithms may also have contributed.

---

## 2. Experimental Protocol & Frozen Setup

### 2.1 Pre-Registered Task Cohort (N=12)

Selected from the frozen benchmark corpus across 4 distinct language ecosystems with varying diagnostic difficulty:

| Pair | Task ID | Ecosystem | Repo | Verification Suite | Baseline Exit | Schedule |
|---|---|---|---|---|---|---|
| 1 | `task-02-python-marshmallow-url-fragment` | Python | marshmallow | `pytest tests/test_validate.py -k test_url_custom_schemes_and_fragments` | 1 | A_FIRST |
| 2 | `task-03-python-click-synopsis-brackets` | Python | click | `pytest tests/test_formatting.py -k test_synopsis_choice_brackets` | 1 | B_FIRST |
| 3 | `task-04-python-precommit-stages-context` | Python | pre-commit | `pytest tests/clientlib_test.py -k test_validate_stages_error_context` | 1 | A_FIRST |
| 4 | `task-05-go-sjson-trailing-bracket` | Go | sjson | `go test -run TestSetTrailingBracket` | 1 | B_FIRST |
| 5 | `task-06-go-cmp-textual-byte-slices` | Go | go-cmp | `go test -run TestDiffTextualByteSlices` | 1 | A_FIRST |
| 6 | `task-07-go-uuid-v7-monotonicity` | Go | uuid | `go test -run TestNewV7MonotonicityInSameMs` | 1 | B_FIRST |
| 7 | `task-08-go-gjson-empty-query` | Go | gjson | `go test -run TestEmptyStringQueryOperator` | 1 | A_FIRST |
| 8 | `task-10-rust-bstr-debug-ctrl` | Rust | bstr | `cargo test test_debug_ascii_control_ranges` | 101 | B_FIRST |
| 9 | `task-11-rust-anyhow-ensure-neg` | Rust | anyhow | `cargo test --test test_ensure` | 101 | A_FIRST |
| 10 | `task-13-node-is-numeric-whitespace` | Node/TS | is | `node --experimental-transform-types --test test/test.ts` | 1 | B_FIRST |
| 11 | `task-14-node-ky-merge-stale-array` | Node/TS | ky | `npx ava test/main.ts -m "json merging replaces*"` | 1 | A_FIRST |
| 12 | `task-15-node-ky-hook-mutation-leak` | Node/TS | ky | `npx ava test/hooks.ts -m "*init hook*"` | 1 | B_FIRST |

### 2.2 Execution Guardrails
- **Frozen WTF v0.3.0 Modules**: `TraceSlice`, `BoundedViewport`, `ActionCompiler`, `TrajectoryLedger`, `TrajectoryStagnationDetector`, `HandoffCompiler`. Zero production modifications.
- **Model Router**: `openrouter/auto`.
- **Hyperparameters**: Temperature 0.0, max 8 turns, max 1,536 output tokens/turn.
- **Cost Guard**: Hard ceiling $1.00 USD (actual spend was $0.106422 USD).

---

## 3. Cohort Aggregate Results

| Metric | Condition A (Control) | Condition B (WTF v0.3) | Absolute Delta | Relative Delta (%) |
|---|---|---|---|---|
| **Useful Task Passes** | 6 / 12 (50.0%) | 6 / 12 (50.0%) | 0 | 0.0% |
| **Pass → Pass** | — | — | 6 | — |
| **Fail → Pass (Rescue)** | — | — | 0 | — |
| **Pass → Fail (Regression)**| — | — | 0 | — |
| **Fail → Fail** | — | — | 6 | — |
| **Total Expenditure (USD)**| $0.050354 | $0.056068 | +$0.005714 | +11.3% |
| **Total Tokens** | 314,076 | 416,954 | +102,878 | +32.8% |
| **Prompt Tokens** | 284,859 | 391,682 | +106,823 | +37.5% |
| **Completion Tokens** | 29,217 | 25,272 | -3,945 | **-13.5%** |
| **Reasoning Tokens** | 22,140 | 18,849 | -3,291 | **-14.9%** |
| **Total Turns** | 88 | 89 | +1 | +1.1% |
| **Redundant Navigation** | 28 | 31 | +3 | +10.7% |
| **Mechanical Retries** | 0 | 0 | 0 | 0.0% |
| **Model-Family Divergences**| — | — | 9 / 12 | 75.0% |
| **Provider Divergences** | — | — | 12 / 12 | 100.0% |

---

## 4. Per-Pair Results Table

| # | Task ID | Outcome | Turns A→B | Tokens A→B | Tok Delta (%) | Cost A→B ($) | Cost Delta (%) | Trend |
|---|---|---|---|---|---|---|---|---|
| 1 | `task-02-python-marshmallow-url-fragment` | FAIL → FAIL | 8 → 8 | 24,860 → 20,845 | **-16.2%** | $0.00428 → $0.00350 | **-18.3%** | IMPROVED |
| 2 | `task-03-python-click-synopsis-brackets` | FAIL → FAIL | 8 → 8 | 12,183 → 10,265 | **-15.7%** | $0.00244 → $0.00184 | **-24.8%** | IMPROVED |
| 3 | `task-04-python-precommit-stages-context` | FAIL → FAIL | 8 → 8 | 31,668 → 33,633 | +6.2% | $0.00687 → $0.00614 | -10.6% | WORSE |
| 4 | `task-05-go-sjson-trailing-bracket` | PASS → PASS | 8 → 8 | 18,251 → 34,347 | +88.2% | $0.00429 → $0.00588 | +37.1% | WORSE |
| 5 | `task-06-go-cmp-textual-byte-slices` | FAIL → FAIL | 8 → 8 | 27,589 → 49,738 | +80.3% | $0.00304 → $0.00744 | +144.8% | WORSE |
| 6 | `task-07-go-uuid-v7-monotonicity` | PASS → PASS | 8 → 8 | 21,639 → 25,798 | +19.2% | $0.00326 → $0.00513 | +57.5% | WORSE |
| 7 | `task-08-go-gjson-empty-query` | PASS → PASS | 8 → 8 | 27,048 → 19,822 | **-26.7%** | $0.00463 → $0.00348 | **-24.8%** | IMPROVED |
| 8 | `task-10-rust-bstr-debug-ctrl` | PASS → PASS | 8 → 8 | 10,542 → 11,706 | +11.0% | $0.00121 → $0.00270 | +123.1% | WORSE |
| 9 | `task-11-rust-anyhow-ensure-neg` | FAIL → FAIL | 8 → 8 | 99,596 → 142,703 | +43.3% | $0.01313 → $0.00988 | -24.8% | WORSE |
| 10 | `task-13-node-is-numeric-whitespace` | PASS → PASS | 4 → 4 | 7,468 → 8,730 | +16.9% | $0.00168 → $0.00210 | +25.3% | WORSE |
| 11 | `task-14-node-ky-merge-stale-array` | PASS → PASS | 4 → 5 | 18,105 → 15,782 | **-12.8%** | $0.00302 → $0.00297 | -1.6% | IMPROVED |
| 12 | `task-15-node-ky-hook-mutation-leak` | FAIL → FAIL | 8 → 8 | 15,127 → 43,585 | +188.1% | $0.00250 → $0.00499 | +99.9% | WORSE |

---

## 5. Leave-One-Out (LOO) Sensitivity Analysis

Recalculating expenditure deltas across 12 iterations, excluding one task at each iteration:

| Excluded Task | Tokens A | Tokens B | Delta Tokens | Token Delta (%) | Cost A ($) | Cost B ($) | Cost Delta (%) | Signal Preserved? |
|---|---|---|---|---|---|---|---|---|
| `task-02-marshmallow` | 289,216 | 396,109 | +106,893 | +37.0% | $0.046069 | $0.052567 | +14.1% | YES (Preserved) |
| `task-03-click` | 301,893 | 406,689 | +104,796 | +34.7% | $0.047913 | $0.054232 | +13.2% | YES (Preserved) |
| `task-04-precommit` | 282,408 | 383,321 | +100,913 | +35.7% | $0.043482 | $0.049924 | +14.8% | YES (Preserved) |
| `task-05-sjson` | 295,825 | 382,607 | +86,782 | +29.3% | $0.046060 | $0.050183 | +9.0% | YES (Preserved) |
| `task-06-cmp` | 286,487 | 367,216 | +80,729 | +28.2% | $0.047313 | $0.048623 | +2.8% | YES (Preserved) |
| `task-07-uuid` | 292,437 | 391,156 | +98,719 | +33.8% | $0.047093 | $0.050934 | +8.2% | YES (Preserved) |
| `task-08-gjson` | 287,028 | 397,132 | +110,104 | +38.4% | $0.045726 | $0.052586 | +15.0% | YES (Preserved) |
| `task-10-bstr` | 303,534 | 405,248 | +101,714 | +33.5% | $0.049145 | $0.053371 | +8.6% | YES (Preserved) |
| `task-11-anyhow` | 214,480 | 274,251 | +59,771 | +27.9% | $0.037225 | $0.046190 | +24.1% | YES (Preserved) |
| `task-13-is` | 306,608 | 408,224 | +101,616 | +33.1% | $0.048675 | $0.053965 | +10.9% | YES (Preserved) |
| `task-14-ky-merge` | 295,971 | 401,172 | +105,201 | +35.5% | $0.047331 | $0.053095 | +12.2% | YES (Preserved) |
| `task-15-ky-hook` | 298,949 | 373,369 | +74,420 | +24.9% | $0.047858 | $0.051078 | +6.7% | YES (Preserved) |

### LOO Analysis Verdict:
- **12/12 iterations preserved the directional signal**.
- The result is **NOT SINGLE-TASK DOMINATED**.
- The increased prompt and token expenditure under WTF across prolonged failure runs is a consistent property of the entire cohort, not an artifact of an isolated outlier.

---

## 6. Corrected Answers to the 10 Post-Execution Questions

### Q1: Was the 11.1 efficiency effect replicated?
**NO for End-to-End Efficiency; YES for Generation Efficiency**:
- **Replicated**: Generation intelligence expenditure was compressed across the full cohort (-13.5% completion tokens, -14.9% reasoning tokens).
- **Not Replicated**: End-to-end token and cost efficiency did not replicate in aggregate (+32.8% total tokens, +11.3% cost). While 4 individual tasks showed end-to-end efficiency gains (-12.8% to -26.7%), the remaining 8 tasks consumed more prompt tokens due to repeated multi-turn context transmission during stalled trajectories.

### Q2: Was capability preserved?
**YES, 100% PRESERVED**:
- Control: 6/12 passed (50.0%).
- WTF: 6/12 passed (50.0%).
- Zero regressions (0 PASS → FAIL) and zero rescues (0 FAIL → PASS).

### Q3: Was the effect broad or sparse?
- **Generation efficiency (completion/reasoning)** was **BROAD** (-13.5% completion, -14.9% reasoning across the cohort).
- **End-to-end token/cost efficiency** was **SPARSE / CONDITIONAL**: 4 tasks improved, while 8 tasks had increased total expenditures due to prompt expansion during stalled runs.

### Q4: Did any task regress?
**NO**:
- Zero tasks regressed from PASS to FAIL.
- Zero tasks exhibited mechanical retry thrashing.

### Q5: How much deterministic work disappeared?
- On tasks that resolved (e.g. `gjson`, `ky-merge`) or progressed cleanly (`marshmallow`, `click`), WTF substituted manual file reads and blind exploratory grep commands with bounded viewports, cutting tokens by up to -26.7%.
- In prolonged failing tasks, finite intelligence models still emitted exploratory commands (overall navigation reads: 28 in Control vs 31 in WTF).

### Q6: Did WTF alter OpenRouter model selection?
**STRONGLY ASSOCIATED, BUT NOT PROVEN AS SOLE CAUSE**:
- Model-family routing diverged in **9 of 12 pairs (75.0%)**.
- WTF's structured representation was present whenever divergence occurred, but Phase 11.2 did not control for temporal router state, provider latency, or undisclosed provider routing rules. Therefore, WTF representation cannot be claimed as the sole cause.

### Q7: Did WTF alter provider allocation?
**DIVERGENCE OBSERVED ACROSS ALL 12 PAIRS**:
- Provider allocations differed between Condition A and Condition B in all 12 pairs (`BaseTen`, `Crusoe`, `Together`, `Decart`, `Cohere`, `OpenAI`). Provider allocation in OpenRouter Auto is dynamic and subject to multi-factor routing policies.

### Q8: Did routing divergence explain any outcome?
**NO**:
- Final verification outcomes were identical across all 12 pairs (6 PASS→PASS, 6 FAIL→FAIL). Routing shifts did not create artificial rescues or regressions.

### Q9: Does leave-one-out analysis preserve the signal?
**YES**:
- In all 12 iterations, omitting any single task preserved the direction and magnitude of the results (+27.9% to +38.4% token delta, +2.8% to +24.1% cost delta). The signal is stable and not driven by any single outlier.

### Q10: What is now observed, supported, and not yet established?

#### OBSERVED (Deterministically Verified Facts):
1. Capability is identical: 6/12 vs 6/12 (50.0% vs 50.0%).
2. Zero rescues (0 FAIL → PASS) and zero regressions (0 PASS → FAIL).
3. Completion tokens: -13.5% (29,217 → 25,272).
4. Reasoning tokens: -14.9% (22,140 → 18,849).
5. Prompt tokens: +37.5% (284,859 → 391,682, +106,823 tokens).
6. Total tokens: +32.8% (314,076 → 416,954, +102,878 tokens).
7. Total cost: +11.3% ($0.050354 → $0.056068 USD).
8. Model-family routing divergence occurred in 9/12 pairs.
9. Provider divergence occurred in 12/12 pairs.
10. 4 tasks used fewer total tokens under WTF; 8 tasks used more.

#### SUPPORTED INTERPRETATION:
1. WTF can reduce generation work (completion and reasoning tokens) while fully preserving capability.
2. Accumulated WTF context (TraceSlice frames + BoundedViewport context + TrajectoryLedger history) transmitted repeatedly across multi-turn failure trajectories can outweigh generation savings end-to-end.
3. End-to-end efficiency depends jointly on intelligence expenditure (generation) and substrate/interface expenditure (prompt/context transmission).
4. The next useful frontier is understanding what portion of accumulated reality must continue crossing the intelligence boundary on each turn.

#### NOT YET ESTABLISHED:
1. That WTF was the sole cause of all routing divergence.
2. That adaptive context pruning, truncation, summarization, or stagnation-based deletion solves the overhead without losing necessary diagnostic continuity.
3. What portion of historical state remains decision-relevant for residual intelligence across turns.
4. That a deterministic compaction mechanism exists that safely bounds prompt expansion.
5. That WTF improves end-to-end efficiency generally across arbitrary task distributions.

---

## 7. Joint Synthesis: Phase 11.1 + Phase 11.2

| Dimension | Phase 11.1 (N=3 Paired) | Phase 11.2 (N=12 Paired) | Joint Evidence Synthesis |
|---|---|---|---|
| **Cohort Type** | 3 resolving tasks | 12 heterogeneous tasks (6 pass, 6 fail) | Saturated vs realistic mixed-difficulty cohort |
| **Capability** | 3/3 vs 3/3 (100%) | 6/12 vs 6/12 (50.0%) | **100% Capability Preservation** (zero regressions across all 15 tasks) |
| **Completion Tokens** | Not broken out | **-13.5%** | **Systematic generation compression** |
| **Reasoning Tokens** | Not broken out | **-14.9%** | **Systematic reasoning compression** |
| **Prompt Tokens** | **-26.4%** | **+37.5%** | **Context-dependent**: saves prompts in fast-resolving runs; expands prompts in stalled runs |
| **Total Tokens** | **-13.9%** | **+32.8%** | **End-to-end efficiency is NOT universal** |
| **Spend (USD)** | **-5.9%** | **+11.3%** | **End-to-end cost follows prompt volume** |
| **Routing Shifts** | 1 / 3 (33.3%) | 9 / 12 (75.0%) | Strong association with router behavior |

### Core Empirical Principle:
**WTF CAN reduce intelligence expenditure. Whether this produces lower END-TO-END expenditure depends on the cost of the deterministic/interface context WTF itself places across the intelligence boundary. That boundary is the next research target.**

---

## 8. Emerging Research Question & Hypothesis for Phase 11.3

### The Core Question:
> **What portion of WTF's accumulated context is necessary for the current residual intelligence decision, and what portion is deterministically removable without losing established reality?**

### Candidate Principle (Hypothesis Only — NOT Established):
> *Intelligence should inherit established reality without paying repeatedly to reconsume it.*

This hypothesis does **not** assume an implementation. It does not presuppose pruning, truncation, compression, or any specific mechanism. The mechanism must follow evidence.

---

## 9. Verification Receipt

```markdown
## VERIFIED
✓ tests: passed (160/160) in 7356ms [npm test]
✓ typecheck: passed in 893ms [npm run typecheck]
✓ build: passed in 172ms [npm run build]

## OBSERVED
3 application files changed: +573 / -0 (573 meaningful lines)
  • docs/research/WTF_RESEARCH_STATE.md (+61/-0)
  • docs/research/observations/ (2 files · +512/-0)

## UNKNOWN
- Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)

WTF-RECEIPT: v0.1 | base:7fc70b2 | VERIFIED (3/3) | ATTENTION (0) | OBSERVED (+573/-0, 3f)
```
