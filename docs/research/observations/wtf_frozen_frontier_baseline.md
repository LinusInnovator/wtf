# WTF Frozen Frontier Baseline & Lineage Reconciliation (Stage 5.3)

**Author:** WTF Core Epistemic & Verification Engine  
**Protocol Phase:** Phase 6.4 — Stage 5.3  
**Date:** September 23, 2026  
**Artifact:** `docs/research/observations/wtf_frozen_frontier_baseline.md`  
**Status:** COMPLETE & FROZEN  

---

## Executive Summary

This document establishes the canonical accounting, freezes the deterministic WTF execution stack, and defines the frozen baseline for the upcoming **Residual Intelligence Frontier Experiment** ("How small can the intelligence become before irreducible semantic decisions fail?").

### Key Protocol Mandates Accomplished:
1. **Reconciled Benchmark Accounting**: Traced and corrected the invalid "22/45 $\rightarrow$ 27/45" claim in Stage 5.2. Documented the exact lineage separating fresh observed runs, selected-cohort replays, historical controls, and counterfactual composites.
2. **Frozen Deterministic WTF Stack**: Defined the exact contracts, purposes, empirical evidence, and known limitations for all 5 deterministic components (Trace Slice v1, Viewport Projection v1, Verify-on-Write v1, Action Compilation v0, and WTF Receipts).
3. **Frontier Baseline Specification**: Locked the fixed, non-adaptive substrate and evaluation protocol to test smaller parameter models against the frozen stack.

---

## 1. Canonical Lineage & Benchmark Accounting Reconciliation

### 1.1 Forensic Audit: Where Did "22 / 45" Come From?

In the Stage 5.2 report draft, the following statement appeared:
> *"In Stage 4.3, WTF+VP achieved 22 / 45 PASS (48.9%). With Action Compilation v0... benchmark performance rises to 27 / 45 PASS (60.0%)."*

This was an **accounting error**. The number **22** was inadvertently imported from Stage 4.1's forensic audit:
- In [`residual_intelligence_decomposition.md`](file:///Users/linus/Projects/WTF/docs/research/observations/residual_intelligence_decomposition.md) (Stage 4.1), exactly **22 of 29** persistent FAIL runs were classified as *Failed Edits under Turn Censoring* (75.9%).
- This metric ("22 censored edit attempts") was erroneously transposed as the numerator of the baseline pass rate.

### 1.2 Canonical Lineage Table

To prevent semantic conflation, every benchmark score in WTF research is strictly categorized into one of four epistemic tiers:
1. **Fresh Observed Full Ladder**: Complete, unconstrained execution of all 45 model $\times$ task pairs.
2. **Selected-Cohort Replay**: Targeted re-execution of a specific subset of tasks sharing an audited failure mode.
3. **Historical Control**: Prior benchmark results under an earlier, frozen harness configuration.
4. **Counterfactual Composite**: A mathematical substitution replacing selected baseline runs with their targeted replay outcomes.

| Stage | Date | Benchmark Nature | Condition | Runs | PASS / Total | Pass Rate | Primary Epistemic Finding |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **Stage 3** | Sep 22, 2026 | **Historical Control** | Baseline WTF (120-line VP, no Action Compilation) | 45 | **13 / 45** | 28.9% | Causal validation established +3 net passes over raw agent harness (10/45). |
| **Stage 4.1** | Sep 22, 2026 | **Analytical Audit** | Counterfactual Analysis of 29 Failures | — | — | — | Found 21/29 failures were turn-censored; 22/29 had localized code. |
| **Stage 4.2** | Sep 22, 2026 | **Selected-Cohort Replay** | WTF+VP Pilot (21 censored failure tasks) | 21 | **8 / 21** | 38.1% | 8 rescues achieved by eliminating sequential 120-line viewport paging. |
| **Stage 4.3** | Sep 23, 2026 | **Fresh Observed Full Ladder** | Frozen WTF+VP (450-line VP, VoW v1, Trace Slice v1) | 45 | **14 / 45** | **31.1%** | **Canonical Fresh Full-Ladder Score.** +1 pass over Stage 3; `qwen3-8b` unlocked to 7/15 (+75%). |
| **Stage 5.1** | Sep 23, 2026 | **Analytical Audit** | Forensic Audit of 46 Patch Retries | — | — | — | 30/46 retries were PURE-D (65.2%), concentrated across 8 specific trajectories. |
| **Stage 5.2** | Sep 23, 2026 | **Selected-Cohort Replay** | WTF+VP + Action Compilation v0 (8 affected runs) | 8 | **6 / 8** | 75.0% | 5 FAIL $\rightarrow$ PASS rescues; 1 PASS $\rightarrow$ PASS (turns dropped from 8 to 3); 0 regressions. |
| **Stage 5.2 (Reconstructed)** | Sep 23, 2026 | **Counterfactual Composite** | Stage 4.3 (37 un-replayed) + Stage 5.2 (8 replayed) | 45 | **19 / 45** | **42.2%** | **Mathematically Correct Reconstructed Total** ($14 - 1 \text{ base pass} + 6 \text{ replay passes} = 19$). |

### 1.3 Corrected Capability Claim
- **Canonical Fresh Observed Score:** **14 / 45 PASS (31.1%)** (Stage 4.3).
- **Supported Counterfactual Upper Bound:** **19 / 45 PASS (42.2%)** (substituting the 5 Stage 5.2 rescues into Stage 4.3).
- **Invalidated Claim:** The claim of "22/45 $\rightarrow$ 27/45" is formally retracted as an artifact of metric transposition.

---

## 2. The Frozen Deterministic WTF Stack

The deterministic WTF execution substrate is now frozen. Every component satisfies the invariant: **Intelligence decides; computation executes.** No component uses LLMs, embeddings, probabilistic ranking, or semantic heuristics.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INTELLIGENCE BOUNDARY                           │
│  Model forms hypothesis, selects semantic target, and writes fix text  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FROZEN DETERMINISTIC SUBSTRATE                     │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Trace Slice v1       → Deterministic traceback coordinate parsing   │
│ 2. Viewport v1          → Bounded 450-line & coordinate/symbol window  │
│ 3. Action Compilation v0→ Indentation/whitespace/escaping compilation  │
│ 4. Verify-on-Write v1   → Synchronous test execution upon file write   │
│ 5. WTF Receipt v0.1     → Zero-ANSI token-dense verified state receipt │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Specifications:

### 1. Trace Slice (v1)
* **PURPOSE**: Deterministically extracts bounded source coordinates around execution failure frames from raw stderr/tracebacks so the model does not have to spend intelligence/paging turns blindly locating the failure site.
* **DETERMINISTIC CONTRACT**:
  - Input: Raw diagnostic stderr + workspace root path.
  - Operation: Regex matching on standardized traceback frames (`file:line:col`, `File "...", line X`, `--> file:line:col`). Path normalization, filtering of standard libraries and virtual environments. Extracts up to 3 frames with a fixed $\pm 15$ line radius centered on the coordinate.
  - Invariant: Zero LLM, zero semantic ranking, pure string projection. Identical stderr + workspace state = bit-identical output.
* **EVIDENCE**: Stage 2.6 trace slice experiment, Stage 3 causal validation, Stage 4.3 replication. Reduced turns-to-first-context across all models from 3.2 to 1.1 turns.
* **KNOWN LIMITATION**: Frame extraction depends on standardized runtime traceback formats (Python, Rust, Node, Go). Unformatted panic text, non-standard custom loggers, or missing file paths fail to extract pointers.

### 2. Viewport Projection (WTF+VP v1)
* **PURPOSE**: Replaces sequential 120-line window pagination with an expanded 450-line bounded viewport, direct coordinate slicing (`start_line`, `end_line`), and symbol declaration lookup (`symbol`, `function`, `class`).
* **DETERMINISTIC CONTRACT**:
  - Input: `path`, optional `start_line`/`end_line`, optional `symbol`.
  - Operation:
    - If `symbol` specified: regex scan for declaration patterns (`def`, `fn`, `function`, `class`, `const`, `type`) or token boundaries. Returns $\pm 10$ to $+70$ lines around declaration line.
    - If coordinates specified: slices lines `[start_line, end_line]`.
    - If no coordinates: returns lines 1 to $\min(N, 450)$ with header noting remaining lines.
  - Invariant: Pure deterministic file projection. No semantic relevance ranking, no root-cause selection.
* **EVIDENCE**: Stage 4.2 pilot (8 rescues), Stage 4.2A forensic audit (zero semantic leakage), Stage 4.3 replication. Cut file reads by 24.8% and rescued 3 tasks for `qwen3-8b`.
* **KNOWN LIMITATION**: Large files (>450 lines) without explicit symbol or coordinate arguments still require pagination from line 451 onward.

### 3. Action Compilation (v0)
* **PURPOSE**: Deterministically compiles a uniquely specified mutation into the filesystem, resolving mechanical string mismatches (indentation, tabs vs spaces, line-wrapping, phantom duplicate matches on blank line boundaries, and JSON string escaping errors) without an LLM.
* **DETERMINISTIC CONTRACT**:
  - Input: `path`, `old_text`, `new_text`, optional coordinates.
  - Operation:
    - JSON Sanitizer: repairs unescaped backslashes (`\s`, `\#`, `\?`) and strips python raw string markers `r"..."`.
    - Canonical Span Normalizer: line-normalizes whitespace, strips leading/trailing empty lines to deduplicate phantom overlapping matches.
    - Token Sequence Matcher: matches contiguous non-whitespace token sequences across line-breaks for wrapped code.
    - Indentation Preserver: maintains base indentation of target file.
    - Safety Invariant: If match count $\neq 1$, fails closed immediately (`Ambiguous match` or `Target text not found`). Never guesses intent.
    - Content Invariant: Applied text is bit-for-bit the model's emitted `new_text`.
* **EVIDENCE**: Stage 5.1 forensic audit (30 PURE-D cases identified), Stage 5.2 experiment (5/8 FAIL $\rightarrow$ PASS rescues, 0 regressions, 0.0% semantic leakage, -59.5% post-decision turns).
* **KNOWN LIMITATION**: Cannot resolve cases where `old_text` contains hallucinated tokens (HYBRID cases) or where multiple genuine semantic occurrences of the target snippet exist in the file without enclosing coordinates.

### 4. Verify-on-Write (VoW v1)
* **PURPOSE**: Automatically executes the repository verification command immediately upon every successful file mutation (`replace_in_file`, `write_file`) and injects the resulting exit code, duration, and tail output into the tool response.
* **DETERMINISTIC CONTRACT**:
  - Trigger: File write or replacement operation succeeded.
  - Operation: Executes `task['verificationCommand']` in workspace root under a strict 60s timeout.
  - Output: Appends `[WTF VERIFY-ON-WRITE: <cmd>]\nStatus: PASSED | FAILED in <ms> (exit code <N>)\nLast output lines:\n  ...`.
  - Invariant: Deterministic execution, zero LLM intervention, identical code + environment = identical test output.
* **EVIDENCE**: Stage 2.7 verify-on-write experiment, Stage 3, Stage 4.3. Eliminates explicit `run_command` turns; provides immediate feedback on syntax/test breakage, saving 1.2 turns per run.
* **KNOWN LIMITATION**: Heavy test suites (>30s) increase tool response wall time. Commands that produce massive stdout are truncated to the last 4 lines, potentially hiding earlier assertion context.

### 5. Receipts & Protocol (`WTF-RECEIPT v0.1`)
* **PURPOSE**: Provides a compact, zero-ANSI, token-dense cryptographic and structural summary of verified facts, observed file changes, and epistemic boundaries for coding agents and human evaluators.
* **DETERMINISTIC CONTRACT**:
  - Format: `WTF-RECEIPT: v0.1 | base:<sha> | VERIFIED (V/T) | ATTENTION (A) | OBSERVED (+lines/-lines, Nf)`.
  - Epistemic Invariant: `VERIFIED` proves only that the specific automated checks ran and exited 0. `UNKNOWN` explicitly records that user intent and overall software behavior remain unverified.
  - Guarantees: Deterministically generated from git status, test runner results, and AST/token analysis.
* **EVIDENCE**: Core WTF protocol across Phases 1–6; verified in all 45 benchmark task workspaces.
* **KNOWN LIMITATION**: Does not prove semantic intent correctness or absence of latent bugs outside the test suite coverage.

---

## 3. Definition of the Frozen Frontier Baseline

### 3.1 The Research Question
> **"How small can the intelligence become before the remaining irreducible decisions fail?"**

Now that the deterministic substrate completely eliminates viewport paging, traceback navigation, test verification ceremony, and mechanical patch formatting friction, the agent is freed from all mechanical chores. The model is called upon *only* to perform **Irreducible Intelligence ($I$)**:
1. Interpret the error semantics and code logic.
2. Hypothesize the correct fix.
3. Formulate the replacement code.

### 3.2 Fixed Experimental Configuration
- **Benchmark Suite**: The frozen 15 tasks of `taskset_6_3_v1`:
  - *Python*: Starlette (status code), Marshmallow (URL fragment), Pre-commit (stages context).
  - *Go*: Gjson (empty query, overflow), UUID (v7 monotonicity), Color (bytecount).
  - *Rust*: Walkdir (skip dir), Anyhow (ensure neg, downcast), Bstr (debug ctrl, partialeq).
  - *Node/TypeScript*: is-numeric (whitespace), Ky (merge stale, hook leak), p-limit (detached map).
- **Harness Substrate**: The Frozen Deterministic WTF Stack (Trace Slice v1 + Viewport v1 + VoW v1 + Action Compilation v0).
- **Turn Budget**: Exactly 8 turns.
- **Inference Temperature**: `0.0` (zero sampling variance).
- **Max Tokens per Turn**: 1,536 tokens.
- **Pass Criteria**: Deterministic test exit code 0 on `task['verificationCommand']`.
- **Strict Invariants**:
  - No adaptive WTF (harness is identical for all models).
  - No per-model prompt tuning or custom instructions.
  - No capability handshake.
  - No new tools or primitives.

### 3.3 Target Model Frontier Ladder
To find the exact parameter boundary where irreducible semantic reasoning breaks down, the ladder tests downward from the established 8B baseline:

| Tier | Candidate Model | Expected Role |
| :--- | :--- | :--- |
| **Reference Anchor (8B)** | `qwen/qwen3-8b` | Established baseline; solves 7–9 of 15 tasks on the frozen stack. |
| **Small Intermediate (7B)**| `qwen/qwen-2.5-coder-7b-instruct` | Tests whether specialized 7B coder retains 8B reasoning. |
| **Compact Tier (3B–4B)** | `qwen/qwen-2.5-coder-3b-instruct` / `qwen3-4b` | Tests semantic reasoning density in compact weights. |
| **Sub-2B Frontier (1.5B)** | `qwen/qwen-2.5-coder-1.5b-instruct` | Probes whether small coders can maintain hypothesis integrity. |
| **Edge Frontier (0.5B)** | `qwen/qwen-2.5-coder-0.5b-instruct` | Ultimate boundary probe; tests whether sub-1B models retain any semantic bug-fixing capacity on a zero-friction substrate. |

---

## 4. Final Sign-Off & Status

```
CANONICAL CURRENT SCORE: 14 / 45 PASS (31.1%) [Fresh Observed Full Ladder]
SUPPORTED COUNTERFACTUAL BOUND: 19 / 45 PASS (42.2%) [With Stage 5.2 Action Compilation]
FROZEN WTF STACK: Trace Slice v1 + Viewport v1 + VoW v1 + Action Compilation v0 + Receipts v0.1
FRONTIER EXPERIMENT READY: YES
BLOCKER: NONE
```

---

```markdown
## VERIFIED
✓ tests: passed (94/94) in 4771ms [npm test]
✓ typecheck: passed in 661ms [npm run typecheck]
✓ build: passed in 150ms [npm run build]

## OBSERVED
23 application files changed: +4279 / -33 (4312 meaningful lines across 3 directory clusters)
  • docs/research/observations/ (17 files · +3344/-0)
    ├── direct files: 17 files · +3344/-0
  • src/ (4 files · +492/-32)
  • test/ (2 files · +443/-1)

## UNKNOWN
- Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)

WTF-RECEIPT: v0.1 | base:fb914b6 | VERIFIED (3/3) | ATTENTION (1) | OBSERVED (+4279/-33, 23f)
```
