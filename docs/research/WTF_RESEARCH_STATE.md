# WTF Research State: Foundations, Epistemic Boundaries, and Experimental Evidence

**Document Status**: LIVING RESEARCH FOUNDATION (FROZEN FOR V0 PROTOCOL)  
**Last Updated**: September 21, 2026  
**Target Audience**: Agents and human engineers developing or modifying WTF.

---

## 1. What is WTF?

### The Working Thesis
> **WTF is a deterministic evidence and perception layer for software work.**

### The Two Framings
WTF operates across two distinct perspectives:

1. **The Human-Facing Perspective**:
   > *"Your coding agent says it's done. WTF checks."*
   - **Human Question**: **"What just happened?"**
   - Human intent: Review verified execution outcomes, inspect meaningful changes, notice unrun suites or safety regressions, and make the final merge/acceptance decision without reading bloated mechanical diffs or terminal transcripts.

2. **The Agent-Facing Perspective**:
   > *"WTF makes software reality easier for agents to perceive without spending probabilistic intelligence reconstructing deterministic facts."*
   - **Agent Question**: **"What changed in observable software reality after my action?"**
   - Agent intent: Obtain immediate, deterministic feedback about state transitions (files changed, compiler diagnostics, verification command outcomes) to guide the next tool invocation without getting trapped in exploratory thrashing loops.

> [!CAUTION]
> **What has NOT been established**:
> We have **not** established persistent, stateful agent perception across sessions. The experiments performed to date evaluate stateless tool-level deltas and single-turn verification contracts. WTF must not be designed as an autonomous cognitive memory store until empirical evidence justifies it.

---

## 2. The Constitutional Boundary

> **WTF observes. The agent reasons and acts. Humans decide.**

This boundary is derived directly from experimental failures where models and tools attempted each other's responsibilities.

### WTF MAY:
- Observe repository and environment state via deterministic tools (Git, filesystem, package managers).
- Execute explicitly requested or unambiguously configured verification commands.
- Collect deterministic evidence across structured primitives.
- Compare pre-action and post-action state to compute reality deltas.
- Compress deterministic evidence into high-density tokens.
- Establish mechanical relationships (e.g. diagnostic spans intersecting changed hunks).
- Expose explicit uncertainty (`UNKNOWN`) when evidence is incomplete, missing, or contradictory.

### WTF MUST NOT:
- Infer user or task intent as established fact.
- Choose coding strategies, algorithms, or architectures.
- Recommend fixes or repairs as "evidence" (suggestions are speculative).
- Autonomously alter application source code to "fix" issues.
- Assert speculative root causes (e.g. "Error X was caused by change Y" unless compiler causality is formally proven).
- Convert uncertainty into confidence or omit unrun checks.
- Declare task completion or requirement correctness from passing checks (passing checks prove only that the executed tests passed).
- Attempt to compensate for an agent's failure to reason, plan, or act.

---

## 3. The Five Primitives (WTF Evidence Protocol v0)

The protocol represents software reality using **exactly five primitives**. No additional primitives are permitted without rigorous falsification against empirical trajectories.

| Primitive | What It Represents | Deterministic Provenance Requirements | Epistemic Boundary |
| :--- | :--- | :--- | :--- |
| **`CHANGE`** | Discrete modifications to repository files or environment between two points in time. | Git status, git diff, filesystem hashes. | Must not claim the change is correct, desirable, or complete. |
| **`DIAGNOSTIC`** | Structured findings emitted by tools (compilers, linters, test runners, security scanners). | Tool exit streams (stdout/stderr) parsed deterministically. | Must not claim the diagnostic is the root cause or that tool suggestions are valid fixes. |
| **`RELATION`** | Mechanical, spatial, or structural intersections between two or more entities. | Exact coordinate overlap (line spans, AST scopes, dependency imports). | Must not claim semantic causality (e.g. "change caused failure") unless compiler guarantees it. |
| **`VERIFICATION`** | The execution outcome of an explicit check or test suite. | Process exit code, stdout/stderr streams, elapsed time. | Passing checks prove *only* that the check ran and exited 0. It never proves task correctness. |
| **`UNKNOWN`** | Explicit recognition of what cannot be deterministically proven. | Systemic boundary: unrun tests, absent specifications, user intent. | Must be explicitly exposed, never silently elided. |

### The Invariant of Epistemic Statuses
WTF distinguishes the epistemic strength of claims:
- **`REPORTED`**: Data returned directly by a tool or subprocess. (A tool reporting a warning does not make the warning semantically valid).
- **`OBSERVED`**: A factual state transition directly measured by WTF (e.g. git diff, file hashes).
- **`VERIFIED`**: An explicit verification command executed to completion with deterministic outcome recorded.
- **`UNKNOWN`**: Areas outside deterministic observation or unexecuted checks.

---

## 4. Separation of Knowledge by Epistemic Strength

### 4.1 Established by Observation
*(Only empirical findings directly measured in controlled experiments and dogfooding)*

1. **Task Correctness Lift on Task 5 (Rust `bstr`)**:
   - In smolcoder with Qwen3-Coder-30B-A3B: Evidence Compilation improved ground-truth correctness from **3/5 (60%)** under raw terminal feedback to **4/5 (80%)** ([Report 03](file:///Users/linus/Projects/WTF/docs/research/experiments/03_smolcoder_evidence_compilation.md)).
   - In the original harness with Qwen2.5-Coder-14B: WTF evidence improved correctness from **2/5 (40%)** to **4/5 (80%)**.
2. **Token and Cost Reductions**:
   - Evidence Compilation in smolcoder reduced total tokens by **38.4%** (29,204 → 17,998) and cost by **35.5%** on Task 5 ([Report 03](file:///Users/linus/Projects/WTF/docs/research/experiments/03_smolcoder_evidence_compilation.md)).
   - In weaker models (Qwen3-8B), evidence compilation reduced total tokens by **29.7%** (19,743 → 13,878) while maintaining 4/5 correctness ([Report 04](file:///Users/linus/Projects/WTF/docs/research/experiments/04_weaker_model_boundary.md)).
3. **Context Ablation Survival**:
   - Stripping directory listings, terminal echo, and arbitrary shell commands down to minimal Action → Reality Delta (Condition D) maintained **90% task success (9/10)** while reducing total tokens by **32.3%** overall and **52.7% on Python Task 3** ([Report 09](file:///Users/linus/Projects/WTF/docs/research/experiments/09_context_ablation.md)).
4. **Capability Frontier Shift**:
   - Under Raw Normal conditions (Condition A), Qwen3-8B collapsed on Python Task 3 to **1/5 (20%)**, failing the pre-registered viability criterion ($\ge 80\%$) with an overall success of **6/10 (60%)** due to exploratory thrashing.
   - Under Minimal Perception (Condition D), Qwen3-8B preserved viability at **8/10 (80%)** (100% Rust, 60% Python), matching the 30B MoE model's viability envelope while consuming **30.7% fewer tokens** and costing **40.6% less** ([Report 10](file:///Users/linus/Projects/WTF/docs/research/experiments/10_capability_frontier.md)).
5. **Inferred Verification Fragility (Omnicap)**:
   - Detecting a generic `tests/` directory and inferring `pytest .` caused an unintended traversal into ML subpackages, triggering external Hugging Face downloads and hanging until the 120s timeout killed the process ([Observation 01](file:///Users/linus/Projects/WTF/docs/research/observations/01_omnicap_heterogeneous_repo.md)).

### 4.2 Supported Hypotheses
*(Interpretations supported by multiple independent runs but not yet established as general laws)*

1. **Perception as a Deterministic Burden**: A substantial portion of context tokens consumed by coding agents is spent reconstructing deterministic facts (directory structure, compiler error locations, git status) that can be computed mechanically in microseconds.
2. **Constrained Perception Prevents Weak Model Derailment**: Weaker models (e.g. 8B) fail in complex tasks primarily because wide-open exploratory tools (recursive ls, arbitrary shell execution) trigger recursive thrashing loops. Constraining observation to deterministic deltas keeps the model anchored to the edit surface.
3. **Language/Ecosystem Asymmetry**: Compiler-driven ecosystems (Rust) benefit primarily from structured diagnostic extraction; dynamic interpreted ecosystems (Python) benefit primarily from structural scope isolation and unrun test exposure.

### 4.3 Open Questions & Falsifiers
*(Unproven assumptions and criteria that would invalidate current hypotheses)*

1. **Generalizability Across Tasks**: All current ablation and frontier findings rest on Task 5 (Rust) and Task 3 (Python). If tested across 50 diverse SWE-bench tasks, does Condition D suffer an information starvation cliff where models cannot discover necessary architectural context?
2. **Large Repository Scaling**: When a diff exceeds 200 files (+30k lines as in Omnicap), does WTF's deterministic filtering obscure vital review context or devolve into low-signal warning fatigue? ([Observation 02](file:///Users/linus/Projects/WTF/docs/research/observations/02_large_diff_pressure.md)).
3. **Falsification Criterion for Deterministic Perception**: If a benchmark demonstrates that providing raw terminal output with larger context windows consistently outperforms structured delta representations in both cost and accuracy on non-trivial refactorings, the core thesis of WTF as a necessary perception layer is falsified.

---

## 5. Chronological Research Map

```
Git/Change Receipt (v0.1 CLI)
      ↓
`wtf check` Single-Turn Agent Contract
      ↓
Evidence Compilation (Structured Diagnostics)
      ↓
Independent Harness Validation (smolcoder v0.7.1)
      ↓
Capability-Boundary Exploration (8B & 4B Models)
      ↓
Forensic Trajectory Analysis (14 Failure/Thrash Events)
      ↓
Five-Primitive Ontology Falsification
      ↓
Action → Reality Delta Protocol
      ↓
Information Parity Audit (Raw-Derived vs. Sensing)
      ↓
Context Ablation Experiment (Conditions A → D)
      ↓
Capability Frontier Experiment (30B → 14B → 8B)
```

| Phase | Core Question | Experimental Setup | Key Observed Result | What It Established | What It Did NOT Establish | Report Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. WTF Signal** | Does raw WTF receipt output improve 3B/4B local agents? | 5-task benchmark, Qwen2.5-3B, local Ollama. | Control: 0/5, 26k tokens; WTF: 0/5, 48k tokens (+80%). | WTF protocol compliance added overhead to models below the agency floor. | Did not prove WTF is ineffective for capable models. | [01_wtf_signal_experiment.md](file:///Users/linus/Projects/WTF/docs/research/experiments/01_wtf_signal_experiment.md) |
| **2. Qwen3-4B Sub** | Does a small thinking model cross the agency floor? | Same 5 tasks, Qwen3-4B-Thinking, Ollama. | 0/5 correct; token consumption dropped 13.7%; 0 JSON errors. | Syntactic agency floor was crossed, but repair floor was not reached. | No correctness signal observed. | [02_qwen3_4b_substitution.md](file:///Users/linus/Projects/WTF/docs/research/experiments/02_qwen3_4b_substitution.md) |
| **3. Evidence Compilation** | Does structured error extraction help a capable model? | Task 5 (Rust `bstr`), Qwen3-Coder-30B-A3B in smolcoder. | Correctness lifted 3/5 (60%) → 4/5 (80%); tokens -38.4%; wall time -46.3%. | Deterministic compiler diagnostic extraction directly improves agent efficiency. | Did not establish benefit outside compiler errors. | [03_smolcoder_evidence_compilation.md](file:///Users/linus/Projects/WTF/docs/research/experiments/03_smolcoder_evidence_compilation.md) |
| **4. Weaker Model Boundary** | Does Evidence Compilation help an 8B model on Task 5? | Task 5 (Rust `bstr`), Qwen3-8B in smolcoder. | Correctness unchanged (4/5 in both); tokens reduced -29.7%. | Primary benefit for 8B on this task was token reduction, not correctness. | Did not establish a correctness capability jump on Task 5. | [04_weaker_model_boundary.md](file:///Users/linus/Projects/WTF/docs/research/experiments/04_weaker_model_boundary.md) |
| **5. Forensic Analysis** | Where exactly does probabilistic work fail in software tasks? | Detailed audit of 14 failure/thrash events across 30 preserved trajectories. | 14 distinct failure modes identified (target hallucination, false positive checks, etc.). | Failures are preceded by existing deterministic facts poorly represented to the model. | Did not test an automated intervention. | [05_forensic_trajectory_analysis.md](file:///Users/linus/Projects/WTF/docs/research/experiments/05_forensic_trajectory_analysis.md) |
| **6. Ontology Falsification** | Can 5 primitives cleanly represent all 14 failure events without INVOCATION? | Systematic mapping of 14 events onto candidate primitives. | All 14 cases represented without adding an INVOCATION or FILE primitive. | Five primitives (CHANGE, DIAGNOSTIC, RELATION, VERIFICATION, UNKNOWN) are sufficient. | Did not test dynamic runtime behavior. | [06_ontology_falsification.md](file:///Users/linus/Projects/WTF/docs/research/experiments/06_ontology_falsification.md) |
| **7. Reality Delta** | Can an Action → Reality Delta replace raw tool returns? | 5-task benchmark with Qwen3-Coder-30B-A3B using Delta feedback. | Delta achieved 4/5 (80%) vs Control 3/5 (60%); 14% token drop on Task 5. | Structured Delta feedback can sustain agent execution. | Task 3 showed sensitivity to missing bash details. | [07_action_reality_delta.md](file:///Users/linus/Projects/WTF/docs/research/experiments/07_action_reality_delta.md) |
| **8. Parity Audit** | Were Delta facts derived from raw output or extra sensing? | Line-by-line audit of every Delta field across trials. | Facts were either RAW-DERIVED or derived from Git/Cargo deterministic inspection. | Proved Delta was deterministic perception, not ungrounded compression or LLM inference. | Did not prove that extra sensing is always available. | [08_information_parity_audit.md](file:///Users/linus/Projects/WTF/docs/research/experiments/08_information_parity_audit.md) |
| **9. Context Ablation** | Can an agent perform when stripped of directory discovery & raw bash? | Conditions A, B, C, D across Rust Task 5 and Python Task 3. | Condition D matched Condition A at 90% success (9/10), reducing tokens 32.3% (52.7% on Python). | Full ambient context is not required if deterministic reality deltas are provided. | Tested only 2 tasks; long-horizon discovery unproven. | [09_context_ablation.md](file:///Users/linus/Projects/WTF/docs/research/experiments/09_context_ablation.md) |
| **10. Capability Frontier** | Does deterministic perception shift the model capability boundary? | Model ladder (30B, 14B, 8B) across Conditions A & D (56 total trials). | 8B collapsed under A (60%, 20% on Python) but was VIABLE under D (80% overall), cutting cost 40.6%. | Deterministic perception shifted the viable frontier from 30B MoE down to 8B Dense on tested tasks. | 14B showed unexpected non-viability on Python in both conditions. | [10_capability_frontier.md](file:///Users/linus/Projects/WTF/docs/research/experiments/10_capability_frontier.md) |

---

## 6. Record of Negative, Null, and Asymmetric Results

A research-driven architecture preserves its failures and boundaries:

1. **Protocol Overhead on Small Models (Negative Result)**:
   - In the initial Qwen2.5-3B experiment, prompting the agent to use `wtf check` resulted in an 80.9% increase in tokens and zero ground-truth task completions. Small models entered repetitive loops trying to satisfy receipt syntax rather than fixing code.
2. **Correctness Invariance on Task 5 with 8B (Null Result)**:
   - In the weaker model boundary test, Qwen3-8B achieved 4/5 (80%) correctness under both RAW feedback and Evidence Compilation. The compilation layer did not lift task correctness on this specific task; its effect was purely operational (token and step reduction).
3. **Mid-Tier Model Non-Viability on Python (Anomalous Null Result)**:
   - In the Capability Frontier experiment, `qwen3-14b` achieved only 40% (2/5) on Python Task 3 under both Normal and WTF-D conditions (failing the $\ge 60\%$ task floor), despite achieving 100% on Rust. Intermediate parameter scale did not translate to linear reasoning capability in dynamic runtime environments.
4. **Action → Reality Delta Information Starvation (Negative Sensitivity)**:
   - During pilot trials of Action → Reality Delta on dynamic shell commands, omitting raw stdout/stderr sometimes starved the agent of unexpected environment warnings (e.g. missing python dependencies or interpreter paths), demonstrating that DELTA must preserve execution status and exit details under `VERIFICATION`.
5. **Ecosystem Divergence (Asymmetry)**:
   - In Context Ablation, Rust Task 5 token reductions were modest (-19.4%), while Python Task 3 token reductions were dramatic (-52.7%). In Rust, compiler errors are inherently structured and localized; in Python, unguided terminal exploration easily expands into thousands of wasted exploratory tokens.

---

## 7. Architecture Status: Canonical Evidence Migration (Step 4)

**CANONICAL EVIDENCE MIGRATION: COMPLETE / FROZEN**

As of Step 4.4.1, the WTF core architecture is permanently frozen around Protocol v0 as the new baseline:

### Frozen Baseline Principles
* **WTF is a deterministic evidence compiler and perception layer for software work.**
* **Protocol v0 is the authoritative internal evidence representation.**
* **Canonical primitives**: `CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`.
* **WTF observes. The agent reasons and acts. Humans decide.**
* **Evidence and policy remain strictly separate.**
* **Verification claims only what execution evidence establishes.**
* **Task-intent correctness remains UNKNOWN unless independently established.**
* **Human, agent, show, and JSON surfaces are direct views of the same canonical evidence.**
* **Legacy `wtf/0.1`, `payAttention`, and `ATTENTION(n)` exist only at compatibility boundaries.**
* **`MECHANICALLY_DERIVED` describes deterministic provenance, not confidence.**
* **Weak evidence must not authorize ambiguous or expensive execution.**
* **Do not use probabilistic intelligence where deterministic evidence is sufficient.**

---

### Completed Migration Record

* **Step 4.1 — Canonical Evidence Core**:
  Established TypeScript definitions for Protocol v0 (`CanonicalEvidenceDocumentV0`) and the five canonical primitives (`src/core/protocol-v0.ts`).
* **Step 4.2 — Truthful Verification Engine**:
  Migrated verification onto explicit lifecycle stages (`COMMAND_UNKNOWN`, `INVOCATION_FAILED`, `TIMEOUT`, `BUILD_FAILED`, `TESTS_FAILED`, `TESTS_PASSED`), deterministic authorization sources (`explicit_contract`, `project_declaration`, `ecosystem_default`), eliminated weak-evidence authorization (Omnicap failure class), and established explicit execution counts (`src/verify/runner.ts`).
* **Step 4.3 — Evidence ≠ Policy Separation**:
  Refactored detectors from opinionated severity linters into neutral mechanical relation extractors (`src/detectors/`). Stripped `CRITICAL` exit-code gating and decoupled observation from consumer policy.
* **Step 4.4 — Canonical Evidence Becomes the Product**:
  Re-anchored all primary consumers (human terminal output, agent markdown output, JSON output, drill-down show output) to derive directly from `CanonicalEvidenceDocumentV0` as the single internal source of truth (`src/formatters/`).
* **Step 4.4.1 — Final Semantic Cleanup & Freeze**:
  Deprecated legacy `ATTENTION` semantics in compatibility adapters, tightened ecosystem-default discovery wording, reaffirmed provenance semantics, preserved open relation predicate standardizations as intentional `UNKNOWN`, and froze the architectural baseline.

---

### Recorded Compatibility Debt (Do Not Fix Now)

The following components exist strictly for backwards compatibility with legacy tooling, test suites, and external harness integrations:
* `WTF-RECEIPT: v0.1` machine receipt anchor line
* `ATTENTION(n)` anchor field (derived from mechanically observed relations; does not represent canonical severity, risk, failure, correctness, or WTF policy)
* `WTFReceipt` type definition (`src/types.ts`)
* `toLegacyReceipt()` adapter (`src/core/evidence.ts`)
* `toLegacyVerificationItem()` adapter (`src/verify/runner.ts`)

Future canonical receipt direction:
```markdown
WTF-RECEIPT: protocol-v0 | VERIFIED (3) | RELATIONS (4) | OBSERVED (+7807/-287, 43f) | UNKNOWN (1)
```
*(This migration is intentionally deferred to avoid breaking existing `v0.1` consumers).*

---

### Next Research Frontier: Evidence Density & Large-Diff Compression

**The Problem**:
How should WTF compress a large software-reality delta while preserving the evidence needed to decide where to look next?

**Empirical Pressure Cases Observed**:
* WTF repository itself: ~43 changed files / +7,807 / -287 lines
* Omnicap repository: ~225 changed files / +38,355 / -442 lines

The old strategy of displaying $N$ files and hiding the rest (`... and 34 more files`) is insufficient for complex agent decision-making.

**Working Concept: Evidence Density**:
Maximize useful evidence per token without silently destroying epistemically important information.

**Potential Direction (Hypothesis Only)**:
Explore an evidence visibility hierarchy:
* `VISIBLE` (directly rendered in high-density context)
* `AGGREGATED` (deterministically summarized with explicit counts/boundaries)
* `RETRIEVABLE` (accessible on-demand via targeted query/drill-down)
rather than binary `VISIBLE` vs `DISCARDED`.

*Status*: Do not assume folder grouping, subsystem grouping, clustering, ranking, severity, or LLM summarization is the solution. **Large-diff representation algorithm remains UNKNOWN.**

---

### Optional Future Judgment Layer (Research Direction Only)

Protocol v0 may support a separate optional local decision/judgment layer (e.g. Jev-class local model):

```
software reality
      ↓
     WTF deterministic evidence compiler
      ↓
 Protocol v0 canonical evidence
      ↓
 optional local judgment layer (e.g. Jev)
      ↓
 agent / human
```

**Constitutional Invariant**:
Probabilistic judgment must **never** contaminate canonical WTF evidence. WTF must remain independently useful, deterministic, and truthful without this layer. *(Do not implement this layer now).*

---

### Long-Term Product Hypothesis

**Core Research Question**:
> How much probabilistic intelligence can deterministic perception replace?

**Stronger Product Hypothesis**:
> WTF doesn’t make the model smarter. It makes software reality easier for the model to see.

**Potential Future Stack**:
```
software reality
      ↓
WTF deterministic perception
      ↓
high-density evidence
      ↓
optional local judgment
      ↓
minified / local / frontier model
      ↓
reason + act
```

