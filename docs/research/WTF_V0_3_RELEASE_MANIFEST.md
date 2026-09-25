# WTF v0.3.0 Release Manifest: Trajectory State & Handoff Runtime

**Release Version:** `v0.3.0`  
**Date:** September 25, 2026  
**Status:** FROZEN & SEALED  
**Baseline:** Tag `v0.2.0` (`ed1dbea`)  
**Package:** `agent-wtf@0.3.0`  

---

## 1. Executive Summary & Constitution

WTF v0.3 promotes the **Trajectory State & Handoff Runtime** from empirical research into the production runtime above the frozen v0.2 Invariant Execution Substrate.

The runtime preserves factual trajectory state across turns, signals observable stagnation, and compiles established computational reality into a bounded continuation packet when an agent stalls. It introduces zero model routing, zero dynamic model switching, zero autonomous policy decisions, zero semantic inference, and zero chain-of-thought transfer.

```
===============================================================================
                     WTF v0.3 CONSTITUTIONAL MANDATE
===============================================================================

                         OBSERVE TRAJECTORY.
                          PRESERVE REALITY.
                          SIGNAL STAGNATION.
                           DECIDE NOTHING.

===============================================================================
```

```
+-------------------------------------------------------------------------+
|                         WTF v0.3 RUNTIME TOPOLOGY                       |
+-------------------------------------------------------------------------+
|                                                                         |
|   EXTERNAL AGENT TURNS (Actions, Observations, Verification)             |
|                                │                                        |
|                                ▼                                        |
|   ┌─────────────────────────────────────────────────────────────┐       |
|   │                      TrajectoryLedger                       │       |
|   │  - Append-only turn record with 3-tier provenance           │       |
|   │  - Physical actions & verification outcomes                 │       |
|   └────────────────────────────┬────────────────────────────────┘       |
|                                │                                        |
|                                ▼                                        |
|   ┌─────────────────────────────────────────────────────────────┐       |
|   │                 TrajectoryStagnationDetector                │       |
|   │  - 7 frozen observable rules & 4 deterministic comparators  │       |
|   │  - Emits: PASS | CONTINUE | FRICTION | STAGNATION           │       |
|   │  - POLICY DECISIONS = 0 (Decide Nothing)                    │       |
|   └────────────────────────────┬────────────────────────────────┘       |
|                                │ (on STAGNATION signal)                 |
|                                ▼                                        |
|   ┌─────────────────────────────────────────────────────────────┐       |
|   │                       HandoffCompiler                       │       |
|   │  - Compiles established state from v0.2 Substrate           │       |
|   │  - TraceSlice coords + BoundedViewports + Git state         │       |
|   │  - Zero CoT / Zero Reasoning / Zero Speculative Solutions   │       |
|   └─────────────────────────────────────────────────────────────┘       |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 2. Frozen Production Modules

| Module | Location | Purpose | Core Invariants |
| :--- | :--- | :--- | :--- |
| **Trajectory Ledger** | [`src/core/trajectory-ledger.ts`](file:///Users/linus/Projects/WTF/src/core/trajectory-ledger.ts) | Append-only immutable turn ledger recording physical actions and verification outcomes. | • Strict 3-tier epistemic provenance map (`DETERMINISTIC_REALITY`, `DERIVED_DETERMINISTIC_STATE`, `INTELLIGENCE_SUPPLIED_CLAIM`).<br>• Never promotes intelligence claim to fact without physical verification.<br>• Tracks cumulative navigation turns, action rejections, post-mutation idle turns, and verification error deltas. |
| **Stagnation Detector** | [`src/core/stagnation-detector.ts`](file:///Users/linus/Projects/WTF/src/core/stagnation-detector.ts) | Ports frozen Phase 8.3B observable stagnation rules and Phase 10.1A deterministic comparators. | • Emits strictly informational signals (`TRAJECTORY_PASS`, `TRAJECTORY_CONTINUE`, `TRAJECTORY_INTERFACE_FRICTION`, `TRAJECTORY_ACTION_FRICTION`, `TRAJECTORY_STAGNATION`).<br>• Policy decisions = 0 (zero abort, retry, or routing inside WTF).<br>• Zero cognitive speculation or capability labeling. |
| **Handoff Compiler** | [`src/core/handoff-compiler.ts`](file:///Users/linus/Projects/WTF/src/core/handoff-compiler.ts) | Compiles established computational state into a bounded continuation packet (`HandoffPacket`). | • 100% grounded in v0.2 TraceSlice coordinates and BoundedViewports.<br>• Zero Chain-of-Thought (CoT) transfer (100% predecessor reasoning discarded).<br>• Substrate-agnostic markdown packet. |

---

## 3. Preserved Known Limitation: Gate 2 Partial by Design

> [!IMPORTANT]
> **Preserved Known Limitation (Gate 2):**  
> Production handoff uses verified physical failure coordinates. It does not perform prompt-keyword/symbol inference to guess a more semantically useful source location.  
> **Phase 10.3 Gate 2 therefore remains PARTIAL by design.**

In the experimental Phase 8.4A prototype (`scratch/phase8_4_handoff/compiler.py`), an ungrounded regex heuristic (`DECL_PATTERNS`) was used to scan source code for symbol declarations matching prompt keywords (e.g., `isNumericString` or `skip_current_dir`) when diagnostic coordinates pointed to test harnesses.

During the Phase 10.1A Trajectory Signal Purity Audit, this prompt-keyword scanning was audited and **permanently rejected** from the production runtime because:
1. It relied on semantic prompt inspection rather than deterministically established runtime facts.
2. It violated the constitutional rule: *Observe trajectory. Preserve reality. Decide nothing.*

Consequently, production `HandoffCompiler` strictly uses verified physical coordinates from `TraceSlice` (originating from execution diagnostics). This limitation is intentional, permanent for v0.3, and documented without alteration.

---

## 4. Causal Reproduction Gates (Phase 10.3 Summary)

| Gate | Target Criterion | Empirical Evidence | Verdict |
| :--- | :--- | :--- | :---: |
| **Gate 1: Stagnation Detector Replay** | Replay Phase 8.3B cohort (8 trajectories, 34 turns). Expected: 7 detected, 1 missed, 0 false alarms. | • 30 / 34 (88.2%) exact turn-level signal agreement.<br>• 7 / 8 detected boundaries (87.5% recall).<br>• 1 missed boundary (`trial_04`, identical to 8.3B).<br>• 0 false alarms (100.0% precision, 100.0% specificity). | **REPRODUCED** |
| **Gate 2: Phase 8.4A Handoff Replay** | Reconstruct CH-01 and CH-03 compiled handoff cases. | • Trace coordinates, verification state, and zero-CoT guarantees reproduced.<br>• Viewport centering diverges from experimental prototype due to the removal of `DECL_PATTERNS` prompt-keyword guessing. | **PARTIAL**<br>*(by design)* |
| **Gate 3: Phase 8.4B Replication Replay** | Reconstruct 5 switched cases (Rust, Node/TS, Python). | • 5 / 5 (100.0%) deterministic packet reproduction.<br>• 0 CoT / reasoning leakage across handoff boundary.<br>• Exact bounded viewport formatting. | **REPRODUCED** |
| **Gate 4: Phase 8.5 Cross-Substrate Invariance** | Reconstruct CH-01 local-to-remote handoff invariance. | • Continuation packet is 100% substrate-agnostic.<br>• Zero model identity, architecture, or routing metadata.<br>• Zero candidate solutions. | **REPRODUCED** |

---

## 5. Negative Boundary Audit (What Did NOT Ship)

In strict accordance with the Constitutional Protocol, the following mechanisms are excluded from v0.3 production runtime:

- **No Model Routing or Selection:** WTF does not choose or recommend successor models. Model routing is an external orchestrator policy.
- **No Autonomous Switching:** The stagnation detector emits `TRAJECTORY_STAGNATION`. It does not trigger an abort or switch on its own.
- **No Scheduler:** WTF does not execute multi-agent workflows or manage agent lifecycles.
- **No Prompt-Keyword Scanning:** WTF does not parse prompt text to infer source symbols (`DECL_PATTERNS` banned).
- **No Chain-of-Thought Transfer:** WTF never stores or passes predecessor reasoning traces, scratchpads, or cognitive justifications.
- **No Capability Profiles:** WTF does not maintain model scores, capability boundaries, or eye-chart rankings in production.

---

## 6. Release Verification Results

- **Vitest Suite**: 18 test files, 160 / 160 tests passing (100%).
- **Acceptance Gauntlet**: 10 / 10 scenarios, 100 / 100 points.
- **TypeScript Typecheck**: 0 errors (`tsc --noEmit`).
- **Production Build**: Clean compilation (`dist/cli.js` 121.3kb, `dist/evidence-compiler.js` 11.5kb).
- **WTF Receipt**: Clean verified receipt (`VERIFIED (3/3) | ATTENTION (0)`).
- **Runtime Dependencies**: Exactly 0.
