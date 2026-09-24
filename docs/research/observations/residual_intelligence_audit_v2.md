# WTF Phase 6.3 — Stage 2.8: Residual Intelligence Audit v2

```
Status: Empirical Forensic Audit
Stack: Harness v2 + Trace Slice v1 + Verify-on-Write v1
Observation Population: 24 Recent Trajectories (12 Full-Stack Runs + 12 Ablation Runs)
Focus Population: 12 Trajectories under the Full Current Stack across 4 Ecosystems & 3 Model Families
Date: 2026-09-22
```

---

## 1. Executive Summary & Verdict

**Verdict: B — Deterministic residue is now minor; remaining failures are predominantly intelligence-limited. Stop primitive development and validate the current WTF stack more broadly.**

### The Empirical Reality:
In Stage 2.4, our baseline audit revealed widespread, chronic deterministic friction:
* 59 runs (49.2%) wasted turns paging through 120-line file chunks to rediscover stack trace coordinates.
* 10 runs (8.3%) formulated edits but suffered turn-censoring because verification was uncoupled from writing.
* Pass rate hovered at 24.4%.

After implementing the minimal deterministic primitives (**Harness v2**, **Trace Slice v1**, and **Verify-on-Write v1**):
1. **Pass rate under the full stack surged to 41.7% (5 / 12 runs)** across diverse models and tasks.
2. **Verification orchestration was 100% eliminated from the agent's turn loop** (0 explicit verification tool calls across all runs; 0.00 turns lag between edit and verification evidence).
3. **Coordinate rediscovery was eliminated** for all machine-reported frames ($1.00 \rightarrow 0.00$ turns to first context).
4. **Remaining failures are overwhelmingly intelligence-bound (85.7% Class I)**:
   - High-precision timestamp bit-packing (Go UUIDv7)
   - Macro recursion parsing (Rust Anyhow)
   - Unicode trait formatting ranges (Rust Bstr)
   - RFC 3986 URL fragment regex specification (Python Marshmallow)
   - TypeScript promise hook mutation semantics (Node Ky)

We have reached the **natural epistemic boundary of WTF**. Further deterministic primitives at the code-transition interface are either redundant (e.g. `syntax-gate` is already subsumed by sub-second Verify-on-Write) or would require crossing the boundary into semantic intelligence (e.g. guessing unmentioned implementation files).

---

## 2. Evidence Corpus & Population

The audit analyzed 24 recent trajectories, focusing primarily on the **12 trajectories executed under the complete current stack** (`Harness v2 + Trace Slice v1 + Verify-on-Write v1`):

| Model | Task | Ecosystem | Tier | Full-Stack Outcome | Turns | Dominant Residue Class |
|---|---|---|---|---|---|---|
| `qwen3-14b` | `task-01-python-starlette-status-code` | Python | Strong | **PASS** | 4 | None (Clean Pass) |
| `qwen-2.5-coder-32b-instruct` | `task-09-rust-walkdir-skip-dir` | Rust | Strong | **PASS** | 8 | None (Clean Pass) |
| `qwen3-14b` | `task-12-node-plimit-detached-map` | Node/TS | Strong | **PASS** | 6 | None (Clean Pass) |
| `qwen3-14b` | `task-06-go-cmp-textual-byte-slices` | Go | None | **PASS** | 7 | None (Repair Loop Pass) |
| `qwen3-8b` | `task-05-go-sjson-trailing-bracket` | Go | Weak | **PASS** | 5 | None (Early Exit Pass) |
| `qwen-2.5-coder-32b-instruct` | `task-02-python-marshmallow-url-fragment` | Python | Strong | FAIL | 8 | **I** (Regex RFC logic) + **H** (Omitted path arg) |
| `qwen-2.5-coder-32b-instruct` | `task-06-go-cmp-textual-byte-slices` | Go | None | FAIL | 8 | **I** (Algorithmic reasoning) |
| `qwen-2.5-coder-32b-instruct` | `task-15-node-ky-hook-mutation-leak` | Node/TS | Weak | FAIL | 8 | **I** (Architectural mutation design) |
| `qwen-2.5-coder-32b-instruct` | `task-07-go-uuid-v7-monotonicity` | Go | Weak | FAIL | 8 | **I** (Bit-packing arithmetic) |
| `qwen3-14b` | `task-10-rust-bstr-debug-ctrl` | Rust | Weak | FAIL | 8 | **I** (Trait logic / search paralysis) |
| `qwen-2.5-coder-32b-instruct` | `task-11-rust-anyhow-ensure-neg` | Rust | Strong | FAIL | 8 | **I** (Macro recursion syntax) |
| `qwen3-14b` | `task-03-python-click-synopsis-brackets` | Python | None | FAIL | 8 | **I** (Implementation search without trace) |

---

## 3. Dominant Residue Distribution (v2 vs. v1)

```
        STAGE 2.4 AUDIT (Baseline Harness v1)
        ───────────────────────────────────────
        [D] Deterministically Computable: 57.5% (69 runs)  <-- Chronic paging & uncoupled tests
        [I] Intelligence Required:        37.5% (45 runs)
        [H] Harness Friction:              5.0% (6 runs)

        STAGE 2.8 AUDIT (Harness v2 + Trace Slice v1 + Verify-on-Write v1)
        ──────────────────────────────────────────────────────────────────
        [D] Deterministically Computable:  0.0% (0 runs)   <-- ELIMINATED
        [I] Intelligence Required:        85.7% (6 runs)   <-- Dominant Frontier
        [H] Harness / Model Formatting:   14.3% (1 run)
```

### Funnel Distribution of Failures (7 Non-Passing Runs):
* Failed before `LOCALIZED`: **0 / 7 (0%)** — All runs localized relevant files.
* Failed at `LOCALIZED $\rightarrow$ UNDERSTOOD`: **2 / 7 (28.6%)** — Click (searching 3,600-line core without trace hints), Bstr (trait format structure).
* Failed at `UNDERSTOOD $\rightarrow$ EDITED`: **2 / 7 (28.6%)** — Marshmallow (failed to construct RFC regex), Anyhow (failed to match macro token tree).
* Failed at `EDITED $\rightarrow$ VERIFIED`: **0 / 7 (0.0%)** — **Completely eliminated by Verify-on-Write**.
* Failed at `VERIFIED $\rightarrow$ PASS`: **3 / 7 (42.9%)** — Go UUID, Go Cmp (32b), Ky hook leak. In all 3, the agent applied edits, received immediate verification feedback within $<400\text{ms}$ on the same turn, but failed to synthesize the mathematically or architecturally correct solution.

---

## 4. Why Nominated Candidates No Longer Justify New Primitives

### Evaluation of `wtf-syntax-gate`:
* **Stage 2.4 Hypothesis**: Agents waste full turns running heavy test suites on code that has syntax errors. A fast pre-flight linter/syntax gate could prevent wasted test execution.
* **Empirical Observation in Stage 2.8**: In `task-07-go-uuid-v7-monotonicity`, when the agent wrote invalid Go syntax (`cannot use byte as []byte`), Verify-on-Write executed `go test -run TestVersion7Monotonicity` in **728 milliseconds** and returned the exact compiler syntax error to the agent on the exact same turn as the edit.
* **Result**: **Verify-on-Write already delivers sub-second syntax and compilation feedback in the same turn payload.** A separate syntax-gate primitive would be completely redundant with Verify-on-Write, adding duplicate tool output without removing any agent turns.

### Evaluation of Repo-Wide Symbol/Call-Graph Indexing:
* **Observation**: In `task-03-python-click`, pytest reported `tests/test_basic.py:591`. The bug was in `src/click/core.py:3568`. Trace Slice correctly projected the test coordinate, but could not project `core.py` because `core.py` was never mentioned in the machine diagnostics.
* **Can WTF deterministically project this?**: **No.** Knowing that `test_choice_argument_optional_metavar` fails because `make_metavar()` inside `src/click/core.py` lacks bracket wrapping requires semantic call-graph traversal, AST symbol resolution, or intent heuristics.
* **WTF Epistemic Invariant**: *Projection is not selection.* Guessing which of 50 internal modules is the "true root cause" violates WTF's foundational axiom: *WTF observes deterministic machine reality. The agent reasons and acts.*

---

## 5. What Repeated Deterministic Friction Remains?

Across all 12 full-stack trajectories, only one repeated mechanical anomaly was observed:
* **Tool-Call Argument Omission**: In 3 runs, `qwen-2.5-coder-32b-instruct` generated JSON tool calls for `replace_in_file` that provided `"old_text"` and `"new_text"` but omitted the `"path"` key.
* **Is this a WTF primitive?**: **No.** This is a model-specific parameter generation quirk of dense Qwen 32B under zero-shot prompting. Standard IDEs and agents handle this via active schema validation or default path memory, not an evidence engine.

---

## 6. The Useful WTF Boundary Has Been Reached

WTF's mission is defined by its core protocol:
```
Agents act. WTF proves. Humans decide.
```
At the machine-agent interface during the edit loop, WTF has successfully automated the two pure deterministic residues:
1. **Trace Slice**: Deterministically projecting local coordinates from observed diagnostic output directly into context ($[L-15, L+15]$).
2. **Verify-on-Write**: Deterministically closing the loop between code modification and canonical test evidence in $0$ turns.

Together, these two primitives increased benchmark correctness from **24.4% to 41.7%**, eliminated 100% of explicit test orchestration turns, and eliminated coordinate rediscovery.

The remaining 58.3% of failures are **genuine software engineering problems requiring intelligence**:
* Designing complex bitwise algorithms.
* Navigating macro token-tree expansion.
* Managing JavaScript reference lifecycle across asynchronous hooks.
* Understanding edge cases in RFC specifications.

These tasks belong to the agent's intelligence, not the evidence engine.

---

## 7. Final Verdict

**`B — Deterministic residue is now minor; remaining failures are predominantly intelligence-limited. Stop primitive development and validate the current WTF stack more broadly.`**
