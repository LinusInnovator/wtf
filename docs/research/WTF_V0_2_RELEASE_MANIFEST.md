# WTF v0.2.0 Release Manifest: Invariant Execution Substrate

**Release Version:** `v0.2.0`  
**Date:** September 25, 2026  
**Status:** FROZEN & SEALED  
**Baseline:** Tag `v0.1.0` (`fe5c8e0`)  
**Package:** `agent-wtf@0.2.0`  

---

## 1. Executive Summary

WTF v0.2 promotes the **Invariant Execution Substrate** from empirical research into the production runtime. The substrate automates deterministic execution mechanics—extracting traceback coordinates, projecting localized code viewports, normalizing patch formatting entropy, and resolving exact substring/token-sequence mutations—without introducing probabilistic models, semantic heuristics, or task answer keys.

```
+-------------------------------------------------------------------------+
|                         WTF v0.2 RUNTIME TOPOLOGY                       |
+-------------------------------------------------------------------------+
|                                                                         |
|   DIAGNOSTICS & TRACEBACKS                SOURCE REPOSITORY             |
|   (stdout / stderr)                                                     |
|           │                                      │                      |
|           ▼                                      ▼                      |
|   ┌───────────────┐                      ┌───────────────┐              |
|   │  Trace Slice  │────────(coord)──────►│BoundedViewPort│──► Perception|
|   └───────────────┘                      └───────────────┘              |
|                                                                         |
|                                                                         |
|   AGENT PATCH INTENT                      TARGET FILE                   |
|   (oldText, newText)                             │                      |
|           │                                      │                      |
|           ▼                                      ▼                      |
|   ┌───────────────┐                      ┌───────────────┐              |
|   │ActionNormalizer                      │ActionCompiler ├──► Mutation  |
|   └───────────────┘                      └───────────────┘              |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 2. Frozen Production Modules

| Module | Location | Purpose | Core Invariants |
| :--- | :--- | :--- | :--- |
| **Trace Slice** | [`src/core/trace-slice.ts`](file:///Users/linus/Projects/WTF/src/core/trace-slice.ts) | Extracts verified file:line coordinates from multi-language diagnostic outputs (Python, Node/TypeScript, Rust, Go). | • Strict order of first appearance.<br>• Zero semantic ranking or heuristic sorting.<br>• Validates file existence on disk.<br>• Excludes vendor/env directories (`.venv`, `node_modules`, `/usr/`, `site-packages`). |
| **Bounded Viewport** | [`src/core/viewport.ts`](file:///Users/linus/Projects/WTF/src/core/viewport.ts) | Projects $[coord - radius : coord + radius]$ lines of source context with focus marker `==>`. | • Deterministic clamping $[1, totalLines]$.<br>• Realpath root-confinement.<br>• Fail-closed on missing/directory paths. |
| **Action Normalizer** | [`src/core/action-normalizer.ts`](file:///Users/linus/Projects/WTF/src/core/action-normalizer.ts) | Strips markdown fences, parses fuzzy JSON payloads, and normalizes newline/tab entropy. | • Syntactic normalization only.<br>• Zero semantic interpretation. |
| **Action Compiler** | [`src/core/action-compiler.ts`](file:///Users/linus/Projects/WTF/src/core/action-compiler.ts) | Reconciles patch intents against disk bytes across three cascading strategies (Exact $\rightarrow$ Line-Normalized $\rightarrow$ Token-Sequence). | • Exact byte-for-byte replacement (no `$` token expansion).<br>• Rejects ambiguous matches (>1 occurrences).<br>• Rejects whitespace-only targets.<br>• Root-escape path containment. |

---

## 3. CLI & Protocol Integrations

1. **`wtf view <file:line> [--radius N]`**:
   Direct CLI entrypoint for agents and developers to render bounded context viewports around diagnostic coordinates.
2. **`wtf patch <file> --old <text> --new <text> [--start N] [--end N]`**:
   Direct CLI entrypoint for applying edits with formatting/indentation normalization.
3. **Verification Failure Coordinates**:
   `src/verify/runner.ts` passes test failure output through `extractTraceFrames()`, attaching verified coordinates directly to `VerificationItem` and `VerificationItemV0`.
4. **Agent Receipt Rendering**:
   `src/formatters/agent.ts` outputs failure coordinates directly under `## FAILED`:
   ```markdown
   ## FAILED
   ✗ tests: FAILED [cargo test]
     --> src/lib.rs:388:14
   ```

---

## 4. Causal Reproduction Gates (Phase 9.3 & 9.3A)

| Gate | Target Criterion | Empirical Evidence | Verdict |
| :--- | :--- | :--- | :---: |
| **Gate 1: Action Compilation Replay** | 80 historical resolutions + 9 rejections from Phase 7.1, Stage 5.2, and Phase 6.5. | • 80 / 80 (100.0%) resolutions.<br>• 80 / 80 bit-for-bit exact byte matches.<br>• 9 / 9 clean rejections.<br>• 0 false mutations. | **REPRODUCED** |
| **Gate 2: Trace Slice & Viewport** | 5 canonical multi-ecosystem challenge tasks (`task-01`, `task-02`, `task-09`, `task-11`, `task-12`). | • 5 / 5 (100.0%) exact top-coordinate matches.<br>• 5 / 5 (100.0%) exact bounded viewports.<br>• Strict appearance-order preserved. | **REPRODUCED** |
| **Gate 3: End-to-End WalkDir Closure** | Authentic `task-09` WalkDir trial with `prism-ml/ternary-bonsai-2-27b`, temp 0.0, 8 turns. | • Semantic repair produced (`self.pop()`).<br>• Action compilation closed patch (Turn 7).<br>• 0 mechanical retries.<br>• Final verification passed (exit 0). | **REPRODUCED** |

---

## 5. Negative Boundary Audit (What Did NOT Ship)

In strict accordance with the Constitutional Protocol, the following research-only and experimental constructs were excluded from production runtime:

- **No Boundary Detection**: No automated capability boundary heuristics or trajectory classification in production.
- **No Compiled Handoff**: No multi-agent handoff state packet injection in production.
- **No Model Profiles**: No per-model configuration flags, calibration probes, or eye charts.
- **No Model Routing / Dynamic Switching**: No dynamic routing between model scales or architectures.
- **No JUG / Jev Metrics**: No Joint Epistemic Verification or cross-agent arbitration engines.
- **No Probabilistic Logic**: Zero LLM calls, embeddings, or probabilistic classifiers in substrate code.

---

## 6. Release Verification

- **Vitest Suite**: 14 test files, 130 tests passing.
- **Acceptance Gauntlet**: 10/10 scenarios, 100/100 points.
- **TypeScript Typecheck**: 0 errors (`tsc --noEmit`).
- **Production Build**: `dist/cli.js` (121.3kb), `dist/evidence-compiler.js` (11.5kb).
- **Runtime Dependencies**: Exactly 0.
