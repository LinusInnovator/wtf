# Information-Parity Audit: WTF Action → Reality Delta

**Date**: 2026-09-21  
**Experiment**: Pinned `qwen/qwen3-8b` on Task 5 (`bstr` Ordering Bug, commit `b669472`)  
**Conditions**: CONTROL (Raw Feedback) vs. DELTA (5-Primitives Action → Reality Delta)

---

## 1. Core Principle & Purpose

The purpose of this audit is to prove that DELTA does **not** receive privileged information unavailable to CONTROL.

Every deterministic fact emitted by WTF DELTA must have an explicit provenance. We strictly categorize every fact as either:
* **COMPRESSION**: Restructuring, filtering, and representing information that was *already present* in the raw tool invocation, stdout, stderr, or exit code.
* **PERCEPTION**: Additional deterministic observations gathered from the environment (e.g. querying Git working tree, inspecting filesystem paths, or reading build manifests).

No additional sensing is hidden under "compression."

---

## 2. Information Flow Comparison

| Aspect | CONTROL (Ordinary Raw Feedback) | DELTA (WTF Action → Reality Delta) | Epistemic Classification |
| :--- | :--- | :--- | :--- |
| **Tool Execution** | Subprocess runs command in workspace; returns stdout/stderr/exitCode | Subprocess runs command in workspace; returns stdout/stderr/exitCode | **Identical** |
| **Working Tree Inspection** | None automatically returned (agent must run `git diff` / `git status` explicitly) | WTF checks working tree state before & after action (`git diff --stat`) | **PERCEPTION** |
| **Diagnostic Parsing** | Full raw stdout/stderr with compiler banners, color codes, progress text | Extracted tool name, target, location, and exact error message | **COMPRESSION** |
| **Invocation Validity** | Inferred probabilistically by LLM from exit code 101 and text | Deterministically extracted: `FAILED` if target/flag error; `VALID` if test harness ran | **COMPRESSION** |
| **Target Availability** | Printed in Cargo stderr: `Available test targets: bstr, ...` | Checked against Cargo stderr output list of targets | **COMPRESSION** |
| **Target Manifest Query** | Available if agent reads `Cargo.toml` or `tests/` | Checked against `Cargo.toml` if not in tool stderr | **PERCEPTION** |
| **Test Execution Count** | Embedded in raw text: `test result: ok. 183 passed...` | Extracted integer count: `tests_executed: 183` or `UNKNOWN` | **COMPRESSION** |
| **Diagnostic ↔ Code Relation** | Requires LLM to mentally align line numbers across tool turns | Cross-references diagnostic line with `git diff` changed hunks | **PERCEPTION** |
| **Epistemic Boundaries** | Unstated (model assumes tests passed if 0 diagnostics) | Explicitly bounded: `UNKNOWN: project test status`, etc. | **ONTOLOGICAL DISCIPLINE** |

---

## 3. Field-by-Field Provenance and Source Analysis

### Primitive 1: `CHANGE`
* **Emitted Facts**:
  - `none observed`
  - `<file> modified (+<add> / -<del>)`
* **Source**:
  - Comparison of Git working-tree status before action vs. after action (`git diff --numstat` / `git status`).
* **Classification**: **PERCEPTION**.
  - *Audit Justification*: In CONTROL, the tool result only reports subprocess output or file edit confirmation (`Successfully replaced...`). It does not observe working-tree diffs. DELTA actively perceives whether software reality actually changed. Any agent in CONTROL *could* run `git diff` using `run_command`, but does not receive it as an automatic state perception.

### Primitive 2: `DIAGNOSTIC`
* **Emitted Facts**:
  - `tool: cargo` (or `edit_file`, `node`, etc.)
  - `target: <target_name>` (e.g. `impls`)
  - `file: <path>` / `line: <num>`
  - `message: <clean_diagnostic_message>`
* **Source**:
  - Extracted directly from subprocess stdout/stderr or tool error return.
  - Rust/Cargo regex: `error: no test target named \`([^\`]+)\``, `--> ([^:]+):(\d+):(\d+)`, `error: (.*)`.
* **Classification**: **COMPRESSION**.
  - *Audit Justification*: This text is 100% present in the raw stdout/stderr delivered to CONTROL. DELTA compresses it by stripping ANSI formatting, compiler progress bars, and extracting structured tokens.

### Primitive 3: `RELATION`
* **Emitted Facts**:
  - `requested target <name> absent from observed Cargo targets`
  - `diagnostic on changed line <N> in <file>`
  - `diagnostic in unchanged file <file>`
* **Source**:
  - For target absence:
    1. Cargo's stderr explicitly prints: `Available test targets:\n    bstr\n    ...`. Matching the requested target against this list is **COMPRESSION** of information Cargo already output.
    2. Fallback check against `Cargo.toml` / `tests/` directory is **PERCEPTION**.
  - For diagnostic location relative to changes:
    - Cross-referencing diagnostic `(file, line)` against lines changed in `git diff`. This is **PERCEPTION** (queries working tree state).
* **Classification**: **COMPRESSION** (when from stderr) / **PERCEPTION** (when from git diff or filesystem).

### Primitive 4: `VERIFICATION`
* **Emitted Facts**:
  - `command: <command_string>` (echo of agent action)
  - `invocation: VALID | FAILED`
  - `status: PASSED | FAILED`
  - `tests_executed: <count> | UNKNOWN`
* **Source**:
  - `command`: Agent tool arguments. (**COMPRESSION**)
  - `invocation`: Derived from exit code + tool output pattern. If exit code indicates CLI flag failure, unknown subcommand, or nonexistent target, `invocation: FAILED`. If test harness executed, `invocation: VALID`. (**COMPRESSION**)
  - `status`: Derived from test harness exit status and summary line (`test result: ok` vs `test result: FAILED`). (**COMPRESSION**)
  - `tests_executed`: Parsed from harness output (`test result: ok. 183 passed; 0 failed; ...`). If invocation or compilation failed prior to test suite execution, strictly emitted as `UNKNOWN`. Never emitted as `0` unless deterministically reported by the runner (`running 0 tests`). (**COMPRESSION**)
* **Classification**: **COMPRESSION**.
  - *Audit Justification*: All verification fields are deterministic derivations from the command string, exit code, and test runner text output already present in CONTROL.

### Primitive 5: `UNKNOWN`
* **Emitted Facts**:
  - `intended verification command`
  - `project test status`
  - `source change correctness`
* **Source**:
  - Epistemic boundary constraints.
* **Classification**: **ONTOLOGICAL DISCIPLINE**.
  - *Audit Justification*: Declares what is *not* deterministically known. No additional information is provided; rather, hallucinated assumptions are prevented.

---

## 4. Parity Proof Conclusion

1. **No Privileged Omniscience**: DELTA has no access to ground-truth solutions, hidden test suites, pre-computed answers, or task specifications.
2. **Deterministic Computability**: Every emitted fact is computed in <5ms via deterministic string parsing or local Git/filesystem inspection.
3. **Transparent Sensing**: The PERCEPTION component consists entirely of local Git diff observation (`git diff`) and workspace path checks that any agent has the permission and capability to run via shell tools.
4. **Hypothesis Isolation**: By maintaining identical model, task, prompt, tools, sampling, and evaluator, the experiment isolates whether compiling action feedback into deterministic software reality deltas reduces probabilistic thrash and failure.
