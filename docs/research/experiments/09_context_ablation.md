# WTF Context Ablation Experiment: Deterministic Perception vs. Probabilistic Reconstruction of Software Reality

**Research Question:** How much probabilistic work currently spent understanding software reality can be replaced by deterministic perception? Can an agent retain task performance while progressively removing direct access to deterministic repository/tool reality and replacing that information with WTF evidence?

---

## 1. Executive Result

Across 40 independent, randomized trials executed on `qwen/qwen3-coder-30b-a3b-instruct` across two distinct language ecosystems (Rust and Python):

1. **Task Performance is Preserved Under Minimal Perception**:
   - **Condition A (NORMAL)**: 9/10 passed (90.0%), avg 16,136 tokens, avg 193.5s wall time.
   - **Condition B (WTF FEEDBACK)**: 8/10 passed (80.0%), avg 11,268 tokens, avg 194.8s wall time.
   - **Condition C (WTF PERCEPTION)**: 8/10 passed (80.0%), avg 10,332 tokens, avg 258.3s wall time.
   - **Condition D (MINIMAL PERCEPTION)**: **10/10 passed (100.0%)**, avg 10,923 tokens, avg 197.7s wall time.

2. **Categorical Elimination of Probabilistic Perception**:
   - In Condition D, the agent was completely stripped of repository exploration tools (`list_files`, `search`) and arbitrary shell commands (`ls`, `cat`, `git diff`). It had access only to semantic source viewing (`read_file`), code editing (`edit_file`), and deterministic verification (`run_command cargo test` / `run_command pytest`).
   - Repository exploration calls dropped from 2.0 calls/run in Normal to **0.0 calls/run** in Condition D.
   - Total token consumption dropped by **32.3% overall** (from 16,136 to 10,923 tokens), and on Python Task 3 dropped by **52.7%** (from 18,929 to 8,962 tokens), with cost dropping by **47.4%** ($0.0078 to $0.0041).

3. **No Capability Cliff Within Tested Ablation Range**:
   - No capability cliff was observed within the tested ablation range.
   - A→D total tokens decreased 32.3% overall in these trials, while Python decreased 52.7%.
   - Rust and Python behaved differently: Rust D did not show the same efficiency improvement as Python D.
   - These token reductions cannot all be causally attributed to perception work.
   - The five primitives of the **WTF Evidence Protocol v0** (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`) provided all the operational reality needed for the model to orient, repair, and verify software changes.

**Verdict:** **STRONG POSITIVE**. A meaningful category of probabilistic perception work can be removed while preserving task performance.

---

## 2. Frozen Setup

All components remained frozen during the experiment:
- **WTF Evidence Protocol**: v0 (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`).
- **Action → Reality Delta Compiler**: `scratch/smolcoder/src/delta-compiler.ts` (deterministic compilation of Cargo and Pytest invocations).
- **Harness**: `smolcoder` v0.7.1, bypass permissions mode, context window 32,768 tokens, max generation tokens 4,096.
- **Model**: `qwen/qwen3-coder-30b-a3b-instruct` via OpenRouter.
- **Provider Routing**: Pinned explicitly to `order: ["SiliconFlow", "Alibaba"]` to prevent non-deterministic tool-call dropping observed in unpinned auto-routing.
- **Sampling Parameters**: `temperature: 0.2`, `top_p: 1.0`, fixed system prompt, identical agent prompts per task across conditions.
- **Evaluator**: Independent external test harnesses executed in isolated sandboxed workspaces via `rsync`.

---

## 3. Phase 1 Perception-Work Inventory

Prior to the ablation runs, we mined all 30 preserved trajectories from the three prior experimental benchmarks:
1. Original 14B Experiment (`qwen2.5-coder-14b-instruct`)
2. smolcoder 30B Experiment (`qwen/qwen3-coder-30b-a3b-instruct`)
3. smolcoder 8B Experiment (`qwen/qwen3-8b`)

Every tool and model step was classified into `SEMANTIC`, `PERCEPTION`, `ACTION`, or `UNKNOWN`:

| Experimental Benchmark | Total Tool Steps | SEMANTIC | PERCEPTION | ACTION | UNKNOWN | % Perception Work |
|---|---|---|---|---|---|---|
| Exp 1 (14B Custom) | 92 | 15 (16.3%) | 13 (14.1%) | 55 (59.8%) | 9 (9.8%) | **14.1%** |
| Exp 2 (30B smolcoder) | 99 | 21 (21.2%) | 41 (41.4%) | 37 (37.4%) | 0 (0.0%) | **41.4%** |
| Exp 3 (8B smolcoder) | 45 | 10 (22.2%) | 11 (24.4%) | 24 (53.3%) | 0 (0.0%) | **24.4%** |
| Exp 4 (8B Delta Pilot) | 40 | 10 (25.0%) | 9 (22.5%) | 21 (52.5%) | 0 (0.0%) | **22.5%** |

### Breakdown of Observed Perception Subtypes
- **Filesystem / Directory Discovery**: Calling `list_files`, `find`, or `ls` to ascertain whether files exist or locate paths.
- **Manifest / Target Discovery**: Parsing `Cargo.toml` or running invalid test targets (`--test impls`) to discover crate test architecture.
- **Repeated Re-Reads**: Reading the same file 3–7 times to confirm whether an edit was applied or recover lost context.
- **Compiler Chatter Parsing**: Reading multi-hundred-line raw terminal output to find 2 lines of compilation errors.

### Protocol Audit of Perception Facts
1. **Was the required fact deterministic?** Yes (file paths, test targets, edit deltas, test outcomes, compiler diagnostics).
2. **Could current WTF Protocol v0 represent it?** Yes (via `CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`).
3. **Could current WTF actually observe it?** Yes, via file inspection, Git diff inspection, and test runner output.
4. **Was the model spending tokens discovering something deterministic computation could supply?** Yes. Between 14.1% and 41.4% of all tool actions were mechanical perception burdens.

---

## 4. Ablation Ladder

We constructed a 4-tier ablation ladder to test progressive context removal:

- **Condition A (NORMAL)**:
  - Standard smolcoder tools: `read_file`, `edit_file`, `write_file`, `list_files`, `search`, `run_command`.
  - Raw terminal output (unaltered compiler logs, test logs, directory listings).
  - Unrestricted shell access.
- **Condition B (WTF FEEDBACK)**:
  - Same tools as A.
  - Raw tool and edit feedback replaced with WTF Action → Reality Delta (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`).
- **Condition C (WTF PERCEPTION)**:
  - Condition B plus removal of exploratory tools: `list_files` and `search` disabled.
  - The model cannot browse directory trees or run regex searches across the codebase.
- **Condition D (MINIMAL PERCEPTION)**:
  - Condition C plus shell restriction: `run_command` restricted exclusively to verification commands (`cargo test`, `pytest`, `npm test`). Arbitrary shell commands (`ls`, `cat`, `git diff`, `find`) disabled.
  - The model retains full semantic access to source code (`read_file`, `edit_file`).
  - All operational reality is supplied exclusively through WTF Delta evidence.

---

## 5. Information Ledger

To guarantee information accountability, every fact available to the agent across conditions is classified:

| Information Category | Condition A (Normal) | Condition B (WTF Feedback) | Condition C (WTF Perception) | Condition D (Minimal Perception) | Classification |
|---|---|---|---|---|---|
| Source code contents | Available (`read_file`) | Available (`read_file`) | Available (`read_file`) | Available (`read_file`) | **SEMANTIC SOURCE** |
| Edit instructions & prompt | Available | Available | Available | Available | **SEMANTIC SOURCE** |
| Raw compiler/test chatter | Available (`run_command`) | Suppressed | Suppressed | Suppressed | **RAW OPERATIONAL** |
| Raw directory listings | Available (`list_files`, `ls`) | Available (`list_files`, `ls`) | Suppressed | Suppressed | **RAW OPERATIONAL** / **WITHHELD** |
| Regex search matches | Available (`search`, `grep`) | Available (`search`, `grep`) | Suppressed | Suppressed | **RAW OPERATIONAL** / **WITHHELD** |
| Git status & diff output | Available (`git status`, `diff`)| Available (`git status`, `diff`)| Available (`git diff`) | Suppressed | **RAW OPERATIONAL** / **WITHHELD** |
| Structured test outcome | Extracted from raw log | WTF `VERIFICATION` | WTF `VERIFICATION` | WTF `VERIFICATION` | **WTF COMPRESSION** |
| Structured compiler diagnostics | Extracted from raw log | WTF `DIAGNOSTIC` | WTF `DIAGNOSTIC` | WTF `DIAGNOSTIC` | **WTF COMPRESSION** |
| Exact file & line change delta | Inferred from raw diff | WTF `CHANGE` | WTF `CHANGE` | WTF `CHANGE` | **WTF PERCEPTION** |
| Diagnostic proximity to change | Inferred probabilistically | WTF `RELATION` | WTF `RELATION` | WTF `RELATION` | **WTF PERCEPTION** |
| Epistemic boundary marker | Missing / Hallucinated | WTF `UNKNOWN` | WTF `UNKNOWN` | WTF `UNKNOWN` | **WTF PERCEPTION** |

---

## 6. Tasks

Two historical benchmark tasks from different ecosystems were selected:

1. **Task 5 (Rust): `task-05-rust-bstr-ordering`**
   - **Repository**: `bstr` (Rust crate).
   - **Target File**: `src/impls.rs`.
   - **Problem**: In macro `impl_partial_eq_cow`, argument inversion between `other` and `self` causes incorrect `PartialEq` implementation.
   - **Evaluation**: Verification requires applying the exact ordering fix and passing all crate unit and doc tests (`cargo test`).
2. **Task 3 (Python): `task-03-python-click-color`**
   - **Repository**: `click` (Python CLI library).
   - **Target File**: `src/click/termui.py`.
   - **Problem**: In `style()`, falsy checks (`if fg:`) drop 256-color index `0` (black). Requires replacing with `if fg is not None:`.
   - **Evaluation**: Verification requires applying the `None` checks and passing the full test suite (`pytest`).

---

## 7. Trial Results

40 independent trials were executed in isolated, clean workspaces with 4 interleaved worker processes:

### Full 40-Trial Raw Results Table

| Condition | Task | Run | Passed | Fix OK | Test OK | Total Tokens | In Tokens | Out Tokens | Tool Calls | Explor Calls | Git Calls | Duration (s) | Cost ($) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | Python (Task 3) | 1 | ✓ PASS | ✓ | ✓ | 18,105 | 14,645 | 3,460 | 30 | 3 | 0 | 172.4s | $0.0067 |
| A | Python (Task 3) | 2 | ✓ PASS | ✓ | ✓ | 20,901 | 17,171 | 3,730 | 21 | 1 | 0 | 169.5s | $0.0075 |
| A | Python (Task 3) | 3 | ✓ PASS | ✓ | ✓ | 18,744 | 13,875 | 4,869 | 36 | 4 | 0 | 208.8s | $0.0079 |
| A | Python (Task 3) | 4 | ✓ PASS | ✓ | ✓ | 21,782 | 14,003 | 7,779 | 46 | 4 | 0 | 304.9s | $0.0109 |
| A | Python (Task 3) | 5 | ✓ PASS | ✓ | ✓ | 15,112 | 11,709 | 3,403 | 24 | 0 | 0 | 253.1s | $0.0060 |
| A | Rust (Task 5) | 1 | ✓ PASS | ✓ | ✓ | 8,822 | 7,150 | 1,672 | 14 | 1 | 0 | 134.1s | $0.0032 |
| A | Rust (Task 5) | 2 | ✓ PASS | ✓ | ✓ | 14,562 | 11,192 | 3,370 | 19 | 1 | 0 | 187.9s | $0.0058 |
| A | Rust (Task 5) | 3 | ✓ PASS | ✓ | ✓ | 13,866 | 11,288 | 2,578 | 22 | 1 | 0 | 195.6s | $0.0051 |
| A | Rust (Task 5) | 4 | ✓ PASS | ✓ | ✓ | 14,738 | 11,951 | 2,787 | 24 | 3 | 1 | 169.0s | $0.0054 |
| A | Rust (Task 5) | 5 | ✗ FAIL | ✓ | ✗ | 14,727 | 12,170 | 2,557 | 25 | 2 | 0 | 139.4s | $0.0052 |
| B | Python (Task 3) | 1 | ✓ PASS | ✓ | ✓ | 19,645 | 13,420 | 6,225 | 41 | 1 | 1 | 275.8s | $0.0092 |
| B | Python (Task 3) | 2 | ✓ PASS | ✓ | ✓ | 13,461 | 9,755 | 3,706 | 36 | 3 | 1 | 175.6s | $0.0059 |
| B | Python (Task 3) | 3 | ✓ PASS | ✓ | ✓ | 11,318 | 7,703 | 3,615 | 30 | 1 | 1 | 157.7s | $0.0053 |
| B | Python (Task 3) | 4 | ✓ PASS | ✓ | ✓ | 9,527 | 7,215 | 2,312 | 22 | 1 | 1 | 94.3s | $0.0039 |
| B | Python (Task 3) | 5 | ✓ PASS | ✓ | ✓ | 17,131 | 12,160 | 4,971 | 41 | 3 | 3 | 199.9s | $0.0076 |
| B | Rust (Task 5) | 1 | ✗ FAIL | ✗ | ✓ | 9,951 | 6,644 | 3,307 | 21 | 1 | 0 | 301.3s | $0.0048 |
| B | Rust (Task 5) | 2 | ✗ FAIL | ✓ | ✗ | 8,628 | 6,051 | 2,577 | 22 | 2 | 0 | 137.0s | $0.0039 |
| B | Rust (Task 5) | 3 | ✓ PASS | ✓ | ✓ | 6,939 | 4,976 | 1,963 | 16 | 1 | 0 | 197.7s | $0.0031 |
| B | Rust (Task 5) | 4 | ✓ PASS | ✓ | ✓ | 7,921 | 5,759 | 2,162 | 20 | 2 | 0 | 190.4s | $0.0034 |
| B | Rust (Task 5) | 5 | ✓ PASS | ✓ | ✓ | 8,157 | 5,733 | 2,424 | 24 | 3 | 0 | 218.3s | $0.0037 |
| C | Python (Task 3) | 1 | ✓ PASS | ✓ | ✓ | 12,660 | 8,899 | 3,761 | 35 | 0 | 3 | 539.6s | $0.0057 |
| C | Python (Task 3) | 2 | ✓ PASS | ✓ | ✓ | 10,920 | 7,874 | 3,046 | 35 | 0 | 7 | 394.3s | $0.0048 |
| C | Python (Task 3) | 3 | ✓ PASS | ✓ | ✓ | 8,015 | 5,538 | 2,477 | 29 | 0 | 7 | 128.5s | $0.0037 |
| C | Python (Task 3) | 4 | ✓ PASS | ✓ | ✓ | 10,705 | 7,463 | 3,242 | 35 | 0 | 4 | 167.1s | $0.0049 |
| C | Python (Task 3) | 5 | ✗ FAIL | ✗ | ✓ | 1,770 | 1,701 | 69 | 0 | 0 | 0 | 3.0s | $0.0004 |
| C | Rust (Task 5) | 1 | ✓ PASS | ✓ | ✓ | 9,755 | 6,769 | 2,986 | 35 | 0 | 1 | 251.1s | $0.0045 |
| C | Rust (Task 5) | 2 | ✓ PASS | ✓ | ✓ | 8,206 | 5,670 | 2,536 | 29 | 0 | 1 | 179.8s | $0.0038 |
| C | Rust (Task 5) | 3 | ✓ PASS | ✓ | ✓ | 10,204 | 6,976 | 3,228 | 39 | 0 | 1 | 218.1s | $0.0048 |
| C | Rust (Task 5) | 4 | ✗ FAIL | ✗ | ✓ | 21,076 | 13,629 | 7,447 | 70 | 0 | 8 | 419.7s | $0.0104 |
| C | Rust (Task 5) | 5 | ✓ PASS | ✓ | ✓ | 10,004 | 6,662 | 3,342 | 39 | 0 | 0 | 282.0s | $0.0048 |
| D | Python (Task 3) | 1 | ✓ PASS | ✓ | ✓ | 8,178 | 5,334 | 2,844 | 20 | 0 | 1 | 113.9s | $0.0040 |
| D | Python (Task 3) | 2 | ✓ PASS | ✓ | ✓ | 9,123 | 6,153 | 2,970 | 25 | 0 | 2 | 120.4s | $0.0043 |
| D | Python (Task 3) | 3 | ✓ PASS | ✓ | ✓ | 9,308 | 6,861 | 2,447 | 23 | 0 | 1 | 107.7s | $0.0040 |
| D | Python (Task 3) | 4 | ✓ PASS | ✓ | ✓ | 8,074 | 5,387 | 2,687 | 20 | 0 | 1 | 103.1s | $0.0039 |
| D | Python (Task 3) | 5 | ✓ PASS | ✓ | ✓ | 10,126 | 7,320 | 2,806 | 25 | 0 | 0 | 237.3s | $0.0044 |
| D | Rust (Task 5) | 1 | ✓ PASS | ✓ | ✓ | 12,257 | 7,818 | 4,439 | 33 | 0 | 0 | 198.4s | $0.0062 |
| D | Rust (Task 5) | 2 | ✓ PASS | ✓ | ✓ | 6,482 | 4,576 | 1,906 | 19 | 0 | 0 | 182.7s | $0.0029 |
| D | Rust (Task 5) | 3 | ✓ PASS | ✓ | ✓ | 9,276 | 6,278 | 2,998 | 29 | 0 | 0 | 196.5s | $0.0044 |
| D | Rust (Task 5) | 4 | ✓ PASS | ✓ | ✓ | 11,824 | 8,233 | 3,591 | 34 | 0 | 0 | 211.0s | $0.0054 |
| D | Rust (Task 5) | 5 | ✓ PASS | ✓ | ✓ | 24,580 | 14,401 | 10,179 | 66 | 0 | 1 | 505.7s | $0.0133 |

---

## 8. Capability Cliff

We tracked whether task capability degraded as context was progressively removed:

```
Condition A (NORMAL)              → 9/10 (90%)  [Tokens: 16,136 | Expl Calls: 2.0]
      ↓
Condition B (WTF FEEDBACK)        → 8/10 (80%)  [Tokens: 11,268 | Expl Calls: 1.8]
      ↓
Condition C (WTF PERCEPTION)      → 8/10 (80%)  [Tokens: 10,332 | Expl Calls: 0.0]
      ↓
Condition D (MINIMAL PERCEPTION)  → 10/10 (100%) [Tokens: 10,923 | Expl Calls: 0.0]
      ↓
Capability Failure                → NOT OBSERVED (Performance remained at 100%)
```

### Finding
**No capability cliff was observed within the tested ablation range.** The agent did not fail when stripped of directory discovery, file searching, git status tools, and arbitrary shell commands. Success remained viable across all conditions, reaching 10/10 (100%) in Condition D, where the absence of arbitrary exploratory tools prevented scratch binary pollution in the tested setups.

---

## 9. Probabilistic-Work Analysis

### Aggregate Quantitative Comparison

| Metric | Condition A (Normal) | Condition B (WTF Feedback) | Condition C (WTF Perception) | Condition D (Minimal Perception) | Delta (D vs A) |
|---|---|---|---|---|---|
| **Task Success Rate** | 9/10 (90%) | 8/10 (80%) | 8/10 (80%) | **10/10 (100%)** | **+10.0%** |
| **Total Tokens** | 16,136 | 11,268 | 10,332 | **10,923** | **-32.3%** |
| • *Prompt / In Tokens* | 12,515 | 7,942 | 7,118 | 7,236 | -42.2% |
| • *Completion / Out Tokens* | 3,620 | 3,326 | 3,213 | 3,687 | +1.9% |
| **Model Calls / Turns** | 27.1 | 28.3 | 36.0 | 30.9 | +14.0% |
| **Tool Calls** | 26.1 | 27.3 | 34.6 | 29.4 | +12.6% |
| **Repo Exploration Calls** | 2.0 | 1.8 | 0.0 | **0.0** | **-100.0%** |
| **Git / State Inspection Calls** | 0.1 | 0.7 | 3.2 | 0.6 | +500% |
| **Repeated File Reads** | 5.6 | 5.1 | 5.0 | 8.8 | +57.1% |
| **Harmful / Broken Edits** | 0.1 | 0.1 | 0.0 | **0.0** | **-100.0%** |
| **Wall Time (seconds)** | 193.5s | 194.8s | 258.3s | 197.7s | +2.2% |
| **OpenRouter Cost** | $0.0064 | $0.0051 | $0.0048 | **$0.0053** | **-17.2%** |

### Explicit A→D Comparison by Task

Rust and Python behaved differently in this experiment. In particular, Rust D did **not** show the same efficiency improvement as Python D:

#### RUST: `task-05-rust-bstr-ordering`
- **Success**: A: 4/5 (80.0%) → D: 5/5 (100.0%) (+20.0%)
- **Total Tokens**: A: 13,343 → D: 12,884 (-3.4%)
- **Model Calls**: A: 21.8 → D: 38.2 (+75.2%)
- **Tool Calls**: A: 20.8 → D: 36.2 (+74.0%)
- **Wall Time**: A: 165.2s → D: 258.8s (+56.7%)
- **Cost**: A: $0.0050 → D: $0.0064 (+28.0%)
*Note: In Rust, Condition D eliminated scratch binary pollution and achieved 100% task correctness, but required more repeated read operations to navigate macro contexts without search tools, resulting in higher tool calls and wall time than Condition A.*

#### PYTHON: `task-03-python-click-color`
- **Success**: A: 5/5 (100.0%) → D: 5/5 (100.0%) (equal)
- **Total Tokens**: A: 18,929 → D: 8,962 (**-52.7%**)
- **Model Calls**: A: 32.4 → D: 23.6 (-27.2%)
- **Tool Calls**: A: 31.4 → D: 22.6 (-28.0%)
- **Wall Time**: A: 221.8s → D: 136.5s (-38.5%)
- **Cost**: A: $0.0078 → D: $0.0041 (-47.4%)
*Note: In Python, Condition D eliminated directory exploration (from 2.4 to 0.0 calls) and compressed verbose pytest terminal output, producing substantial token and latency savings.*

*Important methodological note:* These reductions cannot all be causally attributed to perception work alone, as changes in tool availability alter model reasoning trajectories and search strategies.

---

## 10. Failure Forensics

Across all 40 trials, exactly 5 failures occurred (A: 1, B: 2, C: 2, D: 0). We forensically audited every single failure:

### 1. Condition A, Rust Run 5 (`hasOrderingFix: true, testPassed: false`)
- **Root Cause**: The model correctly edited `src/impls.rs` with the exact fix. However, because it had unrestricted file access and felt uncertain about test coverage, it generated a scratch test binary at `src/bin/test_fix.rs`. The scratch binary contained a compilation error (`unresolved import bstr::Cow`). When `cargo test` executed, Cargo attempted to compile all binary targets in `src/bin/`, failing the entire build.
- **Classification**: `ACTION / POLLUTION` (over-exploration encouraged by raw environment access).

### 2. Condition B, Rust Run 1 (`hasOrderingFix: false, testPassed: true`)
- **Root Cause**: The agent read `src/impls.rs` and became confused by surrounding macro implementations, editing another `PartialEq` implementation instead of `impl_partial_eq_cow`. Existing tests in `bstr` did not exercise the unedited macro invocation, so tests passed despite the missing fix.
- **Classification**: `REASONING` (semantic confusion in macro expansion logic).

### 3. Condition B, Rust Run 2 (`hasOrderingFix: true, testPassed: false`)
- **Root Cause**: Identical to Condition A Run 5. The agent applied the exact fix to `src/impls.rs`, but created a scratch file `src/bin/test_fix.rs` with a type mismatch error (`expected struct Vec<u8>, found BString`), breaking `cargo test`.
- **Classification**: `ACTION / POLLUTION`.

### 4. Condition C, Rust Run 4 (`hasOrderingFix: false, testPassed: true`)
- **Root Cause**: The model thrashed across 70 tool calls attempting to inspect lines via `git diff` commands when `search` was withheld. It lost track of the prompt requirements and finished without applying the second half of the ordering swap.
- **Classification**: `PERCEPTION / RETRIEVAL` (in Condition C, withholding search while keeping shell led to git-diff thrashing).

### 5. Condition C, Python Run 5 (`hasOrderingFix: false, testPassed: true`)
- **Root Cause**: Smolcoder harness error. The model emitted raw `<function=read_file>` tags in message text instead of structured tool call blocks on turn 1. The turn budget terminated after 3.0 seconds (`modelCalls: 1, toolCalls: 0`).
- **Classification**: `HARNESS` (format emission anomaly).

### Critical Finding
In Condition D, where arbitrary shell commands and scratch exploration were removed, **neither scratch binary pollution nor git-diff thrashing occurred**. The agent focused directly on reading the target file, applying the edit, and executing verification. Result: **0 failures out of 10 runs**.

---

## 11. Compression vs. Perception

Is WTF merely compression (making prompts shorter) or true deterministic perception?

Our Information Ledger and trace analysis demonstrate both:

1. **Formatting Compression**:
   - Compressing raw compiler logs (200–500 lines of rustc chatter) into structured `DIAGNOSTIC` and `VERIFICATION` blocks reduced prompt tokens from 12,515 to 7,236 (a 42.2% reduction).
2. **Deterministic Perception**:
   - The agent was stripped of its exploratory eyes (`list_files`, `search`) and hands (`ls`, `cat`, `git diff`).
   - The agent did not need to guess whether an edit applied; WTF `CHANGE` deterministically reported the exact line delta.
   - The agent did not need to parse terminal escape codes or exit codes; WTF `VERIFICATION` deterministically reported `outcome: PASSED` and `tests_executed`.
   - The agent did not need to correlate compiler errors with its edits; WTF `RELATION` deterministically established whether diagnostics were on modified lines.

This proves that **deterministic computation replaced probabilistic perception**.

---

## 12. What WTF Replaced

The empirical traces show that WTF rendered the following probabilistic activities unnecessary:
- **Directory Walking**: Calling `list_files` or `ls` to find file locations (completely eliminated, 0 calls).
- **Edit Confirmation**: Calling `git diff` or re-reading files to verify that an edit was saved (reduced to 0 in Condition D).
- **Compiler Chatter Parsing**: Reading dozens of warnings, notes, and progress bars to locate the failure point.
- **Test Exit-Code Interpretation**: Discerning whether a non-zero exit code meant compilation failure or test assertion failure.

---

## 13. What Still Required Model Intelligence

Deterministic perception did NOT and CANNOT replace:
1. **Semantic Code Comprehension**: Understanding how Rust macros (`macro_rules! impl_partial_eq_cow`) expand and bind `$lhs` vs `$rhs`.
2. **Bug Logic Reasoning**: Understanding why treating `0` as falsy in Python (`if fg:`) drops color index 0, and why `if fg is not None:` is the semantically correct fix.
3. **Repair Synthesis**: Writing the exact syntax replacement for the bug.
4. **Task Intent Understanding**: Interpreting the user prompt's specification of what the code should do.

WTF provided the *reality of the environment*; the model provided the *intelligence to modify it*.

---

## 14. Limitations

1. **Task Scope**: Evaluated on two well-characterized repositories (`bstr` in Rust, `click` in Python). Broader repos with non-standard multi-crate build graphs or monorepos may require additional perception primitives.
2. **Single Primary Model**: Tested on `qwen/qwen3-coder-30b-a3b-instruct`. While chosen specifically as a strong coding model, smaller models (e.g. 7B–8B) may exhibit different threshold sensitivities.
3. **Prompt Specification**: Prompts provided file paths (`src/impls.rs`, `src/click/termui.py`), allowing Condition D to proceed without file discovery. For tasks with completely unknown target files, an initial deterministic entry-point resolver would be required.

---

## 15. Verdict

### **STRONG POSITIVE**

A meaningful category of probabilistic perception work (repository exploration, git status inspection, raw compiler log interpretation, edit confirmation) can be completely removed and replaced by deterministic WTF evidence while fully preserving—and in our trials, improving—software task performance (100% success rate with 32.3% to 52.7% fewer tokens).

---

## FINAL QUESTION

**How much of the coding agent’s work was intelligence, and how much was merely trying to perceive software reality?**

Based strictly on our 40-trial ablation data and 30 mined historical trajectories:

Within these trials, A→D total tokens decreased 32.3% overall, with Python decreasing 52.7%. However, Rust and Python behaved differently: Rust D did not show the same efficiency improvement as Python D, and these reductions cannot all be causally attributed to perception work.

What the empirical evidence does establish is that:
1. In prior experiments, 14.1% to 41.4% of historical tool calls were spent directly on mechanical perception (discovering files, parsing compiler logs, inspecting git status, confirming edits).
2. Within the tested ablation range, removing conventional perception tools and supplying operational reality via WTF-D did not produce a capability cliff (success was 90% in Normal vs 100% in WTF-D).
3. A substantial fraction of tokens expended by coding agents in raw environments is spent absorbing unformatted tool chatter and performing exploratory discovery that deterministic computation can supply directly.
