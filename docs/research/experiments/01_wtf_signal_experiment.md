# WTF Signal Experiment Report: Deterministic Perception vs. Model Reasoning

**Date**: September 20, 2026  
**Objective**: Determine whether deterministic perceptual receipts from WTF help a smaller/weaker coding model (`qwen2.5:3b`) achieve better outcomes or use less reasoning than the same model without WTF.  
**Hypothesis Under Test**: *Better deterministic perception can reduce the amount of probabilistic intelligence required to complete software engineering tasks.*  
**Final Classification**: **`NEGATIVE SIGNAL`**

---

## 1. Executive Summary

We conducted an empirical A/B signal test across 5 externally sourced, real open-source bugs spanning 4 language ecosystems (TypeScript/Node, Python, Go, Rust). All tasks were frozen prior to execution, starting from identical parent commits. Both conditions used the exact same local model (`qwen2.5:3b` via Ollama), identical ReAct harness, identical tool budget (max 8 turns), and identical prompt instructions.

| Metric | Condition A (Control) | Condition B (WTF Protocol) | Delta |
| :--- | :---: | :---: | :---: |
| **Tasks Evaluated** | 5 | 5 | — |
| **True Ground Truth Fixes** | **0 / 5 (0%)** | **0 / 5 (0%)** | **0%** |
| **Total Prompt Tokens** | 24,059 | 42,365 | +76.1% |
| **Total Completion Tokens** | 2,614 | 5,881 | +125.0% |
| **Total Token Consumption** | **26,673** | **48,246** | **+80.8%** |
| **Average Tokens / Task** | 5,335 | 9,649 | +80.8% |
| **Total Turns Consumed** | 25 | 34 | +36.0% |
| **Total Wall Time** | 135.4s | 180.8s | +33.5% |
| **Tests Run by Agent** | 0 / 5 | 1 / 5 | +1 |
| **WTF Interventions Observed** | 0 | 1 | +1 |
| **Unsupported Claims** | 0 | 0 | 0 |

### Verdict: `NEGATIVE SIGNAL`
WTF's deterministic receipts **did not** help the 3B parameter model achieve better outcomes or reduce required reasoning. Instead, token usage increased by **80.8%**, wall time increased by **33.5%**, and ground truth correctness remained unchanged at **0%**. 

The fundamental failure mode is an **agent capability floor**: a 3B model lacks the working memory and multi-step reasoning required to interpret structured verification feedback and translate it into corrective code edits. Providing high-fidelity deterministic perception to a model below this reasoning threshold creates friction rather than leverage.

---

## 2. Experimental Setup & Frozen Tasks

### Hardware & Model Configuration
- **Model**: `qwen2.5:3b` (Q4_K_M GGUF, 3.09B parameters) executed locally on Apple Silicon Metal via Ollama.
- **Inference Hyperparameters**: `temperature: 0.2`, `num_predict: 1024`, non-streaming JSON mode.
- **Agent Harness**: ReAct tool loop with 5 standard tools:
  1. `read_file`: `{ path: string, start_line?: number, end_line?: number }`
  2. `replace_in_file`: `{ path: string, old_text: string, new_text: string }`
  3. `write_file`: `{ path: string, content: string }`
  4. `run_command`: `{ cmd: string }`
  5. `finish`: `{ summary: string }`
- **Budget**: Strictly 8 turns per task across both conditions.

### Frozen Benchmark Tasks
Tasks were selected from real commit histories of top repositories, with pre-existing automated suites verified clean before each run:

1. **`task-01-node-is-nan`** (`sindresorhus/is`, Node/TypeScript)
   - *Parent Commit*: `47415dc46aaa27ad491393af87978e873cb9fbb1`
   - *Issue*: `isInRange` silently returned `false` instead of throwing `TypeError` when a range tuple contained `NaN`.
2. **`task-02-node-ky-hooks`** (`sindresorhus/ky`, Node/TypeScript)
   - *Parent Commit*: `a8753dcc9a4e8771d4226f9b6d196064325a0fbc`
   - *Issue*: In `#raceBodyRead`, network/stream failures re-threw raw errors directly instead of routing through `this.#throwProcessedError(error)` to invoke `beforeError` hooks.
3. **`task-03-python-click-color`** (`pallets/click`, Python)
   - *Parent Commit*: `7925a3410d7098c28cfca3b2baa6c852666bbd14`
   - *Issue*: `style(..., fg=0)` dropped 256-color index `0` (black) because `if fg:` evaluated `0` as falsy. Fix required `if fg is not None:`.
4. **`task-04-go-gjson-overflow`** (`tidwall/gjson`, Go)
   - *Parent Commit*: `6ac9851f5247bff94b0df2262ea60096fc0afb83`
   - *Issue*: `parseInt` and `parseUint` overflowed into negative or wrapped numbers on large 64-bit inputs rather than clamping to `math.MaxInt64` / `math.MaxUint64`.
5. **`task-05-rust-bstr-ordering`** (`BurntSushi/bstr`, Rust)
   - *Parent Commit*: `b669472014bd90751fe542d6ac4d3b776129adf5`
   - *Issue*: Macro `impl_partial_eq_cow` inverted `$lhs` and `$rhs` arguments in the secondary implementation, causing `(&**other).as_ref()` to be invoked on `self`.

---

## 3. Detailed Task-by-Task Results

| Task ID | Condition | Turns | Tokens | Wall Time | Agent Tests | WTF Used | Ground Truth | Primary Failure Mechanism |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **task-01 (is)** | Control | 4 | 3,049 | 16.4s | No | No | ✗ Fail | Replaced valid fallthrough with buggy `some(isNaN)` condition |
| | WTF | 6 | 7,514 | 30.8s | No | **Yes** | ✗ Fail | `replace_in_file` failed; agent ran `wtf verify`, saw clean tree, assumed done |
| **task-02 (ky)** | Control | 4 | 4,391 | 31.7s | No | No | ✗ Fail | Inserted `await this.#throwProcessedError` in static context (line 220) |
| | WTF | 4 | 2,233 | 13.0s | No | No | ✗ Fail | Identical static context error; called `finish` without running `wtf` |
| **task-03 (click)** | Control | 8 | 7,941 | 22.0s | No | No | ✗ Fail | Model repeatedly failed to format exact whitespace for `replace_in_file` |
| | WTF | 8 | 6,117 | 20.8s | No | No | ✗ Fail | Identical indentation mismatch; hit 8-turn budget limit |
| **task-04 (gjson)** | Control | 4 | 4,022 | 11.5s | No | No | ✗ Fail | Used undefined symbol `MaxUint64` instead of `math.MaxUint64` |
| | WTF | 8 | 24,570 | 99.1s | No | No | ✗ Fail | Hallucinated Portuguese commentary, looped reading lines 2772-2791 |
| **task-05 (bstr)** | Control | 5 | 7,270 | 53.9s | No | No | ✗ Fail | Hallucinated Portuguese text, made zero edits, called finish |
| | WTF | 8 | 7,812 | 17.2s | **Yes** | No | ✗ Fail | Overwrote 1,343 lines with 7 lines via `write_file`; `cargo test` broke |

---

## 4. Qualitative Behavioral Analysis

### 1. Where WTF Appeared in the Loop (Task 1)
In `task-01-node-is-nan` (WTF condition):
- On Turn 1, the agent read lines 595–607.
- On Turns 2 and 3, the agent attempted `replace_in_file` with an indentation mismatch, which the tool rejected.
- On Turn 4, following the `AGENTS.md` instructions in its system prompt, the agent executed:
  `run_command: {"cmd": "node /Users/linus/Projects/WTF/bin/wtf.js verify"}`
- WTF executed immediately and returned:
  ```
  WTF — what just happened?
  3 files changed · +21 / -1
  VERIFIED
    ✓ tests       (1972ms)
    ✓ build       (1163ms)
  FILES
    • package.json                        +1/-1
    • .github/copilot-instructions.md     +10/-0
    • AGENTS.md                           +10/-0
  ```
- **The Observation Failure**: The model saw `VERIFIED ✓ tests ✓ build` in the receipt. Because the model lacked the capacity to inspect `FILES` and recognize that `source/index.ts` was *missing* from the diff, it concluded:
  > *"The changes were verified and no issues were found. The function now correctly handles ranges containing NaN... I can now complete the task."*
  It immediately called `finish`.

### 2. Destruction via Coarse Tools (Task 5)
In `task-05-rust-bstr-ordering` (WTF condition):
- On Turn 7, the model decided to write the fixed macro using `write_file` rather than `replace_in_file`.
- Instead of outputting the entire 1,350-line file, it emitted only the 7-line macro definition, deleting 99.5% of `src/impls.rs`.
- On Turn 8, the agent ran `cargo test`. The compiler failed with `error: cannot find macro ...`, and the turn budget expired.

### 3. Whitespace Fragility on 3B Models (Task 3)
In `task-03-python-click-color`, both Control and WTF spent 7 to 8 turns repeatedly attempting `replace_in_file`:
- The model produced: `"old_text": "if fg:\nif bg:\n"`
- The file contained 4-space indentations separated across 6 lines.
- The 3B model could not match multi-line whitespace consistently and exhausted its turn budget.

---

## 5. Answers to the Core Questions

### Q1: Can WTF's deterministic feedback receipts help a cheaper/weaker coding model achieve better outcomes?
**No.** At the 3B parameter tier (`qwen2.5:3b`), the model does not possess sufficient syntactic grounding or reasoning capacity to act upon deterministic receipts. When receipts were presented, the model either misread passing test suites as proof that its edit succeeded (even when the target file was untouched) or ignored the receipt completely.

### Q2: Can WTF reduce the amount of reasoning/tokens required?
**No.** The WTF protocol added prompt overhead (system instructions, `AGENTS.md`, and receipt parsing) that increased total token consumption by **+80.8%** and turns by **+36.0%** without producing any correct fixes.

### Q3: Is a larger study justified at this model tier?
**No.** Testing 3B models with WTF in autonomous software engineering benchmarks is premature. The limiting factor is not the quality of the feedback, but the agent's ability to:
1. Ground its edits in exact code text (`replace_in_file`).
2. Correlate receipt diffs (`FILES`) with intent.
3. Formulate self-repair strategies when tests fail.

---

## 6. Recommendations & Next Steps

1. **Threshold for Deterministic Perception**:
   Deterministic perception (`wtf` / `wtf verify`) is an amplifier for models that already have baseline task-completion capability (e.g., Sonnet 3.7, GPT-4o, DeepSeek-V3, Qwen-2.5-Coder-32B). It cannot substitute for basic reasoning. Future benchmark evaluations of WTF should target the **14B to 32B tier** (e.g., `qwen2.5-coder:14b` or `qwen2.5-coder:32b`) where agents can reliably edit files but frequently hallucinate completion status or introduce untested regressions.
2. **Receipt Negative Signals**:
   WTF receipts currently emphasize passing checks (`✓ tests`). For agents that made zero changes to target source files, WTF could emit an explicit `PAY ATTENTION: No changes detected in source code files` warning to prevent agents from misinterpreting a clean tree as a verified fix.
3. **Keep WTF Frozen**:
   As mandated by the experiment protocol, WTF itself was not modified and operated strictly as implemented.

---

## 7. Artifacts & Trajectory Archive

All raw logs, workspaces, and trajectory traces are preserved locally:
- **Results Summary**: [`signal_results.json`](file:///Users/linus/Projects/WTF/scratch/signal-experiment/signal_results.json)
- **Task 1 Trajectories**:
  - [Control](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-01-node-is-nan_control_trajectory.json)
  - [WTF](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-01-node-is-nan_wtf_trajectory.json)
- **Task 2 Trajectories**:
  - [Control](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-02-node-ky-hooks_control_trajectory.json)
  - [WTF](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-02-node-ky-hooks_wtf_trajectory.json)
- **Task 3 Trajectories**:
  - [Control](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-03-python-click-color_control_trajectory.json)
  - [WTF](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-03-python-click-color_wtf_trajectory.json)
- **Task 4 Trajectories**:
  - [Control](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-04-go-gjson-overflow_control_trajectory.json)
  - [WTF](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-04-go-gjson-overflow_wtf_trajectory.json)
- **Task 5 Trajectories**:
  - [Control](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-05-rust-bstr-ordering_control_trajectory.json)
  - [WTF](file:///Users/linus/Projects/WTF/scratch/signal-experiment/trajectories/task-05-rust-bstr-ordering_wtf_trajectory.json)
