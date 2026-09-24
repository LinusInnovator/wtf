# WTF Phase 6.3 — Stage 2.5: Clean & Freeze the Lab (Harness v2 Validation)

**Date**: September 22, 2026  
**Status**: Completed & Frozen  
**Objective**: Eliminate demonstrated harness-level (H-class) experimental artifacts prior to future WTF primitive experiments.  
**Hard Firewall**: Zero new WTF primitives. Zero prompt changes. Zero turn expansions. Zero model intelligence changes. This stage repairs the laboratory microscope only.

---

## 1. Demonstrated Harness Defects & Harness v2 Repairs

The Stage 2.4 residue audit identified that 45.0% of non-passing trajectories (54 runs) were impaired by experimental interface friction rather than model reasoning failures or missing WTF capabilities. Harness v2 implements three surgical repairs to eliminate these experimental artifacts:

### Fix A: Robust Tool-Call / JSON Extraction
- **Defect in Harness v1**: When models emitted unescaped code characters, internal markdown blocks, or conversational preambles, `json.loads` threw an exception. The fallback regex only extracted `"action"` and silently dropped `"args"` to `{}`. Tool executions were then called with empty string arguments (e.g. `path=""`), causing fatal OS errors.
- **Harness v2 Repair**: 
  1. Multi-tier extraction targeting markdown code fences (````json ... ````).
  2. Balanced-brace sub-object parser isolating valid JSON payload from conversational preamble.
  3. `json.loads(..., strict=False)` allowing raw control characters and newlines within code strings.
  4. Robust fallback regex that recovers both `"action"` and the raw `"args"` object block.
  5. Rejection of missing required arguments before invoking OS operations (no silent empty string arguments).

### Fix B: Whitespace-Tolerant Patch / Line Replacement (`replace_in_file`)
- **Defect in Harness v1**: `replace_in_file` performed a strict, character-by-character substring match (`old_text in content`). If a repository used tab indentation (`\t`) while the model generated spaces (`  `), or if trailing whitespace differed, the edit was rejected with `Error: Target text not found`, derailing otherwise correct code repairs.
- **Harness v2 Repair**:
  1. Exact substring match attempted first.
  2. If exact match fails, line-by-line whitespace-tolerant matching is executed: lines are stripped of trailing whitespace and indentation characters are normalized.
  3. If exactly one unique line span matches in the target file, the replacement is applied while preserving the file's line structure.
  4. If multiple spans match, an informative error is returned: `Error: Ambiguous match (<N> occurrences found). Please provide more context lines.`

### Fix C: Mechanical Environment Protections (Paths & Timeouts)
- **Defect in Harness v1**: Empty paths opened `os.path.join(ws_dir, "")`, attempting to open the workspace root directory as a file and crashing with `[Errno 21] Is a directory`. Subprocess command execution had a rigid 45s timeout that truncated heavy compilation test suites.
- **Harness v2 Repair**:
  1. Explicit path presence validation: `if not p: return "Error: '<action>' requires a non-empty 'path' argument."`
  2. Explicit directory check: `if os.path.isdir(fp): return "Error: Path '<path>' is a directory, not a file."`
  3. Subprocess timeout increased from 45s to 90s to accommodate heavy test runners (Rust `cargo test`, Node TS compilation) without premature termination.

---

## 2. Replay Validation Results (Stratified H-Class Sample)

To validate the repairs without running unnecessary sweeps, 4 representative historical trajectories with primary H-class failures were replayed under identical conditions (same model, task, prompt, WTF condition, 8-turn limit, temperature 0.0, and tools):

| Model | Task | Original H Failure | Harness Fix Tested | Original Failure Still Occurs? | Replacement Failure if Any | Final Stage | PASS / FAIL |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `qwen-2.5-coder-32b-instruct` | `task-02` (Marshmallow) | Args dropped to `{}` due to JSON parser fallback $\rightarrow$ `[Errno 21] Is a directory` | Robust JSON parser + empty path rejection | **NO (Resolved)** | Turn exhaustion during regex refinement | EDITED | FAIL |
| `qwen3-14b` | `task-15` (Ky) | `replace_in_file` failed 4x with `old_text not found` due to tab vs. space mismatch | Whitespace-normalized line replacement | **NO (Resolved)** | Turn exhaustion during test invocation | EDITED | FAIL |
| `qwen3-coder` | `task-05` (SJSON) | `read_file` with empty path crashed with `[Errno 21] Is a directory` | Explicit path validation + informative error | **NO (Resolved)** | Turn exhaustion during source search | UNDERSTOOD | FAIL |
| `qwen3-8b` | `task-04` (Pre-commit) | `run_command` timed out at 45s during pytest | Timeout increased from 45s to 90s | **NO (Resolved)** | Command timed out at 90s on un-scoped `pytest` | EDITED | FAIL |

### Detailed Trajectory Findings:
1. **Marshmallow (`task-02`)**: In Harness v1, turn 2 produced an unescaped regex string that caused the fallback parser to discard `args`. Harness v1 called `open(ws_dir)` and crashed with an OS directory error. In Harness v2, the parser cleanly warned `Error: 'replace_in_file' requires a non-empty 'path' argument.` The model recovered on turn 3, localized `relative_part` on line 160, and continued editing without an OS crash.
2. **Ky (`task-15`)**: In Harness v1, the model's replacement for `cloneShallow` was rejected 4 times because `merge.ts` used tabs while the model emitted 2 spaces. In Harness v2, when the model provided the full function block on turn 7, the whitespace-tolerant matcher identified the unique block and returned **`Success: Modified source/utils/merge.ts`**. The tab-vs-space blocker was 100% eliminated.
3. **SJSON (`task-05`)**: In Harness v1, turn 1 failed with an empty path directory crash, throwing the model into 7 turns of empty command loops. In Harness v2, turn 1 cleanly read `sjson.go` lines 1–120, enabling 7 structured exploration reads across the target file.
4. **Pre-commit (`task-04`)**: In Harness v1, pytest failed at 45s. In Harness v2, the initial test run executed cleanly within the 90s window (returning exit code 4). On turn 5, the model ran `pytest` without target arguments, invoking the entire repository test suite (hundreds of tests) which timed out at 90s. The extra headroom prevented premature cutoff, but confirmed that running un-scoped full test suites is an agent-strategy issue, not a harness defect.

---

## 3. Experimental Contamination Audit

We audited whether Harness v2 altered agent interaction beyond removing the demonstrated friction:

| Model / Task | Metric | Harness v1 | Harness v2 | Delta | Contamination Assessment |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **qwen-2.5-coder-32b \| task-02** | Turns | 8 | 8 | 0 | Identical turn budget consumed |
| | Reads | 3 | 4 | +1 | Natural interaction continuation |
| | Edits | 4 | 3 | -1 | Eliminated blind re-tries |
| | Total Tokens | 16,954 | 22,971 | +6,017 | Context preserved across valid turns |
| | Pass / Fail | FAIL | FAIL | 0 | **No artificial pass inflation** |
| **qwen3-14b \| task-15** | Turns | 8 | 8 | 0 | Identical turn budget consumed |
| | Reads | 4 | 2 | -2 | Shifted turns from reading to editing |
| | Edits | 2 | 4 | +2 | Successfully modified file on turn 7 |
| | Verifications | 0 | 1 | +1 | Progressed to verification stage |
| | Pass / Fail | FAIL | FAIL | 0 | **No artificial pass inflation** |
| **qwen3-coder \| task-05** | Turns | 8 | 8 | 0 | Identical turn budget consumed |
| | Reads | 1 | 7 | +6 | Agent explored code instead of freezing |
| | Verifications | 7 | 1 | -6 | Eliminated empty command loop |
| | Pass / Fail | FAIL | FAIL | 0 | **No artificial pass inflation** |
| **qwen3-8b \| task-04** | Turns | 8 | 6 | -2 | Model terminated earlier after timeout |
| | Reads | 2 | 2 | 0 | Identical localization behavior |
| | Edits | 5 | 1 | -4 | Clean single edit attempt |
| | Verifications | 1 | 2 | +1 | Ran verification cleanly |
| | Pass / Fail | FAIL | FAIL | 0 | **No artificial pass inflation** |

### Contamination Verdict:
- **Zero Pass Inflation**: All 4 runs remained `FAIL`. Harness v2 did not magically solve tasks for the models.
- **Zero Semantic Leakage**: Initial WTF context, diagnostic strings, prompt templates, tool descriptions, and evaluation exit criteria remained 100% byte-identical.
- **Behavioral Purity**: The changes only enabled models to interact with the filesystem and test runner without running into OS directory crashes, tab-vs-space string rejections, or premature 45s execution cutoffs.

---

## 4. Harness v2 Specification & Freeze

Harness v2 is hereby **frozen** as the canonical evaluation environment for all subsequent WTF research.

### Tool Schema Specification (Frozen)
```json
{
  "read_file": {
    "path": "string (non-empty relative workspace path)",
    "start_line": "integer (optional, default 1)",
    "end_line": "integer (optional, default start_line + 119)"
  },
  "replace_in_file": {
    "path": "string (non-empty relative workspace path)",
    "old_text": "string (non-empty target snippet; matched with whitespace/indentation normalization)",
    "new_text": "string (replacement snippet)"
  },
  "write_file": {
    "path": "string (non-empty relative workspace path)",
    "content": "string (complete file content)"
  },
  "run_command": {
    "cmd": "string (shell command executed in workspace root; 90s hard timeout)"
  },
  "wtf_show": {
    "target": "string (e.g. 'diagnostic/0/context')"
  },
  "finish": {
    "summary": "string"
  }
}
```

### Frozen Parameters
- **Turn Budget**: 8 turns (or explicitly registered probe depth).
- **Sampling Temperature**: 0.0.
- **Max Output Tokens**: 1536.
- **Subprocess Timeout**: 90 seconds.
- **Evaluator**: Ground-truth post-fix verification command from `scratch/taskset_6_3_v1/manifest.json`.

---

## 5. Final Decision & Recommendation

### Recommendation: **A — Harness v2 is clean enough to freeze. Proceed to WTF primitive experiments.**

### Baseline Utility Assessment:
- **Can the existing 135-run Harness v1 baseline remain useful historical evidence?**  
  **YES**. The Harness v1 baseline remains valid as a conservative lower bound on model capability. As demonstrated in the contamination audit, fixing H-class defects does not automatically inflate pass rates—models still face severe algorithmic and semantic hurdles (the `UNDERSTOOD → EDITED` synthesis cliff and `EDITED → PASS` repair wall).
- **Will a new baseline eventually be required?**  
  When conducting causal WTF-first vs. Normal comparisons or evaluating new WTF evidence primitives (such as `wtf-verify-on-write` or `wtf-trace-slice`), all conditions should run on **Harness v2** to guarantee zero interference from harness artifacts.
