# WTF v0.4.0 Release Manifest: Reality Inheritance

**Release Version:** `v0.4.0`  
**Release Name:** Reality Inheritance  
**Date:** September 25, 2026  
**Status:** FROZEN & SEALED  
**Baseline:** Tag `v0.3.0` (`7fc70b2`)  
**Package:** `agent-wtf@0.4.0`  
**Production Addition:** [`src/core/reality-projection.ts`](file:///Users/linus/Projects/WTF/src/core/reality-projection.ts)  

---

## 1. Executive Summary & Constitution

WTF v0.4 promotes **Reality Inheritance** from empirical research into the production runtime above the frozen v0.3 Trajectory State & Handoff Runtime.

The runtime eliminates repeated retransmission of verified, unchanged reality blocks across conversational intelligence turns. It replaces redundant raw file reads and code viewports with minimal deterministic reference markers, preserving full task capability while cutting prompt token consumption by -61.2% and neutralizing the failure tax.

```
===============================================================================
                     WTF v0.4 CONSTITUTIONAL MANDATE
===============================================================================

                            KEEP EVERYTHING.
                  RETRANSMIT ONLY WHAT REALITY REQUIRES.

===============================================================================
```

### The Causal Principle

> **INTELLIGENCE SHOULD INHERIT VERIFIED UNCHANGED REALITY, NOT REPEATEDLY REREAD IT.**

---

## 2. Runtime Topology

```
+-------------------------------------------------------------------------+
|                         WTF v0.4 RUNTIME TOPOLOGY                       |
+-------------------------------------------------------------------------+
|                                                                         |
|   ┌─────────────────────────────────────────────────────────────┐       |
|   │                      WTF SYSTEM MEMORY                      │       |
|   │  - Append-only, complete, immutable factual ledger          │       |
|   │  - TrajectoryLedger + ActionCompiler + TraceSlice + Viewport│       |
|   │  - Cryptographic Block Descriptors (SHA-256)                │       |
|   │  - 100% of trajectory truth retained without pruning       │       |
|   └────────────────────────────┬────────────────────────────────┘       |
|                                │                                        |
|                                │ Pure Read-Only Projection              |
|                                ▼                                        |
|   ┌─────────────────────────────────────────────────────────────┐       |
|   │            DETERMINISTIC REALITY PROJECTION ENGINE          │       |
|   │                 (src/core/reality-projection.ts)            │       |
|   │  - Evaluates The 7 Deterministic Invariants                 │       |
|   │  - Cryptographic disk verification (SHA-256)                │       |
|   │  - Invalidation listener (file mutation, git reset, stat)   │       |
|   │  - Re-exposure dispatcher (explicit reads, error shifts)    │       |
|   │  - FAIL CLOSED: Any uncertainty -> Transmit in full         │       |
|   └────────────────────────────┬────────────────────────────────┘       |
|                                │                                        |
|                                ▼                                        |
|   ┌─────────────────────────────────────────────────────────────┐       |
|   │                 INTELLIGENCE-FACING REALITY                 │       |
|   │  - Bounded boundary payload for current turn                │       |
|   │  - Fixed task instructions (Full)                           │       |
|   │  - Active error coordinate viewport (Full)                  │       |
|   │  - Turn T-1 action result (Full)                            │       |
|   │  - Conversational history (Full)                            │       |
|   │  - Verified unchanged reality -> Minimal Reference Marker:  │       |
|   │    [ESTABLISHED REALITY UNCHANGED: <id> — verified on disk] │       |
|   └─────────────────────────────────────────────────────────────┘       |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 3. Negative Constitution: What This Mechanism Must NEVER Become

WTF Reality Inheritance is **NOT** context compression. It adheres to strict negative boundaries:

1. **NO Semantic Summarization:** WTF never uses an LLM or heuristic algorithm to "summarize" previously seen code or execution logs. Reality is either transmitted in full or referenced deterministically.
2. **NO Relevance Prediction:** WTF never uses vector embeddings, BM25, or semantic scoring to guess what code the model "needs" or "wants".
3. **NO Lossy Memory:** System Memory remains 100% unpruned and immutable. Raw lines, line numbers, and execution receipts are never discarded.
4. **NO Heuristic Forgetting:** WTF never "forgets" reality based on turn count or recency heuristics.
5. **NO Arbitrary Truncation:** WTF never enforces token budgets by silently dropping recent errors, diagnostics, or instructions.
6. **NO Hidden Chain-of-Thought:** WTF never stores or transfers unverified agent reasoning scratchpads.
7. **NO Model-Specific Prompt Optimization:** WTF never formats reality differently based on model branding or few-shot tuning.
8. **NO Routing or Model Switching:** WTF makes zero routing decisions.
9. **NO Probabilistic State Classification:** WTF never guesses whether a file is modified; it checks cryptographic byte hashes on disk.

```
OBSERVE REALITY. VERIFY REALITY. PRESERVE REALITY. EXPOSE REALITY WHEN REQUIRED. DECIDE NOTHING.
```

---

## 4. Release Lineage

```
v0.1 — REALITY
Know what happened.

v0.2 — DETERMINISTIC WORK
Stop spending intelligence on computation.

v0.3 — TRAJECTORY
Preserve established state across continuation.

v0.4 — REALITY INHERITANCE
Do not make intelligence repeatedly consume verified unchanged reality.
```

### Short Form:
> **KNOW IT. COMPILE IT. PRESERVE IT. DON'T REREAD IT.**

---

## 5. Frozen Production Modules

| Module | Location | Purpose | Core Invariants |
| :--- | :--- | :--- | :--- |
| **Reality Projection** | [`src/core/reality-projection.ts`](file:///Users/linus/Projects/WTF/src/core/reality-projection.ts) | Pure deterministic projection of System Memory across the intelligence boundary. | • Strict 7-invariant evaluation.<br>• Authoritative cryptographic content verification (SHA-256).<br>• Session boundary isolation.<br>• Explicit read queries ALWAYS win over inheritance.<br>• Zero false inheritance (False Inheritance = 0).<br>• Fails closed on any filesystem ambiguity. |
| **Trajectory Ledger** | [`src/core/trajectory-ledger.ts`](file:///Users/linus/Projects/WTF/src/core/trajectory-ledger.ts) | Append-only immutable turn ledger (v0.3 baseline, frozen). | • Strict 3-tier epistemic provenance map.<br>• Never promotes intelligence claim to fact.<br>• System Memory remains complete and unpruned. |
| **Stagnation Detector** | [`src/core/stagnation-detector.ts`](file:///Users/linus/Projects/WTF/src/core/stagnation-detector.ts) | 7 frozen observable rules (v0.3 baseline, frozen). | • Emits strictly informational trajectory health signals.<br>• Zero policy decisions. |
| **Handoff Compiler** | [`src/core/handoff-compiler.ts`](file:///Users/linus/Projects/WTF/src/core/handoff-compiler.ts) | Compiles established state into bounded handoff packet (v0.3 baseline, frozen). | • 100% grounded in TraceSlice coordinates and BoundedViewports.<br>• Zero Chain-of-Thought transfer. |

---

## 6. Verification & Causal Evidence Summary

### 6.1 Historical Causal Evidence (Phase 11.4 Paired Trial, N=12)

- **Capability Preservation:** 6/12 PASS (Control) vs 6/12 PASS (CF1) — **0 Regressions, 0 Rescues**.
- **Prompt Expenditure:** 391,682 tokens $\to$ 152,150 tokens (**-239,532 tokens, -61.2%**).
- **Dollar Spend:** $0.056068 $\to$ $0.019723 (**-64.8%**).
- **Failing Trajectory Growth Slope:** +1,327.3 tok/turn $\to$ +160.5 tok/turn (**-87.9% failure tax reduction**).
- **Routing Divergence:** 0 / 12 (Identical model `google/gemini-2.5-flash` and provider Google AI Studio).

### 6.2 Production Historical Reproduction Gate (Phase 11.6)

- **Historical Withheld Blocks:** 134 blocks
- **Production Withheld Blocks:** 134 blocks
- **Discrepancies:** 0 blocks (100.0% exact reproduction)
- **False Inheritances:** 0

### 6.3 Adversarial Safety Gate

- **16 Adversarial Attack Scenarios:** Byte mutations, same-length mutations, mtime-preserving mutations (`utimesSync`), file deletions, file renames, delete+recreate, file truncations, file expansions, viewport line shifts, explicit read overrides, and session boundary mismatches.
- **False Inheritance Count:** **0**

### 6.4 SHA-256 Attention Disposition

```
[auth-surface] Cryptographic / token routine token match in src/core/reality-projection.ts (line 118)
```
- **Disposition:** **EXPECTED / INTENTIONAL SECURITY-SENSITIVE SURFACE**.
- `crypto.createHash('sha256')` is used exclusively for deterministic content-identity verification of raw source code bytes and viewports directly against disk state.
- This cryptographic check is the authoritative guarantee that prevents false inheritance when files are mutated with identical timestamps or file lengths. It remains permanently visible to audit.

### 6.5 Full Test Suite & Gauntlet

- **Unit & Adversarial Tests:** 176 / 176 passed across 19 test files.
- **WTF 100-Point Acceptance Gauntlet:** 100 / 100 points.
- **Typecheck:** Clean (`tsc --noEmit`).
- **Build:** Clean bundle (`esbuild dist/cli.js`, `dist/evidence-compiler.js`).
