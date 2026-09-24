# WTF Phase 7 — Synthesis, Reconciliation & Architectural Freeze

## Executive Summary

Phase 7 evaluated the frontier of model-specific interaction:
> **Core Question:** *Can a task-neutral Capability Handshake automatically discover how an unfamiliar intelligence needs software reality exposed, and does fitting that interface unlock latent capability while preserving the invariant deterministic substrate?*

Across nine subphases (7.1 through 7.6), we developed, tested, falsified, reconciled, and replicated the Capability Handshake across four distinct intelligences:
1. **Bonsai 2 27B** (`prism-ml/ternary-bonsai-2-27b`)
2. **Stranger #1:** Qwen 2.5-Coder 3B (`qwen2.5-coder:3b`)
3. **Stranger #2:** Llama 3.2 3B (`meta-llama/llama-3.2-3b-instruct`)
4. **Stranger #3:** Qwen 2.5-Coder 0.5B (`qwen2.5-coder:0.5b`)

This document synthesizes the empirical evidence, reconciles failed early hypotheses with final findings, and freezes the tripartite architecture, design laws, and definitions for Phase 8.

---

## 1. Chronological Reconstruction & Empirical Journey

We preserve the forensic trajectory of discovery without rewriting history as if the end state were known in advance.

### Phase 7.1 — Bonsai 2 27B Baseline & Initial Profile Discovery
* **Setup:** Evaluated Bonsai 2 27B across the 15-task benchmark (`TASKSET-6.3-v1`).
* **Finding:** Bonsai scored 10/15 PASS. Forensic inspection revealed that all 5 failed tasks were severely exacerbated by interface friction: aggressive directory wander loops (`find`, `grep -R`, `cd`) burning turn budgets, and mechanical patch rejections on whitespace and line-wrap boundaries.

### Phase 7.2 — Profile Validation & Waste Reduction
* **Setup:** Replayed the 5 failed Bonsai tasks with profile-derived interface adaptations (structural coordinate projection and shell command suppression).
* **Finding:** While binary PASS rate did not increase (0/5 rescues, as all 5 models terminated at genuine semantic reasoning boundaries such as UUID monotonicity or Ky prototype cloning), unnecessary deterministic waste collapsed:
  * Tokens: 255,337 $\rightarrow$ 93,286 (**-63.5%**)
  * Wall time: 3,428s $\rightarrow$ 962s (**-71.9%**)
  * Shell wander loops were completely eliminated.
  * Failures were cleanly localized to the semantic reasoning boundary rather than obscured by exploratory noise.

### Phase 7.3 — Initial Capability Handshake (The Micro-Probe Failure)
* **Setup:** Built an initial 5-probe handshake testing Context, Action, Receipts, Navigation, and Verification. Tested against Bonsai treated as an unknown model.
* **The Failed Hypothesis:** *Micro-capability in sterile, toy environments predicts operating requirements in realistic software environments.*
* **Empirical Falsification:**
  * In a small, clean 10-line fixture, Bonsai demonstrated perfect exact-string replacement without Action Compilation.
  * In a single-assertion test, Bonsai easily recovered from terse exit codes.
  * Consequently, the handshake disabled Action Compilation (`use_action_compiler: false`) and selected terse receipts.
  * In held-out utility testing on real multi-file repositories, this configuration suffered catastrophic regression: **Generic WTF 3/3 PASS $\rightarrow$ Handshake WTF 0/3 PASS**.
* **Correction:** Micro-capability does not predict operating resilience under environmental friction.

### Phase 7.3A — Friction-Sensitivity Calibration
* **Setup:** Refactored the handshake probes to measure *differential friction sensitivity* (comparing model performance under low vs. high realistic friction: multi-test localization ambiguity, complex directory trees, and formatting drift).
* **Finding:** Correctly detected high receipt friction sensitivity (terse vs. rich on multi-test suites) and high navigation friction sensitivity (shell wandering). Corrected 2 of 3 configuration errors, reducing held-out shell calls from 13 to 0.

### Phase 7.3B — Action Friction Closure
* **Setup:** Isolated the remaining error (`use_action_compiler: false`). Investigated whether a paired task-neutral mutation probe with generation-horizon escape prevented could detect action friction.
* **Finding:** Even when generation-horizon escape was eliminated, Bonsai faithfully reproduced exact 12-space indentation and exact characters on a 134-line fixture. The probe still classified action friction as LOW.

### Phase 7.3C — Action Compilation Forensic Audit (The Substrate Resolution)
* **Setup:** Halted probe redesign. Conducted an empirical audit of **80 real historical Action Compilation resolutions** (11 in Phase 7.1 Bonsai, 7 in Stage 5.2 Qwen replay, 62 in Phase 6 Frontier ladder).
* **The Fundamental Discovery:**
  * Real Action Compilation resolutions made **0 semantic decisions**.
  * False-positive mutations: **0**.
  * Fail-closed rejections: **9+ clean rejections** of ambiguous or empty patches.
  * Formatting entropy observed: tab vs. space drift, line wrapping, blank-line boundaries, and serialization escaping (CRLF was not observed across 641 benchmark files).
* **Architectural Epiphany:** Action Compilation is not an adaptive preference to be calibrated to model taste; it is an **Invariant Substrate** capability (analogous to an instruction compiler) that deterministically enacts already-decided mutations.
* **Frozen Design Law:** *Do not calibrate deterministic work that can safely be compiled away. Calibrate only the interface between deterministic reality and intelligence.*

### Phases 7.4 to 7.6 — Unknown-Model Generalization & Discrimination
* **Setup:** Froze the handshake to calibrate ONLY the Adaptive Interface (Context Viewport, Receipt Density, Navigation Scope) while holding Action Compilation ON as fixed substrate.
* **Blind Evaluation Across Three Strangers:**
  * **Phase 7.4 (Stranger #1 — Qwen 2.5-Coder 3B):** Discovered profile sealed prior to reveal (`SHA256: 30288471...`). Post-reveal comparison matched historical behavior across all 3 dimensions (3/3 MATCH). In held-out testing, Handshake WTF eliminated an 8-turn shell find loop (-87.5% shell ops) and achieved 1 verified AC code edit where Generic WTF had 0 edits.
  * **Phase 7.5 (Stranger #2 — Llama 3.2 3B):** Exact byte-identical handshake replicated without modification. Sealed prior to reveal (`SHA256: 2b0dfce5...`). Post-reveal comparison: 3/3 MATCH against 15 historical benchmark runs. In held-out testing: -90.9% shell ops (11 $\rightarrow$ 1), wall time -13.3%, and unlocked 5 verified AC code edits where Generic WTF had 0 edits.
  * **Phase 7.6 (Stranger #3 — Qwen 2.5-Coder 0.5B):** Exact byte-identical handshake evaluated on an extreme sub-billion edge model (50x parameter downscale). Sealed prior to reveal (`SHA256: 9486fa13...`). Post-reveal comparison: 3/3 MATCH against 15 Phase 6.5 runs (where 93.3% of historical failures were PERCEPTION). In held-out testing: completely grounded the model, eliminating ungrounded hallucinations (`Action=None`, `Action=unknown_action`) and focusing 100% of turns to exact failure coordinates.

---

## 2. Frozen Architecture

WTF's architecture is frozen into three epistemically distinct tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          RESIDUAL INTELLIGENCE                         │
│   (Semantic reasoning, root-cause diagnosis, algorithmic synthesis,    │
│    desired behavior specification - strictly preserved for model)      │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                       Semantic Intended Mutation
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                           ADAPTIVE INTERFACE                           │
│   (Task-neutral exposure fitted to intelligence consuming it)          │
│   • Context Viewport: [Compact (150) vs Expanded (400)]                │
│   • Receipt Density:  [Terse vs Rich Tracebacks]                       │
│   • Navigation Scope: [Structural Coordinates vs Shell Scoping]        │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
                       Deterministic Feedback & Diffs
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                          INVARIANT SUBSTRATE                           │
│   (Deterministic execution layer removing mechanical waste)            │
│   • Action Compilation v0: Resolves anchor/whitespace impedance        │
│   • Verify-on-Write v1:    Instantaneous post-mutation verification    │
│   • Receipt Contract v0.1: Machine evidence validation                 │
└────────────────────────────────────────────────────────────────────────┘
```

### A. Invariant Substrate
Deterministic mechanisms whose purpose is to remove work intelligence should not perform.
* **Action Compilation v0:** Resolves mechanical indentation drift, line-wrap splits, and JSON serialization escaping on uniquely specified mutations without altering replacement strings.
  * *Evidence Level:* **ESTABLISHED** within tested coding-action domain (80/80 successful resolutions, 9+ fail-closed rejections, 0 semantic decisions, 0 false-positive mutations).
* **Verify-on-Write v1:** Executes targeted test commands immediately upon successful file mutation, returning fresh exit codes and tracebacks.
  * *Evidence Level:* **ESTABLISHED**.
* **Receipt Verification Contract v0.1:** Generates cryptographic machine verification lines proving test execution without human interpretation.
  * *Evidence Level:* **ESTABLISHED**.

### B. Adaptive Interface
Deterministic representations whose usefulness depends on the intelligence consuming them. Calibrated via the frozen 3-probe Capability Handshake:
1. **Context Viewport Bounds:** `viewport_lines: 150` vs `viewport_lines: 400`.
2. **Receipt Density:** `receipt_mode: "terse"` vs `receipt_mode: "rich"`.
3. **Navigation Projection / Shell Scope:** Structural failure coordinate injection and `suppress_shell: true/false`.
* *Evidence Level:* **ESTABLISHED**. Evaluated across 4 distinct intelligences (0.5B to 27B) with zero model-identity leakage.

### C. Residual Intelligence
Semantic decisions that remain after deterministic work and interface friction have been removed:
* Root-cause diagnosis.
* Algorithmic hypothesis formation.
* Determining desired behavioral specification.
* Synthesizing replacement code logic.
* *Evidence Level:* **ESTABLISHED**. In all experiments, WTF never generated replacement code or guided semantic repair.

---

## 3. Frozen Lineage of the Capability Handshake

The Capability Handshake engine used in Phases 7.4, 7.5, and 7.6 is frozen:
* **Engine Script:** `scratch/handshake_7_4_engine.py` (and byte-identical probe implementations in `scratch/handshake_7_5_engine.py` and `scratch/handshake_7_6_engine.py`).
* **Probe 1 (Context Exposure):** Compact 20-line viewport vs. Expanded 150-line viewport with embedded salt key.
* **Probe 2 (Receipt Exposure):** 8-function validator suite with terse exit code vs. rich traceback with assertion line.
* **Probe 3 (Navigation Scope):** 16-node multi-directory tree with unconstrained tools vs. structural coordinate header.
* **Artifact Hashes:**
  * Phase 7.4 Engine: `4004bb35309c5b17b272d4d3a5e3034cec9b0ebcb77aab5ea5e353c65e3437f6`
  * Phase 7.5 Engine: `c6eba4e0efea63ee0be49df12f7caaed724525f54e4d958a8fca80662233c1d7`
  * Phase 7.6 Engine: `bd0c6e1c476cbbdadde449a840874a3cf07932e11d8307543682755bfc4525ba`
  *(Probe logic byte-for-byte verified identical across all three).*

---

## 4. Frozen Blind Generalization & Discrimination Evidence

### A. Generalization Across Blind Strangers
Across all three blind strangers, the handshake was executed without model identity, parameter count, architecture, or prior benchmark knowledge, and sealed cryptographically before revealing historical data:

| Stranger | Model Name | Parameter Scale | Calibration Footprint | SHA-256 Seal | Historical Agreement |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Stranger #1** | Qwen 2.5-Coder 3B | 3.09B | 1,724 tok / 19.91s | `30288471...` | **3 / 3 MATCH** |
| **Stranger #2** | Llama 3.2 3B | 3.21B | 1,611 tok / 10.21s | `2b0dfce5...` | **3 / 3 MATCH** |
| **Stranger #3** | Qwen 2.5-Coder 0.5B | 0.49B | 1,667 tok / 6.05s | `9486fa13...` | **3 / 3 MATCH** |
| **Total / Aggregate** | — | **0.49B – 3.21B** | **5,002 tok / 36.17s / $0.00** | — | **9 / 9 MATCH (100%)** |

> **Scoped Empirical Finding:**  
> *The frozen handshake generalized across three previously hidden model instances in the tested coding environment, with 9/9 tested profile dimensions agreeing with independently revealed historical behavior.*

### B. Discrimination Between Intelligences
The handshake demonstrated that it does not blindly assign identical settings to all models, nor does it produce arbitrary differences:
1. **Context Viewport (CORRECT SIMILARITY):** All four evaluated models (0.5B, 3B, 3B, 27B) required expanded viewports (400 lines). The handshake correctly identified that mechanical line paging imposes a universal turn penalty across all model tiers.
2. **Receipt Density (POSITIVE DISCRIMINATION):** The handshake cleanly separated models capable of 1-turn repair under rich tracebacks (Bonsai 27B and Llama 3.2 3B) from models whose residual repair capacity is insufficient to resolve multi-test failures in 1 turn (Qwen 3B and Qwen 0.5B).
3. **Navigation / Shell Scoping (POSITIVE DISCRIMINATION):** The handshake autonomously discriminated high-agency exploratory shell wandering (Bonsai 27B $\rightarrow$ `suppress_shell: true`) from low exploratory wander entropy (Strangers 1, 2, 3 $\rightarrow$ `suppress_shell: false`).

---

## 5. Reconciliation of Utility: Intelligence Expenditure vs. Waste

A critical theoretical insight of Phase 7 is that **binary task PASS rate is an incomplete metric of interface utility**.

When evaluating model performance under WTF, we distinguish:
1. **Task Capability:** Did the model synthesize the correct semantic patch to solve the problem?
2. **Useful Intelligence Expenditure:** Was model intelligence spent on grounded perception, active code inspection, formulating hypotheses, and attempting repairs at the real failure location?
3. **Unnecessary Intelligence Expenditure (Deterministic Waste):** Was intelligence squandered navigating directory trees via bash, recovering from mechanical patch formatting mismatches, or paginating 20-line windows?
4. **Residual Intelligence Boundary:** The point where failure occurs purely because the model's semantic reasoning capacity (algorithmic logic, grammar, typing) is exceeded, completely separated from environment friction.

### The 0.5B Exemplar
Under Generic WTF, the 0.5B model was completely ungrounded:
* In `task-01`: Hallucinated `unknown_action` with `client: starlette...`.
* In `task-08`: Emitted `Action=None` across all 8 turns.
* Expenditure: 26,188 tokens in 21.2s.

Under Handshake-Configured WTF:
* In `task-01`: Emitted `Action=fix` targeting line 114 from the failure traceback.
* In `task-08`: Emitted `Action=modify_code` targeting line 606 from `gjson_test.go` across all turns.
* Expenditure: 30,612 tokens in 35.7s.

Although token expenditure increased by +16.9% and the model still failed (0/3 PASS), this was **not a regression**:
* Under Generic WTF, intelligence was spent in an ungrounded hallucination spiral.
* Under Handshake WTF, 100% of intelligence was spent directly perceiving and attempting to modify the actual failure coordinate.
* The model failed because a 0.5B model lacks the semantic coding grammar to synthesize valid Python/Go patches—a clean, unclouded measurement of its **Residual Intelligence Boundary**.

> **Frozen Design Law:**  
> *WTF optimization is not the minimization of intelligence expenditure. It is the minimization of unnecessary intelligence expenditure while preserving or increasing useful intelligence expenditure.*

---

## 6. Frozen WTF Design Laws

| Law | Statement | Status | Scope |
| :--- | :--- | :---: | :--- |
| **Law 1: Deterministic Compilation** | *Do not spend intelligence on work that can be safely and deterministically compiled.* | **ESTABLISHED** | Coding-action domain (patching, formatting, mechanical deduplication). |
| **Law 2: Adaptive Exposure** | *Deterministic reality should be exposed in a form fitted to the intelligence consuming it.* | **ESTABLISHED** | Context viewport, receipt density, and shell scope across 0.5B–27B models. |
| **Law 3: Semantic Boundary** | *WTF may transform how reality is exposed or how an already-made decision is enacted, but must not make the semantic decision itself.* | **ESTABLISHED** | All WTF transformations; 0 semantic decisions made in all historical audits. |
| **Law 4: Fail Closed** | *Deterministic compilation must reject ambiguous transformations rather than guess.* | **ESTABLISHED** | Action Compilation (9+ clean rejections of ambiguous patches). |
| **Law 5: Useful Intelligence** | *Optimize unnecessary intelligence expenditure, not intelligence expenditure itself.* | **SUPPORTED** | Verified across Bonsai, Qwen 3B, Llama 3B, and Qwen 0.5B utility runs. |
| **Law 6: Failure as Measurement** | *Once deterministic and interface friction are reduced, remaining failures become more informative about the residual intelligence requirement.* | **ESTABLISHED** | Trajectory classification across all Phase 7 held-out evaluations. |

---

## 7. Reconciling Phase 6 into Phase 7: Redefining RIR

In Phase 6, we asked:
> *How much intelligence remains necessary after deterministic work is removed?*

In Phase 7, we discovered that "deterministic work" consists of two distinct layers:
1. **Invariant Substrate:** Work that is universally deterministic (mechanical patch enactment, verification execution).
2. **Interface Friction:** Representational mismatch between environment and model (viewport truncation, traceback density, shell scope).

This redefines the foundational concept:

> **Canonical Definition of Residual Intelligence Requirement (RIR):**  
> *The Residual Intelligence Requirement (RIR) of a software task is the semantic intellectual work remaining after both invariant deterministic substrate work and avoidable interface friction have been removed.*

RIR is **not a single scalar value**. It is multi-dimensional, spanning:
* Semantic bug diagnosis.
* Language-specific grammar and syntax formulation.
* Algorithmic reasoning and state invariance.
* Domain-specific logic synthesis.

---

## 8. Canonical Definitions & Architecture Diagram

### Canonical WTF Definition
> **WTF is a deterministic runtime around intelligence: it compiles away work that does not require intelligence, adapts how reality is exposed to the intelligence consuming it, and preserves semantic decisions for the intelligence itself.**

* **One-Sentence Technical Definition:**  
  *WTF is an invariant deterministic verification and enactment runtime coupled with an adaptive representation layer that eliminates non-semantic friction for language models operating on software repositories.*

* **One-Sentence Plain-English Definition:**  
  *WTF handles all the tedious mechanical setup, file searching, patch formatting, and test running so AI models can focus 100% of their thinking on writing the right code fix.*

### Canonical Architecture Diagram (Text)

```
[ SOFTWARE REPOSITORY & SYSTEM ENVIRONMENT ]
                      ▲
                      │  (Filesystem Mutations & Test Execution)
                      ▼
┌───────────────────────────────────────────────────────────────┐
│                      INVARIANT SUBSTRATE                      │
│   • Action Compilation v0  (Mechanical Whitespace/Patch AST)  │
│   • Verify-on-Write v1     (Instant Test Feedback)            │
│   • Receipt Verification   (Cryptographic Machine Proof)      │
└─────────────────────────────▲─────────────────────────────────┘
                              │
               (Raw File Bytes, Tracebacks, Diffs)
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                      ADAPTIVE INTERFACE                       │
│              (Configured by Capability Handshake)             │
│   • Context Viewport:       400 lines (Structural File Slice) │
│   • Receipt Density:        Rich Traceback vs Terse Exit Code │
│   • Navigation Scope:       Structural Coordinates / Scoping  │
└─────────────────────────────▲─────────────────────────────────┘
                              │
                (Fitted Task Reality & Diagnostics)
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                     RESIDUAL INTELLIGENCE                     │
│                (Evaluated Model / Coding Agent)               │
│   • Bug Diagnosis & Hypothesis                                │
│   • Semantic Algorithm Design                                 │
│   • Replacement Logic Synthesis                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 9. Deriving the Phase 8 Frontier (Do Not Test It)

From the frozen evidence of Phases 6 and 7, we can formulate the next research frontier:

> **Phase 8 Research Question:**  
> *Given an invariant substrate and a calibrated interface, can WTF dynamically estimate the Residual Intelligence Requirement of a task and route it to the smallest sufficient intelligence?*

### The Theoretical Routing Pipeline (Hypothesis Only)
```
TASK SPECIFICATION + CODEBASE
              ↓
    [ INVARIANT SUBSTRATE ] (Verify initial state, extract failure trace)
              ↓
    [ ESTIMATE TASK RIR ]   (Classify bug complexity: localized typo vs architectural refactor)
              ↓
    [ INTELLIGENCE ROUTER ] (Select smallest sufficient intelligence: Edge -> Small -> Dense)
              ↓
    [ CALIBRATED INTERFACE ] (Project reality fitted to selected model)
              ↓
    [ EXECUTE & OBSERVE ]   (Run model with Verify-on-Write)
              ↓
    [ ESCALATION GATE ]     (If model terminates at semantic reasoning boundary, escalate to higher tier)
```

*This pipeline remains a hypothesis for Phase 8. No router code has been implemented.*

---

```
PHASE 7: FROZEN

PHASE 7 EXPERIMENTS:
Phase 7.1 (Bonsai Profile), Phase 7.2 (Waste Reduction), Phase 7.3 (Micro-Probe Falsification), Phase 7.3A (Friction Sensitivity), Phase 7.3B (Action Friction Closure), Phase 7.3C (AC Substrate Audit), Phase 7.4 (Qwen 3B Blind Handshake), Phase 7.5 (Llama 3.2 3B Replication), Phase 7.6 (Qwen 0.5B Discrimination).

BLIND STRANGERS:
3

BLIND PROFILE DIMENSIONS:
9

HISTORICAL AGREEMENT:
9/9 (100.0%)

INVARIANT SUBSTRATE:
Action Compilation v0 [ESTABLISHED], Verify-on-Write v1 [ESTABLISHED], Receipt Verification Contract v0.1 [ESTABLISHED]

ADAPTIVE INTERFACE:
Context Viewport Lines (150 vs 400), Receipt Density (terse vs rich), Navigation Scope (structural coordinates vs unconstrained shell suppression)

RESIDUAL INTELLIGENCE:
Semantic work remaining after deterministic work and interface friction have been removed (diagnosis, hypothesis formation, desired behavior specification, algorithmic synthesis).

CAPABILITY HANDSHAKE:
FROZEN

GENERALIZATION EVIDENCE:
The frozen handshake generalized across three previously hidden model instances in the tested coding environment, with 9/9 tested profile dimensions agreeing with independently revealed historical behavior.

DISCRIMINATION EVIDENCE:
The frozen handshake autonomously discriminated high-agency shell wandering (Bonsai suppress_shell: true) from low-agency file inspection (Strangers 1-3 suppress_shell: false), and rich-traceback recovery capacity (Bonsai & Llama 3B) from insufficient 1-turn repair capacity (Qwen 3B & Qwen 0.5B), while correctly identifying universal paging penalties across all models.

WTF DESIGN LAWS:
Law 1 (Deterministic Compilation) [ESTABLISHED], Law 2 (Adaptive Exposure) [ESTABLISHED], Law 3 (Semantic Boundary) [ESTABLISHED], Law 4 (Fail Closed) [ESTABLISHED], Law 5 (Useful Intelligence) [SUPPORTED], Law 6 (Failure as Measurement) [ESTABLISHED].

CANONICAL WTF DEFINITION:
WTF is a deterministic runtime around intelligence: it compiles away work that does not require intelligence, adapts how reality is exposed to the intelligence consuming it, and preserves semantic decisions for the intelligence itself.

RIR DEFINITION:
The Residual Intelligence Requirement (RIR) of a software task is the semantic intellectual work remaining after both invariant deterministic substrate work and avoidable interface friction have been removed.

PHASE 8 FRONTIER:
Given an invariant substrate and a calibrated interface, can WTF dynamically estimate the Residual Intelligence Requirement of a task and route it to the smallest sufficient intelligence?

READY FOR PHASE 8:
YES
```
