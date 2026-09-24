# WTF Phase 9.2 — Invariant Execution Substrate Implementation Report

**Date:** September 24, 2026  
**Document Status:** COMPLETE & VERIFIED IMPLEMENTATION REPORT  
**Baseline:** Tagged `v0.1.0` (`fe5c8e0afb0febf27e51404342532c052c3b72db`)  
**Scope:** Production implementation and verification of the WTF v0.2 Invariant Execution Substrate.  
**Constitutional Invariant:**
> *"WTF deterministically compiles software reality into evidence that intelligence can efficiently reason over.*  
> *"WTF establishes what is and what happened. It does not decide what should happen."*

---

## 1. Executive Summary

In Phase 9.2, the proven deterministic mechanisms established across Phases 6 through 8 were promoted from experimental Python scripts into the zero-dependency, pure-TypeScript production runtime.

Four core modules were implemented, integrated, and verified with 100% test pass rates across 129 tests and a 100/100 Acceptance Gauntlet score:
1. **`src/core/action-normalizer.ts`**: Canonical action vocabulary mapping.
2. **`src/core/action-compiler.ts`**: 3-tier deterministic patch enactment engine.
3. **`src/core/trace-slice.ts`**: Multi-ecosystem traceback coordinate extraction.
4. **`src/core/viewport.ts`**: Bounded code window projector with target markers.

All existing v0.1.0 functionality, CLI commands, and test suites remain completely intact with zero regressions. No probabilistic reasoning, model selection, or semantic decision logic was introduced.

---

## 2. Production Modules Implemented

### 2.1 Action Normalization (`src/core/action-normalizer.ts`)
- **Behavioral Reference:** `scratch/action_normalizer.py`
- **Responsibility:** Pure deterministic classification of heterogeneous agent tool names into canonical action classes: `MUTATION`, `READ`, `SHELL`, `FINISH`, or `UNKNOWN`.
- **Implementation Highlights:**
  - Fast, static `Readonly<Record<string, CanonicalActionClass>>` mapping.
  - Case-insensitive and whitespace-trimmed.
  - Fail-closed: unmapped strings return `'UNKNOWN'` with zero guessing.
  - Exported helper predicates: `isMutationAction`, `isReadAction`, `isShellAction`, `isFinishAction`.
- **Test Coverage:** `test/action-normalizer.test.ts` (7 tests).

### 2.2 Action Compilation (`src/core/action-compiler.ts`)
- **Behavioral Reference:** `scratch/action_compiler_v0.py` (`action_compiler_replace`)
- **Responsibility:** Resolves model-generated patch intents against actual disk bytes by normalizing formatting entropy without altering semantics.
- **Implementation Highlights:**
  - **Strategy 1 (Exact Substring):** Direct bit-for-bit replacement; disambiguates multiple occurrences via `[startLine, endLine]`.
  - **Strategy 2 (Line-Normalized):** Normalizes whitespace and indentation per line; preserves base target indentation; trims blank line boundaries; handles coordinate constraints.
  - **Strategy 3 (Token-Sequence):** Character span replacement matching non-whitespace token streams across line wrapping.
  - **Fail-Closed Safety:** Rejects empty targets, whitespace-only targets, and ambiguous matches (>1 occurrences).
  - **Filesystem Executor:** `compileAndApplyPatchToFile()` with strict root-escape path containment.
- **Test Coverage:** `test/action-compiler.test.ts` (13 tests).

### 2.3 Trace Slice (`src/core/trace-slice.ts`)
- **Behavioral Reference:** `scratch/run_stage2_6_trace_slice.py` and `scratch/handoff_compiler_v84a.py`
- **Responsibility:** Extracts workspace `file:line:col` coordinates from compiler and test runner error streams.
- **Implementation Highlights:**
  - Multi-ecosystem regex pattern bank covering Python (`pytest`/`unittest`), Rust (`rustc` compiler and panic traces), Node/TypeScript (V8 stack traces and file URLs), and Go test failures.
  - Workspace path containment and normalization.
  - Automatic filtering of vendor/environment noise (`.venv`, `node_modules`, `/usr/`, `site-packages`, `Cellar`).
  - Validation against actual disk files (discards non-existent or deleted files).
  - Deduplication of identical coordinate frames.
- **Test Coverage:** `test/trace-slice.test.ts` (7 tests).

### 2.4 Bounded Context Viewport (`src/core/viewport.ts`)
- **Behavioral Reference:** `scratch/run_stage4_2_viewport_experiment.py` and `scratch/handoff_compiler_v84a.py`
- **Responsibility:** Projects a localized window of source code $[coord - radius : coord + radius]$ lines around a focus coordinate.
- **Implementation Highlights:**
  - 1-indexed numbering with deterministic clamping to `[1, totalLines]`.
  - Focus pointer marker (`==>`) on target coordinate line.
  - Path traversal security checks.
  - Clean fail-closed error handling for non-existent or directory paths.
- **Test Coverage:** `test/viewport.test.ts` (8 tests).

---

## 3. Substrate Composition & CLI Integration

The invariant substrate was integrated directly into the production surface:
1. **Verification Failure Coordinates:** `src/verify/runner.ts` now automatically passes failed test stdout/stderr through `extractTraceFrames()`, attaching verified coordinates directly to `VerificationItem` and `VerificationItemV0`.
2. **Receipt Enrichment:** `src/formatters/agent.ts` now renders coordinate pointers under `## FAILED`:
   ```markdown
   ## FAILED
   ✗ tests: FAILED [cargo test]
     --> src/lib.rs:388:14
   ```
3. **New CLI Subcommands:** `src/cli.ts` exposes the substrate directly to developers and agents:
   - `wtf view <file:line> [--radius N]`: Projects bounded context viewport around failure coordinates.
   - `wtf patch <file> --old <text> --new <text> [--start N] [--end N]`: Compiles and applies patches with formatting normalization.

---

## 4. Verification & Behavioral Parity

| Gate / Suite | Pre-Phase 9.2 (v0.1.0) | Post-Phase 9.2 | Status |
|---|---|---|---|
| **TypeScript Typecheck** | 0 errors | 0 errors | **PASSED** |
| **Production Build** | `dist/cli.js` (102.7kb) | `dist/cli.js` (121.1kb) | **PASSED** |
| **Acceptance Gauntlet** | 100 / 100 points | 100 / 100 points | **PASSED** |
| **Test Suites** | 10 passed (94 tests) | 14 passed (129 tests) | **PASSED (+35 tests)** |
| **Regressions** | 0 | 0 | **ZERO REGRESSIONS** |

### Test Suite Breakdown:
- `test/action-normalizer.test.ts`: 7/7 tests passed.
- `test/action-compiler.test.ts`: 13/13 tests passed.
- `test/trace-slice.test.ts`: 7/7 tests passed.
- `test/viewport.test.ts`: 8/8 tests passed.
- Existing 10 test suites (Protocol v0, Density, Gauntlet, Security, Consumers, etc.): 94/94 passed.

---

## 5. Specification & Implementation Audit

During implementation, the TypeScript modules were compared against the Python references:
1. **Action Normalization:** 100% equivalence with `scratch/action_normalizer.py`. All 19 action mappings and fail-closed behaviors match.
2. **Action Compilation:** 100% equivalence with `scratch/action_compiler_v0.py`. All 3 resolution tiers, whitespace normalization rules, coordinate filtering, and fail-closed error messages match.
3. **Trace Slice:** 100% equivalence with `scratch/handoff_compiler_v84a.py`. All frame patterns, ecosystem classifications, ignore patterns, and disk checks match.
4. **Context Viewport:** 100% equivalence with Phase 9.1 specification. Line clamping, radius options, and pointer markers match.

**Discrepancies Encountered:** None. The specification in Phase 9.1 and experimental Python code were in complete harmony.

---

## 6. Excluded Machinery & Constitutional Invariants

In strict adherence to instructions:
- **No Causal Reproduction Performed:** The Phase 9.1 benchmark gates were **NOT** executed during Phase 9.2. That is the explicit responsibility of Phase 9.3.
- **Zero Probabilistic / Model Logic:** WTF v0.2 contains zero inference calls, zero model selection, zero JUG/Jev components, and zero root-cause speculation.
- **Zero New External Dependencies:** The production bundle retains zero runtime npm dependencies.

---

## 7. Sign-off

```markdown
PHASE 9.2: COMPLETE
MODULES IMPLEMENTED:
- src/core/trace-slice.ts
- src/core/viewport.ts
- src/core/action-normalizer.ts
- src/core/action-compiler.ts
TESTS ADDED: 35 tests (across 4 new test files)
TOTAL TESTS: 129 passed (14 test files)
GAUNTLET: 100 / 100 points
TYPECHECK: Clean (0 errors)
BUILD: Clean (dist/cli.js 121.1kb)
EXPERIMENTAL BEHAVIORAL PARITY: 100% verified against Python prototypes
CONSTITUTIONAL BOUNDARY PRESERVED: YES
SEMANTIC LOGIC INTRODUCED: NO
SPEC/EXPERIMENT DISCREPANCIES: NONE
CAUSAL REPRODUCTION PERFORMED: NO (Deferred to Phase 9.3)
READY FOR PHASE 9.3: YES
```
