# WTF Phase 11.0 — OpenRouter Magnification

**Status:** COMPLETE (MAGNIFICATION & EXPERIMENT DESIGN ONLY — ZERO EXPERIMENTS / ZERO PRODUCTION CHANGES)  
**Date:** September 25, 2026  
**Baseline:** WTF v0.3.0 Frozen (`7fc70b2`)  
**Governing Rule:** *Do not build a better router. Find out whether WTF makes an existing router better.*

---

## 1. Executive Summary & Core Question

Phases 6.5 through 10.4 proved that the WTF engine (v0.1 Evidence Protocol, v0.2 Invariant Execution Substrate, and v0.3 Trajectory State & Handoff Runtime) dramatically improves finite, local model capability:
- **Action Compilation** eliminated 100% of formatting-entropy patch failures with zero false mutations.
- **Trace Slicing & Bounded Viewports** eliminated 80% of redundant reads and shell navigation loops.
- **Trajectory State & Compiled Handoff** doubled task completion rates (33.3% $\to$ 66.7%) and cut paid remote API costs by up to 29.9% while completely discarding predecessor chain-of-thought traces.

However, all prior research either:
1. Pinned a single specific local model (e.g., `qwen2.5-coder:3b`, `ternary-bonsai-2-27b`), or
2. Replayed predetermined, hand-crafted handoffs between specific pinned remote models (Phase 8.5: Local 3B $\to$ Remote Llama 8B / Mistral 24B / DeepSeek Chat).

**Phase 11.0 addresses the next frontier:**
> **Can the frozen WTF v0.1–v0.3 engine make an existing, autonomous, third-party routed intelligence pool more useful?**
>
> Specifically: Does WTF reduce unnecessary intelligence expenditure and/or improve useful task completion when placed **BEFORE** an existing router (OpenRouter)?

```
===============================================================================
                     ARCHITECTURE UNDER TEST (PHASE 11)
===============================================================================

                         TASK + COMPUTATIONAL REALITY
                                      │
                                      ▼
                                ┌───────────┐
                                │    WTF    │
                                └─────┬─────┘
                                      │  • Compiles deterministic work (ActionCompiler)
                                      │  • Exposes bounded reality (TraceSlice + Viewport)
                                      │  • Preserves trajectory state (TrajectoryLedger)
                                      │  • Signals observable stagnation (StagnationDetector)
                                      │  • Compiles clean handoff packets (HandoffCompiler)
                                      ▼
                                ┌───────────┐
                                │OPENROUTER │
                                └─────┬─────┘
                                      │  • Owns model routing & selection
                                      │  • Manages provider fallback & load balancing
                                      ▼
                          ROUTED INTELLIGENCE POOL
                                      │
                                      ▼
                               OBSERVED RESULT
                                      │
                                      ▼
                                ┌───────────┐
                                │    WTF    │ ──► [wtf check / verify-on-write]
                                └─────┬─────┘
                                      │
                                      ▼
                                   REPEAT

===============================================================================
  WTF DOES NOT CHOOSE THE MODEL. OPENROUTER OWNS ROUTING. WTF OWNS REALITY.
===============================================================================
```

---

## 2. Pocket 21 Audit: Baseline Runtime & Substrate State

Before designing any causal experiment, we audited the existing production runtime, OpenRouter integration, available instrumentation, and historical cross-substrate evidence.

### 2.1 Frozen WTF v0.1–v0.3 Runtime Capabilities
The WTF production runtime as frozen in v0.3.0 (`7fc70b2`) provides the complete foundation required for pre-routing assistance without any code modifications:
1. **Verification Contract (v0.1):** `wtf check` executes test suites, inspects git diffs, detects ungrounded changes, and emits zero-ANSI token-dense receipts (`WTF-RECEIPT`).
2. **Deterministic Execution Substrate (v0.2):**
   - `TraceSlice`: Multi-language traceback parsing extracting verified `file:line` coordinates from stderr/stdout without regex heuristics.
   - `BoundedViewport`: Clamps context windows to $[coord - radius : coord + radius]$ lines, focusing intelligence on the physical point of failure.
   - `ActionNormalizer` & `ActionCompiler`: Resolves edits against disk bytes across exact, line-normalized, and token-sequence strategies, neutralizing formatting entropy with zero semantic inference.
3. **Trajectory State & Handoff (v0.3):**
   - `TrajectoryLedger`: Immutable append-only turn ledger maintaining a 3-tier epistemic provenance map (`DETERMINISTIC_REALITY`, `DERIVED_DETERMINISTIC_STATE`, `INTELLIGENCE_SUPPLIED_CLAIM`).
   - `TrajectoryStagnationDetector`: Deterministic evaluation of 7 observable stagnation rules (repeated failures, post-mutation stalls, navigation wandering, premature finish).
   - `HandoffCompiler`: Compiles established computational state into a clean continuation packet with 100% zero-CoT transfer.

**Audit Verdict:** Production WTF requires **zero changes** to support pre-routing assistance.

### 2.2 OpenRouter Capabilities & Routing Primitives Audit
Live API auditing of OpenRouter's endpoints (`https://openrouter.ai/api/v1/models` and `/chat/completions`) conducted on September 25, 2026 revealed the following active routing primitives:

| Routing Primitive | Identifier | Mechanism | Cost / Pricing | Live Audit Observation |
| :--- | :--- | :--- | :--- | :--- |
| **Auto Router** | `openrouter/auto` | Routes dynamically across all models based on aggregate community spend and prompt characteristics. | Varies by routed target | Live probe routed a test ping to `deepseek/deepseek-v4.1-flash` via Together ($0.0000426 / call). Revealed reasoning tokens in response. |
| **Pareto Code Router** | `openrouter/pareto-code` | Routes across a tiered shortlist of top-performing coding models ranked by Artificial Analysis coding percentiles. | Varies by routed target | Live probe routed to `anthropic/claude-fable-5.1` via Anthropic ($0.00034 / call). |
| **Free Models Router** | `openrouter/free` | Selects dynamically from currently available free endpoints. | $0.00 | High rate limits, inconsistent availability, variable context windows. |
| **Client Fallback Pool** | `models: ["id1", "id2"]` | Client specifies an ordered fallback array; OpenRouter tries the first and falls back on outage/error. | Pinned model rates | Deterministic model candidates, automated infrastructure failover. |

#### Critical Discovery: The OpenRouter Boundary
OpenRouter operates strictly at the **HTTP Prompt $\leftrightarrow$ Completion Interface**:
- OpenRouter has **zero access to the filesystem, git repository, or test runner**.
- OpenRouter cannot verify whether an edit compiled, whether tests passed, or where an exception was thrown.
- OpenRouter cannot normalize whitespace or indentation in model outputs.
- OpenRouter maintains **no computational state across turns**; if a multi-turn agent fails, OpenRouter has no mechanism to prevent predecessor reasoning pollution.

**Therefore:** OpenRouter and WTF operate in completely non-overlapping, complementary layers:
- **OpenRouter** routes and delivers pure intelligence across models.
- **WTF** grounds intelligence in deterministic physical reality, compiles deterministic work, and preserves trajectory state.

### 2.3 Historical Cross-Substrate Findings (Phase 8.5)
In Phase 8.5 (`docs/research/observations/cross_substrate_replication_phase8_5.md`), Compiled Handoff was tested across commercial remote models (`meta-llama/llama-3.1-8b-instruct`, `mistralai/mistral-small-24b-instruct-2501`, `deepseek/deepseek-chat`):
- Overall task success doubled from **33.3% to 66.7%**.
- Redundant file reads collapsed by **80.0%**.
- Paid API costs dropped by up to **29.9%** per challenge.
- Zero chain-of-thought traces were passed.

*The Gap:* Phase 8.5 used a **manually pinned replacement model** (e.g. Local 3B $\to$ Remote Llama 8B). It did not evaluate whether an **autonomous external router** makes better decisions when preceded by WTF.

---

## 3. Analysis of Routing Mechanisms: Auto vs. Pareto vs. Pinned Pool

Which OpenRouter routing mechanism is the correct target for Phase 11?

### 3.1 Option 1: `openrouter/auto` (Market-Driven General Router)
- **How it works:** OpenRouter inspects prompt size, language, and user spend patterns to select an optimal model dynamically.
- **Strengths:** True autonomous routing. Represents the standard real-world usage pattern for developers delegating model selection to OpenRouter.
- **Risks:** 
  1. On short or unstructured prompts, `openrouter/auto` may route to ultra-cheap non-coding models or reasoning models that waste output tokens on internal `<think>` scratchpads.
  2. Routing decisions can fluctuate between runs, introducing provider-level variance.
- **Utility for WTF:** Tests whether WTF's structured, bounded context presentation causes `openrouter/auto` to pick more effective models or succeed on cheaper tiers.

### 3.2 Option 2: `openrouter/pareto-code` (Coding-Specialized Router)
- **How it works:** OpenRouter restricts candidate routing to models on the Pareto frontier of coding benchmarks (Artificial Analysis percentiles).
- **Strengths:** Guaranteed coding-capable models; eliminates routing to arbitrary non-code LLMs.
- **Risks:** Frequently routes to top-tier proprietary models (e.g., Claude 3.5 Sonnet / Fable), which can incur significantly higher API costs per turn ($0.0003–$0.01 per turn), threatening strict budget ceilings.

### 3.3 Option 3: Two-Tier Pinned Pool (`models: [cheap_coder, frontier_coder]`)
- **How it works:** OpenRouter routes within an explicit client-defined pool, handling provider failover.
- **Strengths:** Maximum determinism, highly bounded cost ceiling.
- **Risks:** Re-introduces client-side model selection, which borders on "building a router" (strictly forbidden).

### 3.4 Recommendation
**Use `openrouter/auto` as the primary routing substrate.**  
`openrouter/auto` is the definitive autonomous router provided by OpenRouter. It directly tests the thesis: *Does WTF improve an existing commercial router without WTF choosing the model?* To prevent runaway reasoning token spend, requests must enforce explicit `max_tokens` limits (e.g., 1,536 tokens) and track per-turn model attribution.

---

## 4. The 5 Causal Attribution Categories

To ensure scientific rigor and prevent false claims, every observed effect in Phase 11 must be classified into exactly one of five formal attribution categories:

```
+-------------------------------------------------------------------------------+
|                        CAUSAL ATTRIBUTION TAXONOMY                           |
+-------------------------------------------------------------------------------+
|                                                                               |
|  1. DETERMINISTIC SUBSTITUTION                                                |
|     Work deterministically executed by WTF instead of burning model tokens.   |
|     (e.g., ActionCompiler resolving indentation without model re-prompting;   |
|      TraceSlice pinpointing exact failure line without shell searching).      |
|                                                                               |
|  2. INTERFACE ADVANTAGE                                                       |
|     Behavioral gain resulting from WTF's bounded context presentation.        |
|     (e.g., BoundedViewport preventing context saturation, enabling the routed |
|      model to focus on relevant logic rather than wandering).                 |
|                                                                               |
|  3. STATE-PRESERVATION ADVANTAGE                                              |
|     Advantage resulting from WTF preserving trajectory state across turns.    |
|     (e.g., StagnationDetector signaling loops, HandoffCompiler providing      |
|      clean continuation packets with zero predecessor CoT pollution).         |
|                                                                               |
|  4. ROUTER / MODEL ADVANTAGE                                                  |
|     Advantage originating purely from OpenRouter's model routing decision.   |
|     (e.g., OpenRouter selecting an inherently superior model or architecture).|
|     *CRITICAL RULE: DO NOT CREDIT WTF FOR CATEGORY 4.*                        |
|                                                                               |
|  5. UNKNOWN / RESIDUAL NOISE                                                  |
|     Unattributable variance, API network timeouts, provider fluctuations.     |
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

## 5. Falsification & Stop Criteria

The experiment must be capable of falsifying the core hypothesis. We pre-register the exact interpretation of all possible experimental outcomes:

| Outcome | Experimental Observation | Epistemic Meaning | Architectural Implication |
| :---: | :--- | :--- | :--- |
| **1** | **Meaningful Value Added** | Higher task completion rate and/or lower total cost with zero capability regressions in WTF + OpenRouter vs. OpenRouter Alone. | **HYPOTHESIS CONFIRMED.** WTF provides decisive pre-routing leverage for routed intelligence pools. |
| **2** | **Expenditure Reduction Only** | Task completion is identical between arms, but total tokens, turns, and dollar cost are significantly lower with WTF. | **PARTIALLY CONFIRMED.** WTF functions as an efficiency substrate (deterministic substitution) without expanding capability. |
| **3** | **Capability Gain at Higher Cost** | Task completion is higher with WTF, but total cost is higher (e.g. because WTF prevents premature aborts, allowing productive multi-turn solutions). | **CONFIRMED WITH TRADEOFF.** WTF unlocks capability by enabling deeper trajectory exploration. |
| **4** | **No Material Advantage** | Task completion, cost, tokens, and turns are statistically indistinguishable between OpenRouter Alone and WTF + OpenRouter. | **HYPOTHESIS FALSIFIED.** OpenRouter's internal routing is unaffected by WTF's substrate and trajectory layers. |
| **5** | **Active Harm** | OpenRouter Alone outperforms WTF + OpenRouter (e.g. WTF's bounded viewport or patch normalization confuses the routed models). | **HYPOTHESIS FALSIFIED.** WTF interferes destructively with routed intelligence. |

### Stop Criteria
The experiment runner must immediately halt and abort execution if any of the following occur:
1. **Spend Ceiling:** Cumulative OpenRouter spend reaches **$2.50 USD**.
2. **Provider Failures:** 3 consecutive API requests return HTTP 5xx or unresolvable JSON schema errors from OpenRouter.
3. **Severe Non-Determinism:** Routed model identifiers change repeatedly within a single turn loop, causing infinite ping-pong without state progress.

---

## 6. Proposed Phase 11.1 Causal Experiment Specification

We specify exactly ONE clean, bounded, high-leverage causal experiment for execution in Phase 11.1.

### 6.1 Experimental Conditions (Paired Comparison)
- **Condition A: OPENROUTER ALONE (Control)**
  - Agent interacts directly with the challenge repository.
  - Diagnostics: Raw compiler / test runner stdout and stderr provided directly to prompt.
  - Edits: Model emits standard raw search/replace or file rewrite instructions. No ActionCompiler normalization.
  - Navigation: Model executes standard shell commands (`cat`, `grep`, `find`).
  - Routing: Every turn is sent to `openrouter/auto`.
- **Condition B: WTF + OPENROUTER (Treatment)**
  - Agent operates with the frozen WTF v0.1–v0.3 runtime assistance:
    - Diagnostics: Filtered through `TraceSlice` (exact failure coordinate) and projected via `BoundedViewport` (focus window).
    - Edits: Reconciled via `ActionCompiler` (deterministic indentation/whitespace normalization with zero false mutations).
    - State: Turns recorded in `TrajectoryLedger` with 3-tier epistemic provenance.
    - Handoff: On `TRAJECTORY_STAGNATION`, `HandoffCompiler` compiles continuation packet (zero CoT).
  - Routing: Every turn is sent to the identical `openrouter/auto` endpoint with identical system instructions.

### 6.2 Challenge Task Cohort
A stratified cohort of **3 canonical tasks** from the frozen benchmark suite (`scratch/taskset_6_3_v1`), selected for known sensitivity to mechanical friction, coordinate grounding, and semantic reasoning:

1. **`task-01-python-starlette-status-code` (Python):**
   - *Nature:* Web framework HTTP status code handling (`starlette/status.py` / `responses.py`).
   - *Known Failure Mode:* Context bloat across large files; indentation formatting friction in Python dictionaries.
2. **`task-12-node-plimit-detached-map` (Node/TypeScript):**
   - *Nature:* Asynchronous concurrency queue edge case (`p-limit`).
   - *Known Failure Mode:* Shell search loops (`find`, `grep`); ungrounded action hallucinations when given raw npm test errors.
3. **`task-09-rust-walkdir-skip-dir` (Rust):**
   - *Nature:* Recursive directory walking iterator logic (`walkdir`).
   - *Known Failure Mode:* Compiler diagnostic density; mechanical patch rejection due to method signature formatting.

### 6.3 Configuration & Parameters
- **Router Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Router Model Slug:** `openrouter/auto`
- **Temperature:** `0.0` (greedy decoding for reproducibility)
- **Turn Budget:** Maximum **8 turns** per task run.
- **Max Tokens per Turn:** `1,536` tokens.
- **Cost Ceiling:** Hard limit of **$2.50 USD** total across all 6 runs (3 tasks $\times$ 2 conditions).
- **Run Order:** Interleaved (A1, B1, A2, B2, A3, B3) to balance temporal API conditions.

### 6.4 Primary & Secondary Measurements
- **Primary Measure:**
  - Useful Task Completion (Binary: PASS / FAIL via independent test suite exit code 0).
- **Secondary Measures:**
  - Total OpenRouter API Cost ($ USD, tracked from `res.usage.cost`).
  - Total Tokens (Prompt + Completion + Reasoning tokens).
  - Turns to First Useful Mutation.
  - Redundant File Reads / Navigation Calls.
  - Mechanical Patch Retries (rejected edits).
  - Actual Models Routed (recorded from `res.model` per turn).
  - Stagnation Events Detected (`TrajectoryStagnationDetector`).
  - Causal Attribution Category (1 through 5 for every observed difference).

---

## 7. Negative Boundary Audit (What Must NOT Be Built)

In strict accordance with the Constitutional Protocol:
- **DO NOT build a router:** WTF must not implement model selection algorithms, model rankers, or cost optimizers.
- **DO NOT modify WTF production code:** All v0.1–v0.3 modules remain bit-for-bit frozen.
- **DO NOT cherry-pick models:** OpenRouter Auto must make the routing decisions autonomously.
- **DO NOT prompt-engineer separately:** Both Condition A and Condition B must use identical core system instructions and tool definitions.

---

## 8. Conclusion & Readiness

The Phase 11.0 audit confirms that:
1. The frozen WTF v0.1–v0.3 runtime provides all necessary deterministic execution, bounded exposure, and trajectory state capabilities out-of-the-box.
2. OpenRouter provides verified, operational autonomous routing primitives (`openrouter/auto`) that operate strictly at the HTTP layer, leaving the physical execution substrate completely unassisted.
3. The proposed Phase 11.1 experiment is minimal (3 paired tasks, 6 runs total, <$2.50 budget), strictly controlled, and capable of definitively falsifying whether WTF provides meaningful leverage before routed intelligence.

**Phase 11.0 is COMPLETE. Ready for Phase 11.1.**
