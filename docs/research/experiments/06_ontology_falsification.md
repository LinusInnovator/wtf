# Ontology Falsification Report: Testing the Five Primitives Against 14 Observed Events

## Executive Summary

We tested whether the five-primitive ontology:
```
CHANGE
DIAGNOSTIC
RELATION
VERIFICATION
UNKNOWN
```
is sufficient to represent all 14 empirical failure, thrashing, and friction events observed across our 30 preserved trials, or whether the observed events structurally demand a sixth primitive (such as `INVOCATION`).

### The Falsification Result: **THE FIVE PRIMITIVES SURVIVE**

**No observed event required a sixth primitive.** 

Every empirical observation—including invalid test targets, unexecuted test commands, failed string replacements, missing files in shell operations, destructive file overwrites, and reasoning-channel stream desyncs—is cleanly and completely representable within the five primitives by allowing their internal structure to reflect the actual mechanical stages of software execution (specifically distinguishing invocation/build failures from test assertion failures within `VERIFICATION`, and edit attempts within `CHANGE`).

---

## 1. Taxonomic Accounting Correction

In the previous summary, percentages were presented against overlapping behavioral categories. Below is the strict, mutually exclusive categorization of the **14 primary failure/friction events** across the 30 trials:

| Primary Event Class | Count | Trials |
| :--- | :---: | :--- |
| **Verification Invocation Target Error** | **5** | 8B RAW 2, 8B RAW 5, 8B EVI 1, 8B EVI 3; (plus 30B RAW 3 sub-command) |
| **Tool-Interface String Matching Mismatch** | **3** | 14B RAW 3, 14B RAW 4, 14B RAW 5 |
| **Reasoning-Channel Stream Abort** | **3** | 30B RAW 1, 30B RAW 2, 30B EVI 2 |
| **Ad-Hoc Compiler Invocation & Cleanup Thrash** | **2** | 30B RAW 4, 30B RAW 5 |
| **Destructive Full-File Overwrite** | **1** | 14B EVI 3 |
| **Total Distinct Primary Events** | **14** | **14 / 30 runs exhibited primary failure/thrash events** |

*(Note: 8B RAW 3, RAW 4, and EVI 2 also encountered target errors on turn 3, but recovered within the same run; they are accounted for under the same mechanism as Events 11–14).*

---

## 2. Event-by-Event Ontology Stress Test

For each of the 14 events, we present:
1. **RAW REALITY**: What actually happened in the environment and what the tool returned.
2. **FIVE-PRIMITIVE REPRESENTATION**: The complete, relevant deterministic reality using only `CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`.
3. **ANYTHING THAT CANNOT BE REPRESENTED**: Explicit statement of any omitted or unrepresented facts.

---

### Event 1: Literal Whitespace Mismatch Loop (14B RAW Run 3)
* **RAW REALITY**:
  Agent viewed `src/impls.rs` lines 52–58 with prepended line numbers (`55:                 let this...`). Called `replace_in_file` with 0 leading spaces. Tool returned literal string failure: `Error: old_text not found in src/impls.rs.` Working tree remained clean (+0/-0). Agent looped on reading lines 52–58 five times without applying an edit.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    working_tree: UNCHANGED (+0/-0)
    attempted_action:
      tool: replace_in_file
      target_file: src/impls.rs
      status: REJECTED (target text not found in file)
  DIAGNOSTIC:
    source: tool (replace_in_file)
    message: "old_text not found in src/impls.rs"
  RELATION:
    target: src/impls.rs (file exists; lines 52-58 inspected in previous turn)
  VERIFICATION:
    status: UNEXECUTED (0 commands run)
  UNKNOWN:
    agent intent
    correctness of unapplied edit
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 2: Zero-Indentation Edit Thrash (14B RAW Run 4)
* **RAW REALITY**:
  Agent repeatedly called `replace_in_file` targeting lines 55–56 with 0 indentation (5 attempts). Tool returned `Error: old_text not found` 5 times. Budget exhausted with 0 edits.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    working_tree: UNCHANGED (+0/-0)
    attempted_action:
      tool: replace_in_file
      target_file: src/impls.rs
      status: REJECTED (5 consecutive identical failed replacement attempts)
  DIAGNOSTIC:
    source: tool (replace_in_file)
    message: "old_text not found in src/impls.rs"
  RELATION:
    target: src/impls.rs
  VERIFICATION:
    status: UNEXECUTED
  UNKNOWN:
    agent intent
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 3: False Completion Claim on Tool Failure (14B RAW Run 5)
* **RAW REALITY**:
  Turn 2 replacement failed (`old_text not found`). Turn 3 agent re-read lines 52–58. Turn 4 agent declared completion: *"No changes were made as the code snippet is already correct."* Working tree had 0 diff.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    working_tree: UNCHANGED (+0/-0, 0 files modified)
  DIAGNOSTIC:
    none
  RELATION:
    none
  VERIFICATION:
    status: UNEXECUTED (0 verification commands run)
  UNKNOWN:
    task requirement satisfaction (unverified)
    ground-truth correctness: UNVERIFIED
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 4: Destructive Full-File Overwrite (14B EVIDENCE Run 3)
* **RAW REALITY**:
  Turn 2 replacement failed. On Turn 4, agent called `write_file("src/impls.rs", content)` with only the 7-line macro snippet. Overwrote 1,344 lines with 7 lines (-1,337 lines). `cargo test` failed with exit 101, line 1 syntax error, and cascading trait errors across unchanged files.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    file: src/impls.rs
    status: MODIFIED (+7 / -1344 lines, file truncated from 44KB to 274B)
  DIAGNOSTIC:
    - location: src/impls.rs:1:1
      severity: error
      message: "expected item, found `52`"
    - location: src/byteset/scalar.rs:259:17
      severity: error
      message: "`BStr` does not implement `PartialEq`"
  RELATION:
    - diagnostic 1: in changed code (src/impls.rs:1:1)
    - diagnostic 2: in unchanged file (src/byteset/scalar.rs:259:17)
  VERIFICATION:
    command: cargo test
    stage: COMPILATION
    status: FAILED (exit 101)
    tests_executed: 0
  UNKNOWN:
    causal link between src/impls.rs:1:1 and src/byteset/scalar.rs
    pre-overwrite file content (unless git log queried)
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 5: Reasoning-Channel Stream Abort (30B RAW Run 1)
* **RAW REALITY**:
  Model generated reasoning tokens inside thinking channel; emitted empty string `""` in text channel. smolcoder harness sent empty reply nudge. Model repeated empty content. Harness aborted on turn 5 with 0 edits and 0 tool calls.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    working_tree: UNCHANGED (+0/-0)
  DIAGNOSTIC:
    source: harness / agent-protocol
    message: "model emitted 0 content tokens (reasoning tokens emitted: >0)"
  RELATION:
    none
  VERIFICATION:
    status: UNEXECUTED
  UNKNOWN:
    reason for model emitting zero content tokens
    task completion
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 6: Exploratory Read Stream Abort (30B RAW Run 2)
* **RAW REALITY**:
  Agent read lines 1..750 of `src/impls.rs` and searched for macro. Then emitted empty content twice consecutively. Harness aborted on turn 7.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    working_tree: UNCHANGED (+0/-0)
  DIAGNOSTIC:
    source: harness / agent-protocol
    message: "model emitted 0 content tokens after 4 read actions"
  RELATION:
    target: src/impls.rs
  VERIFICATION:
    status: UNEXECUTED
  UNKNOWN:
    agent intent
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 7: Intermediate Cargo Exit 101 Recovery (30B RAW Run 3)
* **RAW REALITY**:
  Agent applied correct edit to `src/impls.rs`. On Turn 13 ran `cargo test` which failed exit 101 (transient edit/syntax glitch). Agent read lines 1310 and 35, re-edited `src/impls.rs`, re-ran `cargo test` which passed (46 passed), then thrashed on plan commands.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    file: src/impls.rs
    status: MODIFIED (+2/-2)
  DIAGNOSTIC:
    none (resolved after re-edit)
  RELATION:
    none
  VERIFICATION:
    command: cargo test
    stage: TEST_EXECUTION
    status: PASSED (exit 0)
    tests_executed: 46
  UNKNOWN:
    source correctness beyond passing test assertions
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 8: Ad-Hoc `rustc` Compilation & `rm` Cleanup Thrash (30B RAW Run 4)
* **RAW REALITY**:
  Agent applied correct fix to `src/impls.rs`. Wrote `test_fix.rs` (34 lines). Ran `rustc --extern bstr=... test_fix.rs -o test_fix && ./test_fix` which exited 1 with linker error; `test_fix` binary was never created. Agent ran `rm test_fix.rs test_fix` which exited 1 (`rm: test_fix: No such file or directory`). Agent thrashed for 14 turns trying `rm test_fix.rs` (exit 1), `ls -la`, `plan show`.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    - file: src/impls.rs (status: MODIFIED, +2/-2)
    - file: test_fix.rs (status: UNTRACKED, +34 lines)
    - file: test_fix (status: NOT_FOUND)
  DIAGNOSTIC:
    - source: rustc
      location: test_fix.rs
      message: "linking with `cc` failed: exit code 1"
    - source: rm
      message: "test_fix: No such file or directory (ENOENT)"
  RELATION:
    - rustc diagnostic: in untracked file (test_fix.rs)
    - rm diagnostic: target operand does not exist on filesystem
  VERIFICATION:
    - command: rustc test_fix.rs -o test_fix && ./test_fix
      stage: COMPILATION
      status: FAILED (exit 1)
      tests_executed: 0
    - command: cargo test
      stage: TEST_EXECUTION
      status: PASSED (46 passed, executed prior on turn 11)
  UNKNOWN:
    whether test_fix.rs was intended as permanent or scratch
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 9: Ad-Hoc Temporary Crate Injection Thrash (30B RAW Run 5)
* **RAW REALITY**:
  Agent made correct fix. Attempted `rustc` on `test_fix.rs` (failed exit 1). Then wrote `src/tests/test_fix.rs` inside the library tree. Ran `cargo test test_partial_eq_cow_fix` (passed). Cleaned up `rm test_fix.rs`. Thrashed on plan tools for 6 turns before stopping.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    file: src/impls.rs
    status: MODIFIED (+2/-2)
  DIAGNOSTIC:
    source: rustc
    message: "linker failure on ad-hoc script test_fix.rs"
  RELATION:
    diagnostic: in temporary file (now removed)
  VERIFICATION:
    command: cargo test
    stage: TEST_EXECUTION
    status: PASSED (exit 0)
    tests_executed: 46
  UNKNOWN:
    plan tool completion status
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 10: Early Empty Reply Nudge Abort (30B EVIDENCE Run 2)
* **RAW REALITY**:
  Turn 1 model returned reasoning only, 0 content tokens. Smolcoder nudged. Turn 2 model repeated empty content. Session aborted after 15.4s with 0 edits and 0 tool calls.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    working_tree: UNCHANGED (+0/-0)
  DIAGNOSTIC:
    source: harness / agent-protocol
    message: "model repeatedly emitted empty content tokens"
  RELATION:
    none
  VERIFICATION:
    status: UNEXECUTED
  UNKNOWN:
    agent intent
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 11: Nonexistent Test Target Invocation (8B RAW Run 2)
* **RAW REALITY**:
  Agent edited `src/impls.rs` with correct fix (+2/-2). Then ran: `cargo test --test impl_partial_eq_cow`. Cargo exited 101 with stderr: `error: no test target named 'impl_partial_eq_cow'`. Zero tests executed. Agent ran `list_files /` (rejected by sandbox), then `list_files src`. Concluded without running `cargo test`.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    file: src/impls.rs
    status: MODIFIED (+2/-2)
  DIAGNOSTIC:
    source: cargo (target resolution)
    message: "no test target named `impl_partial_eq_cow` in default-run packages"
  RELATION:
    diagnostic: CLI argument target not found in Cargo.toml manifest
  VERIFICATION:
    command: cargo test --test impl_partial_eq_cow
    stage: INVOCATION
    status: FAILED (exit 101, invalid target argument)
    tests_executed: 0
  UNKNOWN:
    verification status of modified code in src/impls.rs (unexecuted)
    source change correctness (unverified)
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 12: Internal Module Target Invocation & Premature Exit (8B RAW Run 5)
* **RAW REALITY**:
  Agent applied correct edit to `src/impls.rs`. Ran `cargo test --test impls`. Cargo exited 101: `error: no test target named 'impls'`. Agent ran `list_files tests` (error: folder does not exist). Agent stopped without running `cargo test`.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    file: src/impls.rs
    status: MODIFIED (+2/-2)
  DIAGNOSTIC:
    - source: cargo (target resolution)
      message: "no test target named `impls` in default-run packages"
    - source: filesystem
      message: "folder `tests` does not exist"
  RELATION:
    - diagnostic 1: target `impls` not defined as an integration test in Cargo.toml
    - diagnostic 2: directory `tests/` does not exist on filesystem
  VERIFICATION:
    command: cargo test --test impls
    stage: INVOCATION
    status: FAILED (exit 101, target not found)
    tests_executed: 0
  UNKNOWN:
    project test suite status (unexecuted)
    source change correctness (unverified)
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 13: Hallucinated Package Name Invocation & Manifest Fallback (8B EVIDENCE Run 1)
* **RAW REALITY**:
  Agent edited `src/impls.rs`. Ran `cargo test --package your_crate_name`. Cargo exited 101: `error: package ID specification 'your_crate_name' did not match any packages`. Agent read `Cargo.toml`, identified package name `bstr`, ran `cargo test --package bstr`, which executed and passed.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    file: src/impls.rs
    status: MODIFIED (+2/-2)
  DIAGNOSTIC:
    source: cargo (package resolution)
    message: "package ID specification `your_crate_name` did not match any packages"
  RELATION:
    diagnostic: package name not matching Cargo.toml package.name (`bstr`)
  VERIFICATION:
    - command: cargo test --package your_crate_name
      stage: INVOCATION
      status: FAILED (exit 101, package not found)
      tests_executed: 0
    - command: cargo test --package bstr
      stage: TEST_EXECUTION
      status: PASSED (exit 0)
      tests_executed: 46
  UNKNOWN:
    source change correctness beyond passing tests
  ```
* **CANNOT BE REPRESENTED**: None.

---

### Event 14: Invocation Failure Conflated with Missing Test Suite (8B EVIDENCE Run 3)
* **RAW REALITY**:
  Agent edited `src/impls.rs` with correct fix (+2/-2). Ran `cargo test --test impls`. Evidence Compiler returned `FAILURE cargo test --test impls: exit 101`, `DIAGNOSTICS_IN_CHANGED_CODE: none`, `OTHER: error: no test target named impls`. Agent inferred test suite was missing, ran `list_files tests`, got folder not found, and stopped without running `cargo test`.
* **FIVE-PRIMITIVE REPRESENTATION**:
  ```yaml
  CHANGE:
    file: src/impls.rs
    status: MODIFIED (+2/-2)
  DIAGNOSTIC:
    - source: cargo (target resolution)
      message: "no test target named `impls` in default-run packages"
    - source: filesystem
      message: "folder `tests` does not exist"
  RELATION:
    - diagnostic 1: target resolution failure (not a source-code error)
    - diagnostic 2: filesystem check
  VERIFICATION:
    command: cargo test --test impls
    stage: INVOCATION
    status: FAILED (exit 101, target not found in manifest)
    tests_executed: 0
  UNKNOWN:
    project verification state (unexecuted; 0 tests executed)
    source change correctness (unverified)
  ```
* **CANNOT BE REPRESENTED**: None.

---

## 3. Direct Answers to the Falsification Questions

### 1. Did any observed event REQUIRE a sixth primitive?
**NO.**
Across all 14 empirical failure and thrashing events, not a single observation required a new sixth primitive.

### 2. If yes, what information was structurally impossible to express?
**N/A.** Every fact was completely expressible within the five existing primitives.

### 3. If no, what internal structure does each existing primitive need?
To prevent information loss without creating new primitives, the five primitives require the following minimal internal structure:

1. **`VERIFICATION`**:
   Must distinguish the **stage of failure** and **execution volume**, rather than treating verification as a scalar exit code:
   * `command`: exact string executed
   * `stage`: `INVOCATION` (CLI/target/manifest resolution) | `COMPILATION` (build failed) | `TEST_EXECUTION` (assertions ran)
   * `status`: `PASSED` | `FAILED` | `UNEXECUTED`
   * `tests_executed`: count of actual tests run (e.g. `0` when invocation fails)
2. **`CHANGE`**:
   Must represent both the **working tree state** and the outcome of **attempted edit actions**:
   * `file`: relative path
   * `status`: `MODIFIED` | `UNCHANGED` | `UNTRACKED` | `NOT_FOUND`
   * `hunks`: lines added/removed
   * `attempted_action`: `APPLIED` | `REJECTED` (e.g. target text not found)
3. **`DIAGNOSTIC`**:
   Must retain the **originating source** of the diagnostic:
   * `source`: `compiler` | `linter` | `runtime` | `tool` | `manifest`
   * `location`: `file:line:col` (if applicable)
   * `message`: exact diagnostic string
4. **`RELATION`**:
   Must retain the **mechanical correlation** between diagnostic/target and the repository:
   * `type`: `IN_CHANGED_CODE` | `IN_UNCHANGED_CODE` | `TARGET_RESOLUTION` | `FILE_SYSTEM`
5. **`UNKNOWN`**:
   Explicitly declares what remains unverified or unestablished:
   * `causality`: relationship between separate diagnostics
   * `verification_state`: when 0 tests have run, verification remains explicitly UNKNOWN
   * `intent_correctness`: whether changes meet user intent

---

## 4. Smallest Resulting Schema

The minimal ontology capable of representing all observed software reality across the 30 trials without adding primitives:

```yaml
WTF-EVIDENCE:
  CHANGE:
    - file: string
      status: MODIFIED | UNCHANGED | UNTRACKED | NOT_FOUND
      diff: string (lines added/deleted)
      edit_status: APPLIED | REJECTED | NONE

  DIAGNOSTIC:
    - source: compiler | runtime | tool | manifest
      location: string (file:line:col or target name)
      message: string

  RELATION:
    - diagnostic_ref: integer
      association: IN_CHANGED_CODE | IN_UNCHANGED_CODE | TARGET_NOT_IN_MANIFEST | OPERAND_NOT_FOUND

  VERIFICATION:
    command: string
    stage: INVOCATION | COMPILATION | TEST_EXECUTION | UNEXECUTED
    status: PASSED | FAILED | UNEXECUTED
    tests_executed: integer

  UNKNOWN:
    - item: string (e.g. "causal relationship", "verification state of modified code", "user intent")
```

---

## 5. Conclusion

* **Ontology Status**: The five primitives (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`) **survive falsification**.
* **Why INVOCATION is not a new primitive**: An invalid command target (`cargo test --test impls`) is not a new kind of software entity—it is simply a `VERIFICATION` attempt whose `stage` is `INVOCATION` and whose `tests_executed` is `0`.
* **The root perception defect in the 8B runs**: The Evidence Compiler previously collapsed `VERIFICATION` into an exit code and dumped the target error into `OTHER`. Simply exposing that `tests_executed: 0` and `stage: INVOCATION` within `VERIFICATION` completely represents the reality that derailed the 8B agents.

**Ontology falsification complete. Five primitives preserved. STOPPED.**
