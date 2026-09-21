# Evaluation Report: Deterministic Evidence Compilation in an Independent Coding Harness

## Status: FROZEN FOR SUBSEQUENT EXPERIMENTS

This report documents a controlled evaluation of WTF's deterministic **Evidence Compilation** primitive integrated beneath an independent coding harness: **smolcoder** (v0.7.1).

---

## 1. Experimental Framing & Scope

### The Claim Boundary
Across two small controlled experiments using different agent harnesses, replacing raw software feedback with the same deterministic Evidence Compilation primitive was associated with higher task success: **2/5 → 4/5** in the original harness and **3/5 → 4/5** in smolcoder. In the smolcoder experiment it was also associated with fewer model calls, tool calls, generated tokens, total tokens, cost, and successful-run wall time. 

These results are **directional evidence, not yet a general claim**.

> [!IMPORTANT]
> **WTF does not make the model smarter.**
> The hypothesis is that it makes software reality cheaper for the model to perceive.
>
> Furthermore, **WTF does NOT establish causality**. It establishes deterministic mechanical relationships:
> * diagnostic on changed line
> * diagnostic in changed file
> * diagnostic in unchanged file
> * exact changed hunk
> * verification command exit outcome
>
> **The causal relationship between diagnostics remains UNKNOWN.**

---

## 2. Experimental Setup & Reproducibility Record

All code, harness logic, and Evidence Compiler implementations are **FROZEN** as of this experiment.

| Component | Specification |
| :--- | :--- |
| **WTF Base Commit** | [`504e7987a58fdf7a2844649d745f1ff76b8b6680`](file:///Users/linus/Projects/WTF) |
| **Evidence Compiler Implementation** | [`src/core/evidence-compiler.ts`](file:///Users/linus/Projects/WTF/src/core/evidence-compiler.ts) (Deterministic regex/diff parser, zero LLM) |
| **Independent Harness** | [smolcoder](https://github.com/leonvanzyl/smolcoder) at commit [`4ee47b5b921b383ddc4e4544cfaa0279110ed124`](file:///Users/linus/Projects/WTF/scratch/smolcoder) (v0.7.1) |
| **Model** | `qwen/qwen3-coder-30b-a3b-instruct` via OpenRouter (pinned ID, no auto-router) |
| **Sampling & Context** | Temperature `0.2`, context window `32,768` tokens, `stream: true` |
| **Target Task** | Task 5: Rust `bstr` macro argument ordering bug in `src/impls.rs:52-58` |
| **Repository Starting State** | [`BurntSushi/bstr`](https://github.com/BurntSushi/bstr.git) commit [`b669472014bd90751fe542d6ac4d3b776129adf5`](file:///Users/linus/Projects/WTF/scratch/repos/bstr) |
| **Intervention Point** | `run_command` exit code != 0: raw terminal output replaced by `compileEvidence({ cmd, exitCode, stdout, stderr, gitDiff })` |
| **Execution Protocol** | Pairwise parallel (concurrency = 2: each pair ran 1 RAW + 1 EVIDENCE concurrently in isolated workspace clones) |
| **Raw Data & Logs** | [`smolcoder_results.json`](file:///Users/linus/Projects/WTF/scratch/smolcoder_exp/smolcoder_results.json), [`trajectories/`](file:///Users/linus/Projects/WTF/scratch/smolcoder_exp/trajectories) |

### Calibration Phase
Prior to the comparison run, `qwen/qwen3-coder-30b-a3b-instruct` was calibrated over 3 runs on Task 5 to ensure it fell within the capability boundary (target: 20%–80% success):
* **Trial 1**: Failed (5.7s, early empty reply)
* **Trial 2**: Passed (68.6s, correct fix in `src/impls.rs`)
* **Trial 3**: Passed (90.8s, correct fix in `src/impls.rs`)
* **Calibration Rate**: **2/3 (66.7%)**, confirming an appropriate boundary model.

---

## 3. Separation of Epistemic Levels

To avoid overclaiming, we strictly separate:
1. **OBSERVED**: The empirical measurements recorded during the runs.
2. **INTERPRETATION**: The conceptual explanation of why the observed patterns may have occurred.
3. **HYPOTHESIS**: The general proposition to be tested in future work.

---

### Level 1: OBSERVED (Empirical Measurements)

Sample size: **N = 5 runs per condition** on a single task, single model, and single independent harness.

#### Comparison Table: smolcoder RAW vs smolcoder + WTF EVIDENCE

| Observed Metric | smolcoder RAW (Control) | smolcoder + WTF EVIDENCE | Delta |
| :--- | :---: | :---: | :---: |
| **Ground-Truth Correctness** | **3 / 5 (60.0%)** | **4 / 5 (80.0%)** | +1 run (+20pp) |
| **Mean Wall Time (All Runs)** | 86.3s | 60.9s | -25.4s (-29.4%) |
| **Mean Wall Time (Successful Runs Only)** | **124.1s** | **72.3s** | **-51.8s (-41.7%)** |
| **Mean Turns (Model Calls / Run)** | 19.2 | 14.2 | -5.0 turns (-26.0%) |
| **Mean Tool Calls / Run** | 11.2 | 8.6 | -2.6 tools (-23.2%) |
| **Mean Verification Commands Executed** | 1.8 | 1.4 | -0.4 cmds (-22.2%) |
| **Mean Generated Output Tokens / Run** | 2,512 | 1,586 | -926 tokens (-36.9%) |
| **Mean Total Tokens (Prompt + Completion)** | 10,848 | 8,132 | -2,716 tokens (-25.0%) |
| **Mean Cost / Run ($ OpenRouter)** | $0.0013 | $0.0009 | -$0.0004 (-30.8%) |
| **Runs with Unchanged Files Touched / Leftover Files** | 1 / 5 (20%) | 0 / 5 (0%) | -1 run |

#### Individual Run Ledger

##### Condition A: smolcoder RAW (Control)
* **RAW 1**: `Passed=false` | 9.6s | 5 turns | 1 tool | 0 verifications | 4,096 total tok | $0.0003 (exited after empty reply nudge)
* **RAW 2**: `Passed=false` | 49.6s | 7 turns | 4 tools | 0 verifications | 8,483 total tok | $0.0008 (stalled after reading without editing)
* **RAW 3**: `Passed=true` | 125.2s | 25 turns | 15 tools | 2 verifications | 16,011 total tok | $0.0022 (verified fix)
* **RAW 4**: `Passed=true` | 124.8s | 29 turns | 16 tools | 3 verifications | 12,578 total tok | $0.0015 (entered cleanup thrashing loop on temporary test script)
* **RAW 5**: `Passed=true` | 122.3s | 30 turns | 20 tools | 4 verifications | 13,074 total tok | $0.0016 (verified fix after multiple test calls)

##### Condition B: smolcoder + WTF EVIDENCE (Experimental)
* **EVIDENCE 1**: `Passed=true` | 113.4s | 26 turns | 16 tools | 3 verifications | 10,767 total tok | $0.0018 (verified fix via `cargo test`)
* **EVIDENCE 2**: `Passed=false` | 15.4s | 8 turns | 2 tools | 0 verifications | 4,496 total tok | $0.0005 (**NEGATIVE EVIDENCE**: terminated on empty reply nudge; evidence did not rescue the model)
* **EVIDENCE 3**: `Passed=true` | 24.4s | 11 turns | 7 tools | 0 verifications | 5,136 total tok | $0.0006 (surgical edit directly in `src/impls.rs`)
* **EVIDENCE 4**: `Passed=true` | 66.0s | 10 turns | 8 tools | 1 verification | 7,978 total tok | $0.0008 (direct edit verified with single `cargo test`)
* **EVIDENCE 5**: `Passed=true` | 85.2s | 16 turns | 10 tools | 3 verifications | 12,284 total tok | $0.0008 (verified fix via `cargo test`)

#### Negative Evidence Preservation
* **EVIDENCE Run 2 failed completely**: The model emitted empty replies during turn 2, hit smolcoder's bounded empty-reply limit, and terminated without making an edit.
* WTF does not guarantee agent recovery, does not prompt the model, and does not alter the underlying model's stochastic tendencies.

---

### Level 2: INTERPRETATION (Mechanisms Suggested by Trajectories)

1. **Information Compression without Omniscience**:
   The Evidence Compiler produced **63.6% fewer diagnostic tokens while retaining the observed diagnostic facts required by the evidence contract**. It deliberately omitted ANSI color codes, cargo build progress bars, crate download status lines, documentation hyperlinks, and rustc help text.
2. **Reduction of Tangential Thrashing**:
   In RAW Run 4, the model attempted to write and compile an ad-hoc test file (`test_fix.rs`). When `rustc` failed, the verbose compiler output caused the model to enter a loop attempting invalid shell commands (`rm test_fix.rs test_fix` exiting 1, `rm test_fix.rs` exiting 1, `ls -la`, `plan show`).
   In the EVIDENCE condition, compiler failures did not present tangential rustc suggestions or cascading downstream warnings, which was associated with the agent staying within the boundaries of the target macro.
3. **Cross-Harness Consistency**:
   In the previous experiment (frozen custom harness, Qwen 14B), Evidence Compilation was associated with an increase in task success from **2/5 to 4/5**. In this experiment (smolcoder v0.7.1, Qwen 30B), Evidence Compilation was associated with an increase from **3/5 to 4/5**. The directional effect survived transfer across both model sizes and independently authored agent harnesses.

---

### Level 3: HYPOTHESIS (For Future Testing)

> **Hypothesis**: Some portion of the probabilistic reasoning currently demanded of coding models to interpret raw software and compiler outputs can be substituted with cheap, deterministic perception at the tool boundary.

This hypothesis predicts that:
* Smaller models suffer disproportionately from unstructured stderr noise.
* Providing mechanically correlated diagnostic subsets (diagnostics on changed lines vs unchanged files) lowers context clutter and reduces turn exhaustion.
* However, when a model fails for reasons unrelated to feedback interpretation (e.g. prompt misunderstanding, token-limit truncation, early empty replies as in EVIDENCE Run 2), deterministic perception provides zero offset.

---

## 4. Reproducibility & Freeze Commitment

1. **Code Freeze**:
   * WTF evidence compiler logic in [`src/core/evidence-compiler.ts`](file:///Users/linus/Projects/WTF/src/core/evidence-compiler.ts) is **FROZEN**.
   * No heuristics or task-specific regexes may be added based on this run.
2. **Artifact Integrity**:
   * Full raw trajectories and JSON summaries are archived in [`scratch/smolcoder_exp/`](file:///Users/linus/Projects/WTF/scratch/smolcoder_exp/).
3. **Verification**:
   * WTF repository test suite and 100/100 Gauntlet pass cleanly.
