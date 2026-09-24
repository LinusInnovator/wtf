# WTF Phase 7.3B — Action Friction Closure

## Executive Summary

Phase 7.3B evaluated the single remaining configuration discrepancy from Phase 7.3 and 7.3A:
> **Question:** *Can a tiny task-neutral probe detect action friction when generation-horizon escape is removed?*

In Phase 7.3A, testing action friction on a 20-line class allowed Bonsai to bypass indentation ambiguity by reproducing the entire method header (`def compute_rate(...)`). Phase 7.3B introduced an **enclosing scope of 134 lines** (17 match/case branches, 12-space indentation) to test whether removing generation-horizon escape would expose action friction under localized patching ($\le 15$ lines).

### Key Empirical Findings

1. **Escape Successfully Prevented**:
   Bonsai emitted a 5-line localized replacement (`old_text lines = 5`), successfully verifying that the model did not escape via full-scope reproduction (`GENERATION-HORIZON ESCAPE: PREVENTED`).
2. **High-Fidelity Prompt Copying on Uniform Synthetic Fixtures**:
   Despite 12-space indentation and 17 sibling match cases with similar variable names, Bonsai reproduced the exact whitespace and characters of the 5-line `case 'data_sync':` block. Both exact matching and Action Compilation succeeded.
3. **Blind Profile Sealed**:
   Because exact matching succeeded, the blind probe inferred:
   * `action_capability`: **HIGH**
   * `action_friction_sensitivity`: **LOW**
   * `action_compiler_decision`: **NO** (`use_action_compiler: false`)
   * Sealed profile: `SHA256: 62b92c56d31335a746e6110c4111f56ef1ed649482994b5cfa4fa30316715de3`.
4. **Utility Gate Condition**:
   Per the protocol specification, the utility replay of tasks 01, 08, and 12 was gated on the probe changing `use_action_compiler: false` $\rightarrow$ `true`. Since the probe classified action friction sensitivity as `LOW`, the utility replay was correctly **NOT RUN**.
5. **The Synthetic Uniformity Barrier (Core Epistemic Insight)**:
   A clean, synthetically generated fixture with uniform 4-space indentation and UTF-8 formatting does not generate the mechanical friction of real git repositories. A 27B model's attention mechanism possesses sufficient copying fidelity to replicate 5 lines of 12-space indentation when the prompt excerpt is clean. Real repository friction arises from **entropy** (mixed tabs and spaces, CRLF vs. LF, trailing whitespace on blank lines, multi-file formatting divergence) rather than indentation depth alone.

---

## Section 1 — Preservation of Phase 7.3A Results

As required by the research protocol, the findings of Phase 7.3A are permanently frozen:

* **Receipt Friction**: Correctly detected as `HIGH` (`receipt_mode: "rich"`).
* **Navigation Friction**: Correctly detected as `HIGH` (`suppress_shell: true`, `navigation_mode: "structural_coordinates"`).
* **Shell Operation Elimination**: Verified in held-out replay (13 shell calls $\rightarrow$ 0 shell calls).
* **Configuration Errors Corrected**: 2 of 3 previous errors corrected (Receipts, Navigation).
* **Action Friction**: Remained uncorrected in 7.3A due to scope escape on a 20-line class.
* **Censoring Accounting in Phase 7.3A Held-Out Replay**:
  - `task-12-node-plimit-detached-map`: Clean **FAIL** (turn exhaustion without shell).
  - `task-01-python-starlette-status-code`: **INFRASTRUCTURE CENSORED** (upstream API timeout at Turn 6 after 6 attempts).
  - `task-08-go-gjson-empty-query`: **INFRASTRUCTURE CENSORED** (upstream API timeout at Turn 6 after 6 attempts).
  - *Epistemic constraint*: The outcomes of `task-01` and `task-08` remain classified strictly as censored runs. Counterfactual outcomes are not inferred.

---

## Section 2 — Action Friction Closure Probe Architecture

The paired probe evaluated a trivial semantic mutation (`max_retries = 3` $\rightarrow$ `max_retries = 5`) under two conditions:

### Condition A: Low Friction
* **File**: `worker.py` (5 lines):
  ```python
  def configure_worker():
      # Worker configuration
      worker_timeout = 30
      max_retries = 3
      return worker_timeout, max_retries
  ```
* **Observed Action**:
  - `old_text = "max_retries = 3"`
  - `new_text = "max_retries = 5"`
* **Evaluation**: Exact match: `True` | Action Compilation: `True`.

### Condition B: Realistic Action Friction (Generation-Horizon Escape Control)
* **File**: `dispatcher.py` (134 lines, 17 match/case branches).
* **Deterministic Friction Elements**:
  - Deep indentation: 12 spaces inside `match event_type:`.
  - Repeated anchors: 17 cases defining `worker_timeout` and `max_retries`.
  - Enclosing scope scale: 134 lines, exceeding practical generation escape.
* **Target Case** (lines 118–123):
  ```python
              case 'data_sync':
                  # Heavy synchronization pipeline with retries
                  worker_timeout = 30
                  max_retries = 3
                  return self.router.sync_data(payload, timeout=worker_timeout, retries=max_retries)
  ```
* **Observed Action**:
  - Emitted `old_text` (5 lines):
    ```python
                case 'data_sync':
                    # Heavy synchronization pipeline with retries
                    worker_timeout = 30
                    max_retries = 3
                    return self.router.sync_data(payload, timeout=worker_timeout, retries=max_retries)
    ```
  - Emitted `new_text` (5 lines):
    ```python
                case 'data_sync':
                    # Heavy synchronization pipeline with retries
                    worker_timeout = 30
                    max_retries = 5
                    return self.router.sync_data(payload, timeout=worker_timeout, retries=max_retries)
    ```
* **Escape Control Evaluation**:
  - `len(old_text.splitlines()) == 5` ($\le 15$ lines).
  - `GENERATION-HORIZON ESCAPE: PREVENTED`.
* **Enactment Evaluation**:
  - Exact match count in 134-line file: Exactly 1.
  - `exact_match: True`.
  - `compiled_match: True` (data sync block correctly modified).

---

## Section 3 — Blind Inferred Profile & Cryptographic Freeze

The blind evaluation was serialized and cryptographically hashed prior to opening Phase 7.1 reference records:

```json
{
  "raw_calibration": {
    "timestamp_utc": "2026-09-23T19:19:54Z",
    "probe": "action_friction_closure",
    "total_tokens": 1443,
    "wall_time_s": 54.28,
    "low_friction": {
      "exact_match": true,
      "compiled_match": true,
      "old_text": "max_retries = 3",
      "new_text": "max_retries = 5"
    },
    "realistic_friction": {
      "fixture_lines": 134,
      "target_line": 118,
      "old_text_lines": 5,
      "escape_observed": false,
      "exact_match": true,
      "compiled_match": true,
      "data_sync_modified": true,
      "old_text": "            case 'data_sync':\n                # Heavy synchronization pipeline with retries\n                worker_timeout = 30\n                max_retries = 3\n                return self.router.sync_data(payload, timeout=worker_timeout, retries=max_retries)",
      "new_text": "            case 'data_sync':\n                # Heavy synchronization pipeline with retries\n                worker_timeout = 30\n                max_retries = 5\n                return self.router.sync_data(payload, timeout=worker_timeout, retries=max_retries)"
    }
  },
  "predicted_profile": {
    "model_id": "UNKNOWN_EVALUATED_INTELLIGENCE",
    "calibrated_at": "2026-09-23T19:19:54Z",
    "action_capability": "HIGH",
    "action_friction_sensitivity": "LOW",
    "action_compiler_decision": "NO",
    "escape_status": "PREVENTED",
    "inferred_configuration_delta": {
      "use_action_compiler": false
    },
    "sha256_seal": "62b92c56d31335a746e6110c4111f56ef1ed649482994b5cfa4fa30316715de3"
  }
}
```

* **Timestamp:** `2026-09-23T19:19:54Z`
* **Cryptographic Hash:** `SHA256: 62b92c56d31335a746e6110c4111f56ef1ed649482994b5cfa4fa30316715de3`

---

## Section 4 — Reveal and Empirical Comparison with Phase 7.1

Following the cryptographic freeze, the result was compared against the Phase 7.1 ground truth:

| Evaluation Aspect | Phase 7.3B Blind Probe | Phase 7.1 Empirical Ground Truth | Status |
| :--- | :--- | :--- | :---: |
| **Action Capability** | `HIGH` (Exact match succeeded on both low and realistic fixtures) | `HIGH` (Model can generate valid code mutations) | **MATCH** |
| **Action Friction Sensitivity** | `LOW` (Exact match succeeded despite 12-space indentation and 134-line scope) | `HIGH` (11 of 11 successful mutations in Phase 7.1 required Action Compilation) | **MISMATCH** |
| **Action Compiler Decision** | `NO` (`use_action_compiler: false`) | `YES` (`use_action_compiler: true`) | **UNCORRECTED** |

### Why Did the Probe Misclassify Action Friction Sensitivity?

This result uncovers a critical epistemic principle regarding synthetic calibration:

1. **Prompt Copying Fidelity**:
   In a synthetic fixture, the target code is rendered directly in the prompt with clean, uniform whitespace. Frontier-class models (including Bonsai 2 27B) possess high attention fidelity: when asked to replace a block shown in the prompt, the model can copy the exact 12 leading spaces and tokens verbatim.
2. **The Missing Ingredient: Formatting Entropy**:
   In real production software work, the friction that necessitates Action Compilation does not come from indentation depth alone. It comes from:
   - **Indentation Style Discrepancies**: Files using tabs (`\t`) where the model emits 4 spaces, or 2-space indented files where the model defaults to 4 spaces.
   - **Line Endings & Trailing Whitespace**: Hidden trailing spaces on blank lines or CRLF line endings.
   - **Context Truncation Drift**: When an agent edits code based on a partial viewport or memory rather than copying an active prompt excerpt.
3. **Epistemic Conclusion**:
   A task-neutral probe that uses a clean, uniformly formatted synthetic fixture cannot distinguish between an intelligence that needs Action Compilation and one that does not. To measure true action friction sensitivity, a task-neutral calibration must introduce **deterministic formatting entropy** (e.g. mixed tab/space indentation or trailing whitespace variance).

---

## Section 5 — Utility Gate Accounting

Per the experimental protocol:
> *Only if the blind probe changes `use_action_compiler: false` $\rightarrow$ `use_action_compiler: true` construct the completed friction-aware handshake configuration... Then replay the SAME held-out tasks: task-01, task-08, task-12.*

Because the blind probe produced `action_compiler_decision: NO` (`use_action_compiler: false`), the utility gate condition was **not met**.

* **Utility Test Status**: **NOT RUN**.
* **Rationale**: Re-running the held-out tasks under `use_action_compiler: false` would simply replicate the Phase 7.3A condition, consuming redundant inference compute without testing a new configuration state.

---

## Research Invariant Sign-Off

```
PHASE 7.3A: FROZEN
PHASE 7.3B: COMPLETE
ACTION PROBES: 1 paired probe (2 trials)
GENERATION-HORIZON ESCAPE: PREVENTED
ACTION CAPABILITY: HIGH
ACTION FRICTION SENSITIVITY: LOW
ACTION COMPILER DECISION: NO
PROFILE FROZEN BEFORE REVEAL: YES
7.3 CONFIGURATION ERRORS CORRECTED: 2/3
UTILITY TEST: NOT RUN
GENERIC WTF: 3/3 PASS (86,062 tokens, 734.8s, 3 edits, 0 shell ops)
7.3 HANDSHAKE: 0/3 PASS (87,137 tokens, 367.9s, 0 edits, 13 shell ops)
7.3A: 0/3 PASS (48,820 tokens, 1016.2s, 0 edits, 0 shell ops)
7.3B: NOT RUN (Utility gate unopened; use_action_compiler remained false)
INFRASTRUCTURE-CENSORED RUNS: task-01 (API Timeout T6 in 7.3A), task-08 (API Timeout T6 in 7.3A)
SEMANTIC BOUNDARY PRESERVED: YES
HANDSHAKE CONFIGURATION COMPLETE: NO
READY FOR UNKNOWN-MODEL GENERALIZATION: NO
```
