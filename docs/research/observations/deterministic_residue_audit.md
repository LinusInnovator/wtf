# WTF Phase 6.3 — Stage 2.4: Deterministic Residue Audit

**Date**: September 22, 2026  
**Status**: Completed  
**Source of Truth**: `scratch/taskset_6_3_v1/manifest.json`  
**Dataset**: 154 total trajectories (135 baseline 8T runs + 19 Stage 2.3 12T probe runs)  
**Total Passes**: 34  
**Total Failures Audited**: 120  
**Epistemic Constraint**: No model inference. No feature implementation. Trajectory evidence only. Projection is not selection.

---

## 1. Executive Summary

Across 154 empirical trajectories spanning 9 model families, 15 benchmark tasks, and 4 language ecosystems (Python, Go, Rust, Node/TypeScript), we audited every non-passing run to answer a single question:

> **After localization, what repeated work are agents still doing that does not actually require intelligence?**

Our forensic audit classified every failure into one of four mutually exclusive classes:
- **D (Deterministically computable)**: The missing information or action can be produced identically from the existing machine state without understanding user intent or deciding what should happen.
- **I (Intelligence required)**: Requires semantic understanding, solution design, intent interpretation, or algorithmic judgment.
- **H (Harness/tool friction)**: Failure caused by experimental interface mechanics rather than missing WTF computation or agent reasoning.
- **U (Unknown)**: Trajectory evidence is insufficient for a defensible classification.

### Headline Findings:
1. **Localization is Solved, But Mechanical Trace-Paging is Chronic**:
   In **59 out of 120 failing runs (49.2%)**, agents spent 3 to 7 sequential turns performing blind file-chunk paging (`read_file` lines 1–120, 121–240...) or grep sweeps to discover the exact error coordinate that was *already explicitly printed in the test runner stack trace*.
2. **Uncoupled Verification Causes Turn-Censoring**:
   In **10 runs**, agents formulated and successfully applied the correct code edit on their final turn, but failed because verification was uncoupled—the agent had to spend an extra turn explicitly invoking the test command.
3. **Pre-Verification Syntax Blindness**:
   In **19 runs**, agents applied code modifications with fatal syntax or compilation errors (indentation errors, missing closing delimiters, invalid imports), then wasted turns running heavy test suites against uncompilable code.
4. **Harness Debt Accounts for 45% of Raw Trajectory Breakdowns**:
   Brittle substring replacement and fragile regex fallback when JSON tool calls contain unescaped code characters artificially broke 54 runs.

---

## 2. Funnel Audit & Blocker Classification

Every non-passing trajectory was audited to identify the **first transition** it failed to complete along the established funnel:
$$\text{LOCALIZED} \longrightarrow \text{UNDERSTOOD} \longrightarrow \text{EDITED} \longrightarrow \text{VERIFIED} \longrightarrow \text{PASS}$$

### The Residue Map

| Funnel Transition | Lost Runs | D (Deterministic) | I (Intelligence) | H (Harness Friction) | U (Unknown) | Primary Failure Mechanism |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **failed before LOCALIZED** | 15 | 0 | 0 | 15 | 0 | Harness JSON parser degradation (empty path `""` → `Is a directory`) |
| **LOCALIZED → UNDERSTOOD** | 15 | 0 | 13 | 2 | 0 | Semantic misunderstanding of requirements or API contract |
| **UNDERSTOOD → EDITED** | 66 | 3 | 28 | 35 | 0 | Deliberation turn exhaustion (28 I); Harness string/path failures (35 H); Blind rereading (3 D) |
| **EDITED → VERIFIED** | 7 | 7 | 0 | 0 | 0 | Turn budget expired immediately following edit before test command could run |
| **VERIFIED → PASS** | 17 | 6 | 9 | 2 | 0 | Genuinely incorrect solution (9 I); Syntax/compilation invalid (6 D); Timeout (2 H) |
| **TOTALS** | **120** | **16 (13.3%)** | **50 (41.7%)** | **54 (45.0%)** | **0** | — |

*(Note: The table above reflects the **first fatal transition failure**. As shown below, an additional 59 runs suffered from severe deterministic residue during earlier successful transitions before ultimately failing later in the funnel).*

---

## 3. Repeated Deterministic Residue Clusters

We clustered all observed instances where agents performed mechanical, non-intelligent work that could be produced deterministically from machine state:

| Deterministic Operation | Runs Affected | Models | Tasks | Ecosystems | Funnel Location | Evidence / Trajectory Manifestation | Deterministic Inputs | Deterministic Output |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :--- |
| **1. Mechanical Stack-Trace Coordinate Projection** | **59** | 8 | 13 | 4 (Py, Go, Rs, Node) | `LOCALIZED → UNDERSTOOD` & `UNDERSTOOD → EDITED` | Agents call `read_file` 3–7 times sequentially across 120-line windows to find the failing function already named in the test trace. | Test runner stdout/stderr containing stack frame (`file.py:line`). | Bounded source slice ($L - 15$ to $L + 15$) projected into agent context. |
| **2. Syntax & Compilation Pre-Flight Gate** | **19** | 9 | 10 | 4 (Py, Go, Rs, Node) | `VERIFIED → PASS` & `EDITED → VERIFIED` | Agents apply edit with indentation or delimiter error, then run full test suite and crash or enter panic loops. | Modified file content on disk, repo compiler/linter (`py_compile`, `go vet`, `cargo check`, `tsc`). | Immediate sub-second diagnostic: `Syntax error at line L: unexpected indent`. Blocks test run until valid. |
| **3. Closed-Loop Post-Edit Verification** | **10** | 6 | 7 | 4 (Py, Go, Rs, Node) | `EDITED → VERIFIED` | Agent successfully edits target file on turn 7 or 8, but turn limit expires before it can issue a separate test command. | File modification event on disk, repo verification command from build graph. | Automatic execution of canonical test target attached directly to edit tool result. |
| **4. Exact AST Span / Replacement Anchoring** | **5** | 4 | 5 | 3 (Py, Go, Node) | `UNDERSTOOD → EDITED` | Agent repeatedly reads lines 100–150 then 120–160 to match exact whitespace indentation for string replacement. | Target symbol / function name, file AST parse. | Exact line number span and baseline indentation string of target node. |

---

## 4. Separation of Harness Debt

Harness debt represents friction introduced by the experimental testing rig rather than fundamental software engineering limits.

| Harness / Tool Failure | Affected Runs | Classification | Impact & Explanation |
| :--- | :---: | :---: | :--- |
| **Malformed Tool JSON / Regex Parser Degradation** | **89** | **A (Experimental Validity Only)** | When models output unescaped code quotes or markdown blocks, `json.loads` fails. The harness fallback regex matched `"action"` but left `args: {}`. The runner then called `replace_in_file(path="")` which threw `[Errno 21] Is a directory: '/.../workspace/'`. Fixing this requires robust JSON extraction (e.g. `dirtyjson` or partial AST parsing). |
| **Brittle Exact-String Matching (`replace_in_file`)** | **15** | **C (Both Validity & WTF Primitive)** | Harness rejected edits when `old_text` differed by even a single trailing whitespace or newline. This broke 15 valid repairs. Fixing this via line-normalized diff patching or AST-node replacement improves benchmark validity AND represents a general WTF patch verification primitive. |
| **Execution Timeout (45s Hard Limit)** | **3** | **A (Experimental Validity Only)** | Heavy compilation cycles (e.g. `cargo test` in `task-10` or Node compilation in `task-15`) occasionally exceeded 45s. Bumping the timeout to 90s resolves this without altering agent behavior. |

---

## 5. Estimate of Removable Work

For each deterministic residue cluster, we evaluated whether the operational burden on the agent is fully removable, compressible, or not actually removable:

| Cluster | Removable Classification | Rationale |
| :--- | :--- | :--- |
| **Closed-Loop Post-Edit Verification** | **Fully Removable** | Running verification after an edit requires zero intelligence. Binding test execution directly to file writes eliminates an entire turn roundtrip and guarantees evidence capture. |
| **Syntax & Compilation Pre-Flight Gate** | **Fully Removable** | Checking whether modified code parses or compiles requires zero semantic judgment. Fast sub-second linter/compiler checks catch syntax errors before test execution. |
| **Stack-Trace Coordinate Projection** | **Compressible** | WTF can deterministically extract stack frame coordinates and project bounded slices (as proven by Strong diagnostic tasks). However, the agent must still exercise intelligence to decide *what* logic to write. The mechanical paging is removed; the reasoning remains. |
| **Exact AST Span Anchoring** | **Compressible** | Exposing function boundaries and line coordinates eliminates whitespace matching thrashes, but selecting the new implementation remains an intelligence task. |

---

## 6. Top 3 Evidence-Nominated WTF Primitives

Based purely on empirical residue observed across multiple models, tasks, and ecosystems, we nominate the 3 strongest deterministic primitives:

### Primitive 1: Closed-Loop Verification (`wtf-verify-on-write`)
- **Exact Repeated Problem**: 10 runs applied valid edits but failed due to turn exhaustion before issuing a separate test command. Agents treat "editing" and "verifying" as decoupled, multi-turn decisions.
- **Deterministic Inputs**: `(modified_file_path, diff_content, repo_build_graph)`.
- **Deterministic Transformation**: Upon file write, WTF automatically triggers the localized verification command registered for that file/target in the repository build graph.
- **Output Exposed to Agent**: The file write tool returns the diff confirmation *and* the immediate verification receipt in a single turn:
  ```
  Success: Modified starlette/exceptions.py (+3/-1)
  [WTF VERIFICATION: pytest tests/test_exceptions.py -k test_non_standard_status_code]
  Status: PASSED (1/1) in 420ms
  ```
- **Affected Funnel Transition**: `EDITED → VERIFIED` and `VERIFIED → PASS`.
- **Historical Trajectories Addressed**: All 10 uncoupled verification runs + prevents turn-censoring across compile-heavy tasks.
- **Smallest Falsification Experiment**: Re-run the 10 uncoupled historical runs with automatic post-edit test execution. If pass rate does not increase, the primitive provides no utility.

### Primitive 2: Deterministic Pre-Flight Syntax Gate (`wtf-syntax-gate`)
- **Exact Repeated Problem**: 19 runs produced invalid syntax or compiler panics (e.g. Python indentation errors, missing semicolons, Go import mismatches) and wasted turns running full test suites or panicking.
- **Deterministic Inputs**: `(target_file, candidate_diff)`.
- **Deterministic Transformation**: Run native fast linter/compiler parser (`python -m py_compile`, `go vet`, `cargo check`, `tsc --noEmit`) in `<50ms` before saving/running tests.
- **Output Exposed to Agent**: Immediate deterministic error feedback without burning a test turn:
  ```
  Syntax Error: IndentationError on line 12 of starlette/exceptions.py.
  Edit rejected. Working tree untouched. Please format indentation.
  ```
- **Affected Funnel Transition**: `UNDERSTOOD → EDITED` and `VERIFIED → PASS`.
- **Historical Trajectories Addressed**: 19 syntax/compilation blind runs across Python, Go, Rust, and Node.
- **Smallest Falsification Experiment**: Test on the 19 syntax-failed trajectories. Measure whether providing immediate syntax feedback enables recovery within 2 turns.

### Primitive 3: Universal Trace Coordinate Projection (`wtf-trace-slice`)
- **Exact Repeated Problem**: 59 runs wasted 3–7 turns mechanically paging through files to find the error line already printed in the test runner output (e.g. `AssertionError: ... click/core.py:3568`).
- **Deterministic Inputs**: Test runner error output / stack trace.
- **Deterministic Transformation**: Deterministic regex/parser extracts `(file, line_number)` from stack trace and extracts lines $[L-15, L+15]$.
- **Output Exposed to Agent**: Projected bounded diagnostic context in initial WTF state for Weak/None tasks:
  ```
  DIAGNOSTIC EVIDENCE: src/click/core.py:3555-3580 (from test traceback)
  ```
- **Affected Funnel Transition**: `LOCALIZED → UNDERSTOOD` and `UNDERSTOOD → EDITED`.
- **Historical Trajectories Addressed**: 59 mechanical paging runs across Weak and None diagnostic tiers.
- **Smallest Falsification Experiment**: Provide trace coordinate slices on the 5 "None" diagnostic tasks. Measure turns-to-first-edit. If turns-to-first-edit does not decrease by ≥2 turns, falsify the primitive.

---

## 7. Conclusions

### What intelligence is still doing unnecessarily:
1. Paging mechanically through 500-line files to find lines already identified in stack traces.
2. Manually calculating line numbers and indentation spaces for exact substring replacement.
3. Guessing and typing verification commands that the build system already knows.
4. Waiting for test suites to run on code that does not even compile.

### What genuinely appears to require intelligence:
1. Discerning semantic edge cases (e.g. UTC timestamp monotonicity in Go UUIDv7, RFC-compliant fragment parsing in Marshmallow, Unicode printable byte classification in Go Cmp).
2. Synthesizing correct algorithmic fixes when documentation is absent.
3. Resolving architectural trade-offs between deep cloning vs shallow mutation (e.g. Ky hook mutation leaks).

### What is merely harness debt:
1. Regex fallback failure when LLMs emit unescaped quotes in JSON tool calls.
2. Rejecting edits due to trailing whitespace mismatches in string replacement.
3. Shell timeouts on heavy compiler targets.

### Smallest Next Falsification Experiment:
Before building product features, test **Primitive 1 (`wtf-verify-on-write`)** and **Primitive 3 (`wtf-trace-slice`)** against the frozen TASKSET-6.3-v1 Weak/None tasks in a strictly bounded 5-task offline benchmark. If agents do not reach the `EDITED` and `VERIFIED` stages in significantly fewer turns, reject the primitives.
