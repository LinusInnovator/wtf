# WTF Phase 11.7 — Reality Inheritance Freeze / v0.4.0

**Status:** COMPLETE (RELEASE FROZEN & VERIFIED)  
**Date:** September 25, 2026  
**Release Version:** `v0.4.0`  
**Release Tag:** `v0.4.0`  
**Release Name:** Reality Inheritance  
**Baseline:** Tag `v0.3.0` (`7fc70b2`)  
**Package:** `agent-wtf@0.4.0`  
**Governing Rule:** *Know it. Compile it. Preserve it. Don't reread it.*

---

## 1. Executive Summary & Objective

Phase 11.7 executes the official release freeze of **WTF v0.4.0 (Reality Inheritance)**.  
The release promotes the deterministic reality projection mechanism proven across Phases 11.4–11.6 into frozen production status.

This phase introduces:
- **Zero new features**
- **Zero optimizations**
- **Zero refactoring**
- **Zero new model calls or OpenRouter spend**
- **Zero CF2 / CF3 heuristics**
- **Zero semantic context management**

---

## 2. Production Freeze Audit

An exhaustive freeze audit was conducted across the entire codebase to confirm strict adherence to WTF constitutional invariants:

1. **Single Production Mechanism:** `src/core/reality-projection.ts` is the sole new production module added in v0.4.0.
2. **Immutable v0.1–v0.3 Semantics:** Modules `trajectory-ledger.ts`, `stagnation-detector.ts`, `handoff-compiler.ts`, `viewport.ts`, `trace-slice.ts`, `action-compiler.ts`, and `evidence-compiler.ts` remain 100% byte-for-byte identical to the v0.3.0 freeze baseline.
3. **No New Evidence Primitive:** Reality inheritance is a deterministic read-only projection over existing Primitives 2, 3, and 4. No Primitive 6 was created.
4. **Complete System Memory:** System Memory (`TrajectoryLedger`, execution receipts, disk states, uncommitted diffs) remains 100% complete and unpruned.
5. **Deterministic Projection:** Identical inputs (memory, disk state, session state) deterministically produce byte-identical projected message arrays across repeated invocations.
6. **Strict Invalidation & Fail-Closed:** Any file mutation, disk modification, deletion, rename, coordinate shift, or session boundary mismatch causes the projection engine to immediately fail closed and transmit full raw reality.
7. **Explicit Read Precedence:** Explicit intelligence queries (`read_file` or viewport checks) always bypass inheritance and return full raw bytes.
8. **No Semantic Logic:** Zero vector embeddings, zero LLM summarization, zero relevance ranking, zero prompt engineering.

---

## 3. SHA-256 Attention Disposition

During `wtf check`, the WTF security detector flags:
```text
• [auth-surface] Cryptographic / token routine token match in src/core/reality-projection.ts (src/core/reality-projection.ts:118)
```

### Forensic Review:
- Line 118 of `src/core/reality-projection.ts` invokes Node's built-in `crypto.createHash('sha256')`.
- This function is used **exclusively** for computing cryptographic content hashes of raw physical source code lines and viewports directly against disk state.
- This cryptographic check is the authoritative safeguard that prevents false inheritance when files are edited with identical timestamps (`mtime`) or file sizes.
- **Formal Classification:** **`EXPECTED / INTENTIONAL SECURITY-SENSITIVE SURFACE`**.
- It is properly flagged, verified harmless, and intentionally kept visible to audit without suppression.

---

## 4. Exact Reproduction & Safety Gates

### 4.1 Historical Reproduction Gate (Phase 11.4 Corpus)
- **Historical Withheld Blocks:** 134 blocks across 12 benchmark tasks.
- **Production Withheld Blocks:** 134 blocks.
- **Discrepancies:** **0 blocks (100.0% exact reproduction)**.
- **False Inheritances:** **0**.
- **Historical Prompt Token Reduction:** -239,532 tokens (-61.2%, 391,682 $\to$ 152,150).
- **Dollar Cost Reduction:** -$0.036345 (-64.8%).
- **Capability Reference:** 6/12 PASS (Control) vs 6/12 PASS (CF1), **0 regressions**.

### 4.2 Adversarial Stale-State Safety Gate
Validated across 16 adversarial attack scenarios in `test/reality-projection.test.ts`:
- Same-length byte mutations: Detected $\to$ Full transmission.
- `mtime`-preserving mutations via `fs.utimesSync`: Detected $\to$ Full transmission.
- File deletions: Detected $\to$ Full transmission.
- Delete + recreate with different content: Detected $\to$ Full transmission.
- File truncations and expansions: Detected $\to$ Full transmission.
- Viewport line insertions: Detected $\to$ Full transmission.
- Identical content rewrites: Verified unchanged $\to$ Inheritance preserved.
- Explicit read requests: Bypasses inheritance $\to$ Full transmission.
- Session boundary crossing: Mismatch detected $\to$ Full transmission.
- **False Inheritance Count = 0**.

---

## 5. Full Release Verification

```text
========================================
FULL RELEASE VERIFICATION SUITE
========================================
✓ npm test: 176 / 176 passed (19 test files)
✓ npm run typecheck: PASSED (tsc --noEmit clean)
✓ npm run build: PASSED (esbuild dist bundles clean)
✓ npm run gauntlet: 100 / 100 points
```

---

## 6. Release Lineage & Constitutional Mandate

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

## 7. Causal Principle Classification

### Established within Tested Single-Agent Reality Projection:
> **INTELLIGENCE SHOULD INHERIT VERIFIED UNCHANGED REALITY, NOT REPEATEDLY REREAD IT.**

### Broader Principle Status:
> **HISTORY MAY GROW. REALITY PRESENTED TO INTELLIGENCE SHOULD NOT HAVE TO.**  
*(Supported within bounded single-agent repair trajectories up to 8 turns; bounded beyond tested conditions).*

---

## 8. Release Status

**RELEASE STATUS: v0.4.0 FROZEN**
