# Bonsai 2 27B — Profile Validation & Rescue Experiment

**Phase:** WTF Phase 7.2  
**Subject:** `prism-ml/ternary-bonsai-2-27b` (Bonsai 2 27B Reasoning Model)  
**Evaluation Harness:** Frozen WTF Benchmark Suite (`taskset_6_3_v1`, 15 tasks)  
**Control Baseline:** Frozen Phase 7.1 Generic WTF Baseline (10/15 PASS)  
**Intervention Configuration:** Profile-Derived WTF (Exploratory Shell Suppression, Deterministic Trace Frame Injection, Null-Action Redirection, Viewport v1 400 lines, Action Compilation v0, Rich Receipts)  
**Protocol:** 8 turns, temperature 0.0, deterministic action execution, independent evaluation  

---

## 1. Research Question & Hypothesis

In Phase 7.1, we established the first experimentally derived operating profile for Bonsai 2 27B, discovering:
1. **High Action Assistance Need (8/10)**: Strict character-exact matching caused immediate failure on whitespace/formatting discrepancies.
2. **Very High Receipt Density Requirement (9/10)**: Terse exit-code feedback paralyzed the recovery engine.
3. **High Context Appetite (8/10) & Long-Context Stability (9/10)**: 400-line viewports enabled search without degradation.
4. **Interface Mismatch in Observed Trajectories**: In the failed baseline runs, unconstrained bash access tempted the model into burning turn budgets on manual directory traversal (`find`, `ls`, `pwd`, `cd`) and manual test invocations.

**Core Research Question:**  
*Can profile-derived WTF adaptations rescue Bonsai failures without adding intelligence or semantic guidance?*

**Constitutional Boundary:**  
*Adapt the environment around intelligence. Never smuggle intelligence into the environment.*  
Zero semantic hints, zero relevance ranking, zero suggested root causes, zero hand-written task guidance.

---

## 2. Stage A — Forensic Classification of Baseline Failures

Before intervening, we performed forensic trajectory analysis across the 5 failed tasks from Phase 7.1 to isolate where capability was lost:

| Task ID | Ecosystem | Turns | Shell Calls | Reads | Edits | Failure Classification | Trajectory Evidence |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `task-05-go-sjson-trailing-bracket` | Go | 8 | 5 | 2 | 0 | **NAVIGATION WASTE / SHELL HAZARD** | In Turn 2, Bonsai identified the exact root cause: *"I found the `case '{':` block at lines 343-350. It blindly slices `jsres.Raw[:len(jsres.Raw)-1]`."* It then burned 5 turns on bash commands (`grep`, `cd /home/user && go test`, `pwd && ls`, `go test`), exhausting its turn budget without applying an edit. |
| `task-06-go-cmp-textual-byte-slices` | Go | 8 | 1 | 2 | 0 | **UNCONSTRAINED REASONING / ACTION LOSS** | In Turn 3, Bonsai saw the logic in `cmp/report_reflect.go` (*"The current heuristic uses `&&` which is wrong - it should be `\|\|`"*). However, in Turns 5, 6, 7, 8, it emitted natural-language thought essays without tool call wrappers (`action: None`), silently consuming turns. |
| `task-07-go-uuid-v7-monotonicity` | Go | 8 | 2 | 2 | 0 | **REASONING / BITWISE MATH LIMIT** | Understood that uuid v7 requires monotonic timestamp sequence increments, but struggled with the 12-bit sequence counter bitwise math and stalled without proposing an edit. |
| `task-11-rust-anyhow-ensure-neg` | Rust | 7 | 1 | 3 | 0 | **REASONING / MACRO PARSING LIMIT** | Macro expansion complexity. Attempted to read `src/macros.rs` and `src/ensure.rs`, but got overwhelmed by macro matching rules and never formulated a valid syntax fix. |
| `task-15-node-ky-hook-mutation-leak` | Node | 7 | 3 | 3 | 0 | **NAVIGATION WASTE / PERCEPTION** | Burned Turns 1, 4, 5 on exploratory shell searches (`ls -la && find ...`, `ls test/`, `grep -n "init hook"`) searching for test files rather than focusing on `source/core/Ky.ts`. |

---

## 3. Stage B — Profile-Derived Deterministic Interventions

Based on the Phase 7.1 profile findings and trajectory evidence, we constructed the minimum deterministic intervention:

1. **Exploratory Shell Suppression & Redirection (Scoped to Tested Trajectories):**  
   When Bonsai issues exploratory directory searches (`find`, `ls`, `pwd`, `cd`, `dir`) or manual test suite runs (`go test`, `pytest`, `cargo test`, `npm test`), WTF deterministically rejects/redirects:  
   *"Exploratory shell operation suppressed. The current working directory is the repository root. Verification is automatically performed via Verify-on-Write upon every 'replace_in_file' call. Use 'read_file' to view source files or 'replace_in_file' to apply fixes directly."*
2. **Deterministic Trace Frame Injection:**  
   Mechanically parsed compiler/test runtime error frames (via regex) are exposed in the initial prompt header as `Deterministic Failure Coordinates: <file>:<line>`.
3. **Null-Action Redirection:**  
   When the model emits thoughts without an action block, WTF reminds it deterministically:  
   *"No action specified. To make progress, output a valid JSON action block: 'read_file', 'replace_in_file', 'run_command', or 'finish'."*
4. **Preserved Invariants:**  
   Action Compilation v0 enabled, 400-line Viewport v1 preserved, Rich Verification Receipts (800 chars stdout/stderr) preserved.

All 5 failure tasks were replayed fresh at temperature 0.0 with an 8-turn budget.

---

## 4. Stage C — Experimental Measurements: Baseline vs. Adapted

### Direct Comparative Results

| Task ID | Condition | Outcome | Turns | Total Tokens | Reads | Shell (Suppr) | Edits | Action Comp | Wall Time | Failure Boundary |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `task-05` (sjson) | Baseline | FAIL | 8 | 49,177 | 2 | 5 (0) | 0 | 0 | 343.2s | REASONING |
| | **Adapted** | **FAIL** | 5 | 9,996 | 4 | 0 (0) | 0 | 0 | 281.5s | REASONING |
| `task-06` (cmp) | Baseline | FAIL | 8 | 74,669 | 2 | 1 (0) | 0 | 0 | 838.5s | REASONING |
| | **Adapted** | **FAIL** | 8 | 13,962 | 4 | 3 (2) | 0 | 0 | 322.7s | REASONING |
| `task-07` (uuid) | Baseline | FAIL | 8 | 21,378 | 2 | 2 (0) | 0 | 0 | 334.7s | REASONING |
| | **Adapted** | **FAIL** | 8 | 23,741 | 6 | 2 (1) | 0 | 0 | 107.3s | REASONING |
| `task-11` (anyhow) | Baseline | FAIL | 7 | 58,416 | 3 | 1 (0) | 0 | 0 | 1,190.9s | REASONING |
| | **Adapted** | **FAIL** | 8 | 29,751 | 6 | 0 (0) | 2 | 2 | 167.7s | REASONING (Fix incorrect) |
| `task-15` (ky hook) | Baseline | FAIL | 7 | 51,697 | 3 | 3 (0) | 0 | 0 | 720.2s | REASONING |
| | **Adapted** | **FAIL** | 8 | 15,836 | 5 | 3 (3) | 0 | 0 | 82.3s | REASONING |

---

## 5. Analysis & Scientific Interpretation

### 1. Rescues: Zero FAIL $\rightarrow$ PASS (0 / 5)

Under strict scientific evaluation, **zero failures were converted to passes (0/5)**.
Profile-derived deterministic adaptation did **not** increase the absolute benchmark score beyond 10/15.

Per the experimental protocol:
> *"If zero FAIL → PASS, stop. Do not run the full 15-task suite. Interpret honestly: the Operating Profile may improve efficiency without moving capability."*

Therefore, Stage D (rerunning the full 15-task suite) was correctly NOT run.

### 2. Efficiency & Waste Reduction: Massive FAIL $\rightarrow$ FAIL with Less Waste

While absolute capability did not expand, the Operating Profile produced an extraordinary reduction in cognitive and deterministic waste:

* **Token Consumption:** Dropped from **255,337 tokens** to **93,286 tokens** (**63.5% reduction** in wasted tokens across the 5 tasks).
* **Wall Clock Time:** Dropped from **3,427.5s (57.1 minutes)** to **961.5s (16.0 minutes)** (**71.9% reduction** in latency).
* **Exploratory Shell Suppression:** In `task-15`, all 3 exploratory shell calls were intercepted and redirected to direct file reads; in `task-06`, 2 shell calls were suppressed; in `task-05`, shell calls dropped from 5 to 0. File reads increased from an average of 2.4 to 5.0 per task across these five runs.

### 3. Shift in Failure Boundary: `task-11-rust-anyhow-ensure-neg`

In the Generic baseline, `task-11` spent all turns lost in `macros.rs` and `ensure.rs`, producing 0 edits and wallowing in macro expansion noise.
In the Profile-Derived condition, deterministic coordinate foregrounding enabled Bonsai to immediately target `src/error.rs`, where it synthesized **2 successful edits** resolved by Action Compilation v0.
However, because the primary test failure was a macro token parsing branch in `tests/test_ensure.rs` (`ensure!(a <= b || a - b <= 10)`), resolving the lifetime warnings in `src/error.rs` did not satisfy the test assertion.
This moved the failure boundary cleanly from **unanchored exploration** to a **genuine semantic reasoning limit**.

### 4. Epistemic Grounding & Overclaim Corrections

> **Core Grounding:**  
> After the tested deterministic waste was removed, the remaining failures localized predominantly at semantic reasoning boundaries under the current WTF configuration and 8-turn protocol.

We do not claim irreducibility, absolute cognitive thresholds, or universal model limits. The observed failures reflect the boundary of Bonsai 2 27B under this specific 8-turn evaluation contract.
Furthermore, shell suppression is scoped strictly to these five trajectories where manual bash exploration was proven to consume budget without productive mutations; we do not generalize shell suppression as universally beneficial across all tasks or agents.

---

## 6. Frozen Phase 7.2 Findings

1. **Causally Useful Profile Without Capability Expansion:**  
   > *A model-specific WTF Operating Profile can be causally useful even when it does not increase task success: profile-derived deterministic adaptation substantially reduced wasted intelligence and moved failures closer to the residual semantic reasoning boundary.*

2. **Dual Metric for WTF Optimization:**  
   > *WTF optimization must measure both usable capability and intelligence expenditure. PASS rate alone is insufficient.*

3. **Extension of Residual Intelligence Requirement (RIR):**  
   > *Residual Intelligence Requirement is not merely whether a model can solve a task, but how much intelligent work remains necessary after deterministic work has been compiled away.*

---

## 7. Constitutional Boundary Preservation

### WTF MAY:
* Expose deterministic reality (file contents, coordinates, verification receipts).
* Compile already-decided actions (whitespace, indentation, structural disambiguation).
* Redirect redundant deterministic operations (exploratory shell loops).
* Expose mechanically available failure evidence (compiler diagnostics, test failure frames).
* Adapt deterministic representations (viewports, coordinate slices).

### WTF MUST NOT:
* Infer semantic relevance or rank candidate files by "importance".
* Suggest root cause or diagnose application logic.
* Choose what software behavior should change.
* Provide task-specific semantic hints.
* Substitute deterministic machinery for an intelligent decision.

**Rule:**  
> *Adapt the environment around intelligence. Never smuggle intelligence into the environment.*

---

## 8. Frozen Bonsai Evidence at Current Confidence

Within the tested coding environment:

### Strong Evidence:
* Benefits decisively from Action Compilation (prevents patch rejection on formatting variance).
* Benefits decisively from rich verification receipts (terse exit codes collapse recovery).
* Tolerates substantial context without degenerative looping (30k–75k tokens across 8 turns).
* Profile-derived adaptation can dramatically reduce deterministic waste (-63.5% tokens, -71.9% wall time).

### Supported but Not Universal:
* Structural/coordinate navigation is useful for accelerating file localization.
* Redundant shell exploration can be wasteful in localized repair tasks.

### Explicitly Not Established:
* 300–500 lines is globally optimal.
* No lost-in-the-middle effect exists.
* Shell suppression is universally beneficial.
* Profile properties transfer to other Bonsai variants.
* Remaining failures are irreducible.
* The operating profile increases benchmark PASS rate.

---

## 9. Phase 7 Research Frontier

* **Phase 7.1:** Can we experimentally characterize how an intelligence interacts with WTF?  
  $$\longrightarrow\ \mathbf{YES}.\ \text{First Bonsai Operating Profile produced.}$$
* **Phase 7.2:** Can that profile produce causally useful adaptations?  
  $$\longrightarrow\ \mathbf{PARTIAL\ YES}.\ \text{Large efficiency/waste improvement; no observed capability rescue.}$$
* **Phase 7.3 Frontier:**  
  > *Can WTF discover a useful Operating Profile automatically through a small, task-neutral Capability Handshake?*

---

## Deliverable Sign-Off

PHASE 7.2: FROZEN  
FAIL→PASS: 0/5  
TOKEN REDUCTION: 63.5%  
WALL REDUCTION: 71.9%  
PROFILE CAUSALLY USEFUL: YES — efficiency/waste localization  
CAPABILITY INCREASE ESTABLISHED: NO  
SEMANTIC BOUNDARY PRESERVED: YES  
BONSAI PROFILE STATUS: EXPERIMENTALLY DERIVED, PARTIALLY CAUSALLY VALIDATED  
NEXT FRONTIER: AUTOMATIC CAPABILITY HANDSHAKE  
READY FOR PHASE 7.3: YES
