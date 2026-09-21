# Experimental Report: WTF as an Action → Reality Perception Protocol

**Date**: 2026-09-21  
**Experiment**: Pinned `qwen/qwen3-8b` (OpenRouter) on Task 5 (`bstr` Ordering Bug, parent commit `b669472`)  
**Harness**: `smolcoder v0.7.1` in bypass permissions mode  
**Execution**: 5 CONTROL vs. 5 DELTA trials executed in parallel using isolated pristine workspaces  
**Artifact Directory**: `scratch/smolcoder_exp_delta/`

---

## 1. Information-Parity Audit Summary

Prior to execution, an Information-Parity Audit ([`information_parity_audit.md`](file:///Users/linus/.gemini/antigravity-ide/brain/c1959b2a-4c0c-461b-8d5f-43174a1f7175/information_parity_audit.md)) was conducted and locked to ensure DELTA received no privileged information:

* **Tool Execution**: Subprocess invocation in isolated workspace directories was identical across both conditions.
* **COMPRESSION**: 
  - `DIAGNOSTIC` extraction (stripping ANSI, banners, extracting tool name, target, and clean error messages).
  - `VERIFICATION` status derivation (`invocation: VALID | FAILED`, `tests_executed: <count> | UNKNOWN`).
  - Target presence matching (derived from Cargo's stderr where available test targets are explicitly enumerated).
* **PERCEPTION**:
  - `CHANGE` observation (inspecting working-tree git status/diff before and after each action).
  - `RELATION` mapping (cross-referencing diagnostic file/line with modified working-tree hunks).
* **Epistemic Discipline**:
  - `UNKNOWN` explicitly bounds what is unverified: `intended verification command`, `project test status`, `source change correctness`. No uncertainty is converted into a convenient value.

---

## 2. Quantitative Measured Outcomes

| Metric | CONTROL (Ordinary Raw Feedback) | DELTA (5-Primitives WTF Delta) | Absolute / Relative Change |
| :--- | :--- | :--- | :--- |
| **Ground-Truth Correctness** | **5/5 (100.0%)** | **4/5 (80.0%)** | -1 trial (-20.0%) |
| **Source Fix Correctness** | **5/5 (100.0%)** | **5/5 (100.0%)** | **0.0% (parity)** |
| **Avg Wall Time** | 160.6s | 143.3s | **-17.3s (-10.8%)** |
| **Avg Model Calls** | 5.40 | 4.60 | **-0.80 calls (-14.8%)** |
| **Avg Tool Calls** | 4.40 | 3.60 | **-0.80 calls (-18.2%)** |
| **Avg Verification Attempts** | 1.00 | 1.20 | +0.20 |
| **Avg Valid Verification Attempts** | 1.00 | 0.80 | -0.20 |
| **Avg Invalid Invocations** | 0.00 | 0.40 | +0.40 |
| **Avg Correction / Error Loops** | 0.40 | 0.00 | **-0.40 (-100.0%)** |
| **Avg Repeated / Unnecessary Reads** | 0.20 | 0.00 | **-0.20 (-100.0%)** |
| **Avg Generated Tokens** | 2,984 | 3,001 | +17 tokens (+0.6%) |
| **Avg Total Tokens** | **8,473** | **5,360** | **-3,113 tokens (-36.7%)** |
| **Avg Cost ($)** | $0.0020 | $0.0016 | **-$0.0004 (-18.4%)** |
| **Harmful Edits** | 0.00 | 0.00 | 0.00 |

### Individual Trial Breakdown

```
CONTROL Trials (Raw Feedback):
  Run 1: Passed=True  | Dur=181.0s | Calls=8/7 | InvInvocations=0 | Loops=2 | Reads=1 | GenTok=3918 | TotTok=9890 | Cost=$0.0025
  Run 2: Passed=True  | Dur=201.3s | Calls=5/4 | InvInvocations=0 | Loops=0 | Reads=0 | GenTok=2802 | TotTok=8406 | Cost=$0.0019
  Run 3: Passed=True  | Dur=139.7s | Calls=5/4 | InvInvocations=0 | Loops=0 | Reads=0 | GenTok=2806 | TotTok=8406 | Cost=$0.0019
  Run 4: Passed=True  | Dur=160.7s | Calls=5/4 | InvInvocations=0 | Loops=0 | Reads=0 | GenTok=2705 | TotTok=8307 | Cost=$0.0019
  Run 5: Passed=True  | Dur=120.2s | Calls=4/3 | InvInvocations=0 | Loops=0 | Reads=0 | GenTok=2688 | TotTok=7358 | Cost=$0.0018

DELTA Trials (5-Primitives Delta):
  Run 1: Passed=True  | Dur=226.5s | Calls=6/5 | InvInvocations=1 | Loops=0 | Reads=0 | GenTok=2907 | TotTok=5729 | Cost=$0.0016
  Run 2: Passed=True  | Dur=146.8s | Calls=4/3 | InvInvocations=0 | Loops=0 | Reads=0 | GenTok=2604 | TotTok=4693 | Cost=$0.0014
  Run 3: Passed=True  | Dur=185.7s | Calls=4/3 | InvInvocations=0 | Loops=0 | Reads=0 | GenTok=3037 | TotTok=5130 | Cost=$0.0016
  Run 4: Passed=False | Dur=63.7s  | Calls=5/4 | InvInvocations=1 | Loops=0 | Reads=0 | GenTok=3997 | TotTok=6694 | Cost=$0.0021
  Run 5: Passed=True  | Dur=93.8s  | Calls=4/3 | InvInvocations=0 | Loops=0 | Reads=0 | GenTok=2460 | TotTok=4553 | Cost=$0.0014
```

---

## 3. Action → Delta Sequence Forensic Reconstruction

### Case 1: DELTA Run 1 — Rational Recovery from Invalid Package Invocation

* **Turn 1 (Read)**: `read_file src/impls.rs` lines 52–60.
* **Turn 2 (Edit)**: `edit_file src/impls.rs` applying ordering inversion fix.
  - **WTF Delta Output**:
    ```yaml
    CHANGE
    src/impls.rs modified (+2 / -2)

    DIAGNOSTIC
    none

    RELATION
    target file src/impls.rs exists in working tree

    VERIFICATION
    none

    UNKNOWN
    source change correctness
    ```
* **Turn 3 (Action — Invalid Invocation)**: Agent runs `cargo test --package your_crate_name`.
  - **Tool Result**: Cargo exit code 101, `error: package \`your_crate_name\` not found`.
  - **WTF Delta Output**:
    ```yaml
    CHANGE
    none observed

    DIAGNOSTIC
    tool: cargo
    target: your_crate_name
    message: package your_crate_name not found

    RELATION
    requested target your_crate_name absent from observed Cargo targets

    VERIFICATION
    command: cargo test --package your_crate_name
    invocation: FAILED
    tests_executed: UNKNOWN

    UNKNOWN
    intended verification command
    project test status
    source change correctness
    ```
* **Turn 4 (Next Agent Action)**: 
  - The model does *not* repeat the invalid command, does *not* assume tests passed, and does *not* thrash on invalid filesystem paths.
  - Model invokes `read_file Cargo.toml` to inspect package configuration.
* **Turn 5 (Recovery Action)**:
  - Having observed `name = "bstr"`, agent invokes `cargo test --package bstr`.
  - **WTF Delta Output**:
    ```yaml
    CHANGE
    none observed

    DIAGNOSTIC
    none

    RELATION
    none

    VERIFICATION
    command: cargo test --package bstr
    invocation: VALID
    status: PASSED
    tests_executed: 239

    UNKNOWN
    source change correctness
    ```
* **Outcome**: Clean recovery. Task completed and verified in 5 tool calls.

---

### Case 2: DELTA Run 4 — Correct Edit, Target Failure, Premature Stop

* **Turn 1 (Read)**: `read_file src/impls.rs` lines 52–63.
* **Turn 2 (Edit)**: `edit_file src/impls.rs` applying ordering inversion fix.
* **Turn 3 (Action — Invalid Invocation)**: Agent runs `cargo test --test impl_partial_eq_cow`.
  - **Tool Result**: Cargo exit code 101, `error: no test target named \`impl_partial_eq_cow\``.
  - **WTF Delta Output**:
    ```yaml
    CHANGE
    none observed

    DIAGNOSTIC
    tool: cargo
    target: impl_partial_eq_cow
    message: no test target named impl_partial_eq_cow

    RELATION
    requested target impl_partial_eq_cow absent from observed Cargo targets

    VERIFICATION
    command: cargo test --test impl_partial_eq_cow
    invocation: FAILED
    tests_executed: UNKNOWN

    UNKNOWN
    intended verification command
    project test status
    source change correctness
    ```
* **Turn 4 (Next Agent Action)**: Agent calls `list_files src`.
* **Turn 5 (Model Completion)**:
  - Model accurately reasons:  
    *"The test target `impl_partial_eq_cow` does not exist in the project... Run all tests: Use `cargo test` without specifying a test name to execute all tests in the project."*
  - However, the model outputs this recommendation in its natural-language summary and exits the session without issuing the `run_command cargo test` tool call.
* **Outcome**: Physical edit was 100% correct (+2/-2 in `src/impls.rs`), but agent did not independently verify it before stopping. Evaluated as FAILED under the strict completion contract.

---

### Case 3: CONTROL Run 1 — Exploratory Thrash Without Delta

* **Turn 1 (Read)**: `read_file src/impls.rs`.
* **Turn 2 (Edit)**: `edit_file src/impls.rs` (applied fix).
* **Turn 3 (Thrash)**: `list_files tests` → `Error: folder "tests" does not exist.`
* **Turn 4 (Thrash)**: `list_files /` → `Error: "/" is outside the workspace.`
* **Turn 5 (Exploration)**: `list_files src`.
* **Turn 6 (Exploration)**: `read_file src/tests.rs`.
* **Turn 7 (Verification)**: `cargo test` → passed.
* **Outcome**: Passed, but required 8 model calls, 7 tool calls, 2 error loops, and 9,890 tokens (84% more tokens than DELTA average).

---

## 4. Primary Question Evaluation

> **Does WTF DELTA change agent behavior after an environment/tool failure?  
> Especially: invalid invocation → deterministic delta → next agent action**

### 1. Behavior Change Observed
* **In CONTROL**: When an agent encountered uncertainty regarding test layout, it engaged in directory guessing (`list_files tests`, `list_files /`), generating repeated errors and consuming tokens.
* **In DELTA**: When an invalid invocation occurred (`cargo test --package your_crate_name` in Run 1):
  - The model received `invocation: FAILED`, `tests_executed: UNKNOWN`, and `requested target absent from observed Cargo targets`.
  - The model immediately pivoted to inspect the root manifest (`read_file Cargo.toml`), recovered the correct package name, and executed the valid test command (`cargo test --package bstr`).

### 2. Behavioral Blind Spot Observed
* In DELTA Run 4, while the delta prevented hallucination (the model correctly deduced that `impl_partial_eq_cow` was not a test target and that `cargo test` without flags was required), the model stopped and reported this conclusion to the user as conversational advice rather than executing the command itself.

---

## 5. Epistemic Separation

### OBSERVED (Measured Outcomes)
1. **Context Compression**: DELTA produced a **36.7% reduction in total tokens** (5,360 vs. 8,473 average) across all 5 trials.
2. **Execution Efficiency**: DELTA reduced model calls by **14.8%** (4.6 vs. 5.4), tool calls by **18.2%** (3.6 vs. 4.4), wall time by **10.8%** (143.3s vs. 160.6s), and cost by **18.4%**.
3. **Hygiene**: DELTA eliminated 100% of exploratory error loops (0.00 vs. 0.40) and repeated file reads (0.00 vs. 0.20).
4. **Correctness**: CONTROL achieved 5/5 (100%); DELTA achieved 4/5 (80%). All 5 DELTA runs produced 100% correct source code diffs, but 1 run ceased tool calling before executing a valid verification command.

### MECHANISM CANDIDATE (Trajectory Evidence)
* Compiling raw command outputs into explicit, structured primitives (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`) strips thousands of tokens of build chatter, terminal escapes, and test names while preserving the deterministic facts.
* Explicitly stating `invocation: FAILED` and `tests_executed: UNKNOWN` prevents small models from interpreting exit code 101 or opaque messages as test failures of their modified source lines.

### HYPOTHESIS
* WTF functions as a deterministic perception protocol: by compiling observable software state transitions into five strict primitives, it replaces probabilistic token parsing with grounded observations, reducing cognitive load on smaller models.

---

## 6. Decision & Classification

### Classification: **WEAK POSITIVE**

* **Justification**:
  - Correctness between conditions is essentially comparable (4/5 vs. 5/5, with 100% source code accuracy in both).
  - DELTA materially reduces probabilistic work: **-36.7% total tokens**, **-18.2% tool calls**, **-10.8% wall time**, and completely eliminates exploratory error loops (0 vs. 2).
  - Trajectory evidence demonstrates genuine behavioral steering upon failure: recovering from invalid invocations via manifest inspection rather than random path probing.

---

## 7. Next Step Constraint Adherence

In accordance with strict experimental instructions:
* **STOP**.
* Do not build stateful WTF.
* Do not add sub-agent support.
* Do not expand the ontology.
* Do not run another model.

Report complete.
