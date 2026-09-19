# WTF Agent-Effectiveness Research (Archived)

**Status: INCONCLUSIVE / DEFERRED**

This document records the experimental investigations into coding-agent effectiveness conducted prior to the launch of WTF V0, along with their findings, methodological limitations, and final conclusions.

---

## Executive Summary & Final Status

* **Status**: `Agent-effectiveness research: INCONCLUSIVE / DEFERRED`.
* **Product Scope**: WTF V0 has **not** demonstrated that WTF makes coding agents more capable. Proving or disproving that hypothesis is **not** required for V0 and does **not** block launch.
* **Core Value of WTF V0**: WTF is a local, harness-independent CLI that inspects what actually changed, compresses the review surface, surfaces relevant evidence, and independently executes project verification. It does not need to prove that it makes agents smarter.

---

## Key Experimental Conclusions

### 1. The Historical "Control 6/10 vs WTF 10/10" Result is INVALID
* **Finding**: The original historical trial reporting "Control 6/10 vs WTF 10/10" is **invalid and must never be cited as evidence**.
* **Reason**: Forensic review found a flaw in the runner script where the control condition was unable to modify the repository while the WTF condition received the historical ground-truth fix. Any claim of a +40% accuracy lift is factually ungrounded.

### 2. The Reflection vs. Evidence Experiment Does NOT Establish Correctness Lift
* **Finding**: The subsequent Reflection vs. Evidence experiment does **not** establish that WTF improves coding-task correctness.
* **Non-Equivalence**: The headline score of `2/4 Control, 2/4 Reflection, 2/4 WTF` should **not** be presented as proof of equivalence either.
* **Methodological Limitations**:
  * Independent, unaligned agent trajectories.
  * Artificial, forced turn limits.
  * Weak correctness proxies.
  * Evaluated a hypothetical agent integration rather than deployed WTF V0.

### 3. Observed Behavioral Signals
* **Grounding & State Exposure**: One useful signal emerged across trials: WTF sometimes changed verification and grounding behavior by surfacing repository or verification state that the agent had not established itself (e.g. uncommitted files, skipped tests, unrun test suites).
* **The `bstr` Epistemic Boundary**: The `bstr` case study revealed a critical epistemic boundary: **passing tests and typechecks do not prove that intended behavior is correct**. A macro with inverted arguments passed existing tests while introducing subtle recursion. WTF must remain scrupulously precise about *what* was verified (e.g. "tests passed", "build exited 0") rather than asserting that the software is correct. Intended behavior remains `UNKNOWN`.

### 4. Broader Hypothesis: Unproven
* **Hypothesis**: Deterministic external evidence may improve agent grounding and reduce required model reasoning.
* **Status**: **UNPROVEN**. While conceptually sound and motivated by observed grounding shifts, establishing this scientifically requires a future study designed around deployed agent integrations, identical pre-intervention states, independent ground-truth evaluation, and strict epistemic calibration.

---

## Moving to Launch

WTF V0 is frozen and ready:
- **No benchmark claims**: Public documentation does not make claims of agent performance improvement.
- **No epistemic overreach**: Terminal output and docs clearly distinguish between passing test suites (`VERIFIED`) and unprovable user intent (`UNKNOWN`).
- **Real-world validation**: The next meaningful experiment is strangers using WTF in real workflows.
