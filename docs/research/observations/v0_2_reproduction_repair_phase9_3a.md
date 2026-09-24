# WTF Phase 9.3A — Bounded Reproduction Repair

## Executive Summary

Phase 9.3A executed the bounded repair protocol to resolve the discrepancies identified during Phase 9.3's causal reproduction gates without introducing new mechanisms, semantic ranking, or heuristic drift.

Per protocol constraints:
- **Pocket 21 rule**: Fix what the reproduction exposed. Nothing else.
- **Literal semantics**: Ensure JavaScript string replacements are byte-for-byte identical with Python verbatim replacements, free of `$` token expansions.
- **Trace Slice precedence fidelity**: Recover and preserve the historical deterministic precedence rule without inventing synthetic "impl over test" heuristics.
- **Zero unrelated production changes**.

```
PHASE 9.3A OVERALL VERDICT: CAUSALLY REPRODUCED
PRODUCTION BASELINE: v0.2 Substrate (Phase 9.2 with Phase 9.3A bounded repair)
PRODUCTION CHANGES: 1 (src/core/action-compiler.ts Strategy 1 slice replacement)
UNRELATED CHANGES: 0
GATE 1 (Action Compilation Replay): REPRODUCED (80/80 agreements, 80/80 byte-for-byte exact, 9/9 rejects, 0 false mutations)
GATE 2 (Trace Slice + Viewport): REPRODUCED (5/5 exact top coordinates, 5/5 exact viewports)
GATE 3 (End-to-End WalkDir Closure): RETAINED REPRODUCED (100% mechanical closure, 0 retries, final exit 0)
READY TO FREEZE v0.2: YES
```

---

## 1. Defect 1 — Literal Replacement Semantics (`src/core/action-compiler.ts`)

### Root Cause
In Phase 9.3, 5 of 80 historical cases diverged because JavaScript `String.prototype.replace(oldText, newText)` treats `$` in `newText` as special pattern replacements (`$&` inserts the matched substring, `$'` inserts the following substring, etc.). On `task-02-python-marshmallow-url-fragment` (Turn 4 of model `qwen/qwen3-8b`), the emitted replacement contained RFC 3986 userinfo regex characters `...$&\'...`, expanding file bytes from 25,008 to 25,175 and cascading into target misses on subsequent turns.

### Production Repair
Replaced `String.prototype.replace(oldText, newText)` in Strategy 1 with exact index slicing:
```typescript
const idx = content.indexOf(oldText);
const replaced = content.slice(0, idx) + newText + content.slice(idx + oldText.length);
```
This guarantees verbatim, byte-for-byte insertion of `newText` regardless of `$` patterns, matching Python's `str.replace(old, new, 1)` behavior identically.

### Regression Coverage
Added unit tests to `test/action-compiler.test.ts` covering:
- `$&` (matched substring)
- `$'` (post-match substring)
- `$\`` (pre-match substring)
- `$1` (capture group token)
- Ordinary `$` characters in RFC 3986 regex character classes

### Gate 1 Replay Results
Replayed all 80 historical resolutions (from Phase 7.1 Bonsai, Stage 5.2, and Phase 6.5 Frontier) and 9 clean fail-closed rejections via `scratch/replay_gate1.ts`:
- **Historical Cases Replayed**: 80
- **Successful Resolutions**: 80 / 80 (100.0%)
- **Exact Byte-for-Byte Matches**: 80 / 80 (100.0%)
- **Clean Fail-Closed Rejections**: 9 / 9 (100.0%)
- **False Mutations**: Exactly 0
- **Mismatches vs Experimental**: Exactly 0
- **Verdict**: **REPRODUCED**

---

## 2. Defect 2 — Trace Frame Precedence Forensic Recovery

### Historical Recovery Audit
An audit was conducted across the frozen research implementation files and reports:
1. `docs/research/observations/trace_slice_experiment.md` Section 3 (Epistemic Invariant 4):
   > *"Zero semantic ranking; frames are preserved in strict order of appearance."*
2. `scratch/run_stage2_6_trace_slice.py` lines 82–105 (`extract_and_resolve_trace_frames`):
   Loops over lines sequentially; preserves first-appearance order in `found`.
3. `docs/research/observations/trace_slice_experiment.md` Section 1 (Finding 4):
   > *"When a test failure reports only the test coordinate (`tests/test_basic.py:591` in Click) while the bug resides in a 3,000-line implementation file (`src/click/core.py`), Trace Slice correctly projects the test coordinate without hallucinating the implementation file, leaving implementation discovery to the agent."*
4. `docs/research/observations/bonsai2_profile_validation_phase7_2.md` Section 3:
   Recorded that in `task-11-rust-anyhow-ensure-neg`, `src/error.rs:405` (the lifetime deprecation warning emitted first by rustc) was literally foregrounded by Trace Slice during the Bonsai trial.

### Deterministic Rule
The historical deterministic rule was recovered unambiguously:
> **Frames are emitted in strict sequential order of first appearance in the observed process diagnostic output (stdout/stderr), subject only to workspace path resolution, regular file verification on disk, and vendor/environment directory exclusion (`.venv`, `node_modules`, `/usr/`, `site-packages`, etc.).**

Zero semantic re-ranking (such as testing-vs-implementation path discrimination or root-cause guessing) was ever part of the frozen Trace Slice primitive.

### Verification of Production Equivalence
Comparing the production TypeScript engine `extractTraceFrames` (`src/core/trace-slice.ts`) against the Python reference `extract_and_resolve_trace_frames` on all 5 canonical multi-ecosystem challenge tasks confirms:
- `task-01`: Top frame is `tests/test_exceptions.py:114` (exact 100% agreement with Python reference)
- `task-02`: Top frame is `tests/test_validate.py:41` (exact 100% agreement with Python reference)
- `task-09`: Top frame is `src/lib.rs:846:46` (exact 100% agreement with Python reference)
- `task-11`: Top frame is `src/error.rs:405:18` (exact 100% agreement with Python reference)
- `task-12`: Top frame is `index.js:108:65` (exact 100% agreement with Python reference)

Production TypeScript produces bit-for-bit identical frames and ordering with the Python reference. The discrepancy in Phase 9.3 arose because the test script tested against benchmark target solution files rather than against authentic Trace Slice output coordinates.

### Gate 2 Replay Results
Replayed the 5 multi-ecosystem challenge tasks via `scratch/test_gate2.ts`:
- **Cases Evaluated**: 5
- **Exact Top Coordinate Agreement**: 5 / 5 (100.0%)
- **Exact Bounded Viewport Agreement**: 5 / 5 (100.0%)
- **Verdict**: **REPRODUCED**

---

## 3. Gate 3 — End-to-End WalkDir Closure Assessment

Per protocol constraints, the expensive Bonsai 2 27B trial was **not rerun**:
1. The correction to Strategy 1 string replacement in `action-compiler.ts` eliminates `$` token expansion. In the WalkDir Turn 7 patch, the model emitted Rust code (`self.pop()`) which contains no `$` characters; thus the patch application was already exact and verified.
2. Zero modifications were made to `trace-slice.ts`, `viewport.ts`, or any other runtime module.
3. The Phase 9.3 Gate 3 result stands fully valid:
   - Historical Configuration Reconstructed: **YES**
   - Semantic Repair Produced: **YES**
   - Action Compilation Closed Patch: **YES** (Turn 7, 0 retries)
   - Final Verification: **PASSED (exit code 0)**
   - Status: **REPRODUCED**

---

## 4. Verification & Gate Receipts

```markdown
## VERIFIED
✓ tests: passed (130/130) in 4074ms [npm test]
✓ typecheck: passed in 1178ms [npm run typecheck]
✓ build: passed in 291ms [npm run build]

## OBSERVED
18 application files changed: +3118 / -0 (3118 meaningful lines across 3 directory clusters)
  • docs/research/ (5 files · +1608/-0)
    ├── direct files: WTF_RESEARCH_STATE.md (+191/-0)
    └── observations/ (4 files · +1417/-0)
  • src/ (9 files · +960/-0)
    ├── direct files: cli.ts (+66/-0), types.ts (+6/-0)
    ├── core/ (5 files · +878/-0)
    ├── formatters/ (1 file · +6/-0) [agent.ts]
    └── verify/ (1 file · +4/-0) [runner.ts]
  • test/ (4 files · +550/-0)
    ├── direct files: 4 files · +550/-0

## UNKNOWN
- Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)

WTF-RECEIPT: v0.1 | base:fe5c8e0 | VERIFIED (3/3) | ATTENTION (0) | OBSERVED (+3118/-0, 18f)
```
