# WTF Phase 9.1 — v0.2 Invariant Execution Substrate Architecture

**Date:** September 24, 2026  
**Document Status:** FROZEN ARCHITECTURAL SPECIFICATION  
**Baseline:** Tagged `v0.1.0` (`fe5c8e0afb0febf27e51404342532c052c3b72db`)  
**Scope:** Production specification for the WTF v0.2 Invariant Execution Substrate.  
**Constitutional Invariant:**
> *"WTF deterministically compiles software reality into evidence that intelligence can efficiently reason over.*  
> *WTF establishes what is and what happened. It does not decide what should happen."*

---

## 1. Executive Summary & Core Objective

WTF v0.2 has exactly **one architectural job**:

> **Move proven deterministic work permanently below the intelligence boundary.**

In `v0.1.0`, WTF established what happened to repository files and test suites (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`) and emitted verified receipts. However, during the repair loop, coding agents remained forced to spend probabilistic intelligence on purely mechanical tasks:
1. Parsing raw stderr stack traces to find which file and line failed (7.0% turns spent on target paging).
2. Paging through hundreds of lines of code to acquire local context (42.7% turns spent on anchor re-acquisition).
3. Wrestling with whitespace, indentation, and escaping differences to apply patches (22.4% turns spent on mechanical retries).

Phase 8.6 demonstrated that **72.1% of all agent turns are non-semantic deterministic waste**.

WTF v0.2 productionizes the four proven, experimentally validated mechanisms from research that permanently eliminate this waste, assembling them into a single, zero-dependency, pure-TypeScript invariant substrate:
1. **Trace Slice** (Deterministic error traceback coordinate extraction)
2. **Bounded Context Viewport** (Deterministic localized code projection)
3. **Action Normalization** (Deterministic tool-vocabulary canonicalization)
4. **Action Compilation** (Deterministic syntax-preserving patch enactment)

### Constitutional Boundary Enforcement
WTF may deterministically establish, transform, expose, execute, and verify reality.  
WTF **must never infer**:
- user intent
- semantic relevance
- root cause
- desired behavior
- semantic tradeoffs
- what code should mean

---

## 2. Component Specifications

```
                     ┌──────────────────────────────────────────────┐
                     │            WTF v0.2 SUBSTRATE                │
                     │                                              │
  Process Exit       │  ┌────────────────┐      ┌────────────────┐  │  Bounded Window
  (stdout/stderr) ───┼─►│  Trace Slice   ├─────►│Bounded Viewport├─┼─► to Intelligence
                     │  └────────────────┘      └────────────────┘  │
                     │                                              │
  Raw Action Intent  │  ┌────────────────┐      ┌────────────────┐  │  Verified Byte
  (tool name, text) ─┼─►│Action Normalize├─────►│Action Compiler ├─┼─► Mutation to Disk
                     │  └────────────────┘      └────────────────┘  │
                     └──────────────────────────────────────────────┘
```

---

### 2.1 Trace Slice

#### Responsibility
Deterministically parses compiler diagnostics and test-runner error output (stdout/stderr) across supported language ecosystems (Python, Node/TypeScript, Rust, Go), identifying the exact source files, line numbers, and column offsets where failures occurred within the repository workspace.

#### Exact Inputs
- `text`: string — Raw stdout and stderr emitted by a verification process.
- `workspaceRoot`: string — Absolute path to repository root (for relative path normalization and containment).
- `options`:
  - `ignorePaths`: string[] — Path patterns to exclude (defaults: `node_modules`, `.venv`, `site-packages`, `/usr/`, `Cellar`, target build dirs).

#### Exact Outputs
`TraceFrame[]` ordered chronologically / by stack depth:
```typescript
interface TraceFrame {
  file: string;          // Normalized relative path within workspace (e.g. "src/lib.rs")
  line: number;          // 1-indexed source line number
  column?: number;       // 1-indexed column number if present
  source: 'python' | 'node' | 'rust' | 'go' | 'generic';
  raw: string;           // Exact line matched in traceback
}
```

#### Deterministic Invariant
Every returned frame must correspond to an actual, readable file on disk located within `workspaceRoot`. Zero guessing: if an error message mentions a symbol without a file and line coordinate, it is omitted.

#### Fail-Closed Behavior
If zero trace frames match regexes, or if all matched files reside outside `workspaceRoot` (e.g. in standard libraries or external vendor code), Trace Slice returns an empty list `[]`. It never guesses an arbitrary file.

#### Relationship to Existing v0.1 Primitives
Directly populates canonical `RELATION` instances in Protocol v0 (`CanonicalRelation`), linking a failed `VERIFICATION` run to exact coordinate locations in `CHANGE` or repository files.

#### Receipt / Evidence Emitted
Integrated into Markdown agent receipts:
```markdown
## VERIFIED
✗ tests: failed (1/4) in 312ms [cargo test]
  --> src/lib.rs:388:14 [AssertionFailed: expected true, got false]
```

#### Production Module Boundary
- Module: `src/core/trace-slice.ts`
- Consumers: `src/verify/runner.ts`, `src/formatters/agent.ts`, `src/cli.ts` (`wtf check`).

#### Experimental Source Being Promoted
- `scratch/run_stage2_6_trace_slice.py` (`extract_and_resolve_trace_frames()`)
- `scratch/handoff_compiler_v84a.py` (`FRAME_PATTERNS`, `extract_trace_frames()`)
- Research report: [`docs/research/observations/trace_slice_experiment.md`](trace_slice_experiment.md)

#### Behavioral Equivalence Tests Required
- Python `pytest` and `unittest` traceback formatting (`File "...", line X`).
- Node / V8 stack traces (`at Function (file:line:col)` and `at file://...`).
- Rust `rustc` compiler and test assertion traces (`--> path.rs:line:col`).
- Go test failure outputs (`file.go:line:`).
- Path traversal rejection: external library paths (`.venv`, `node_modules`) stripped cleanly.

---

### 2.2 Bounded Context Viewport

#### Responsibility
Deterministically extracts and formats a bounded window of lines $[coord - radius : coord + radius]$ around a specified target coordinate or failure frame, annotating line numbers and highlighting the exact target coordinate with a focus indicator.

#### Exact Inputs
- `filePath`: string — Relative or absolute path to the target file.
- `centerLine`: number — 1-indexed coordinate line number.
- `options`:
  - `radius`: number — Number of context lines before and after (default: `15`, configurable up to `50`).
  - `workspaceRoot`: string — Workspace base path.
  - `showPointer`: boolean — Whether to mark `centerLine` with a pointer indicator (`==>`) (default: `true`).

#### Exact Outputs
`BoundedViewportResult`:
```typescript
interface BoundedViewportResult {
  file: string;            // Relative path
  startLine: number;       // 1-indexed starting line rendered
  endLine: number;         // 1-indexed ending line rendered
  totalLines: number;      // Total lines in file on disk
  centerLine: number;      // Focus coordinate
  formatted: string;       // Formatted viewport text with line numbers and focus marker
  rawLines: string[];      // Array of unformatted line strings
}
```

Format specification:
```
[WTF BOUNDED VIEWPORT: src/marshmallow/validate.py lines 75 to 105 (coordinate line 90 of 320)]:
    75 |     def _validate_url(self, value: str) -> None:
    76 |         if not value:
   ...
==> 90 |             scheme, netloc, path, query, fragment = urlsplit(value)
   ...
   105 |         return None
```

#### Deterministic Invariant
Line numbering is strictly 1-indexed. The window is clamped deterministically:
- `startLine = max(1, centerLine - radius)`
- `endLine = min(totalLines, centerLine + radius)`
No file modification occurs.

#### Fail-Closed Behavior
If `filePath` does not exist on disk, is a directory, is a binary file, or cannot be read as UTF-8, returns an error object: `{ ok: false, error: "File not accessible: <path>" }`. It never hallucinates file contents.

#### Relationship to Existing v0.1 Primitives
Exposes the underlying reality of `CHANGE` and `RELATION` coordinates to agents without requiring broad directory searches or full file dumps.

#### Receipt / Evidence Emitted
Emitted by `wtf view <file>:<line>` or injected into agent markdown when `wtf check` encounters an isolated single-point test failure.

#### Production Module Boundary
- Module: `src/core/viewport.ts`
- CLI subcommand: `wtf view <path:line> [--radius N]`
- Public API: `renderBoundedViewport(filePath, centerLine, options)`

#### Experimental Source Being Promoted
- `scratch/run_stage4_2_viewport_experiment.py` (`get_bounded_source_slice()`)
- `scratch/handoff_compiler_v84a.py` (`extract_bounded_viewport()`)
- Research report: [`docs/research/observations/viewport_elimination_experiment.md`](viewport_elimination_experiment.md)

#### Behavioral Equivalence Tests Required
- Mid-file coordinate extraction with radius 15.
- File boundary clamping at start of file (`centerLine = 3, radius = 15` $\to$ lines 1 to 18).
- File boundary clamping at end of file (`centerLine = 98, total = 100, radius = 15` $\to$ lines 83 to 100).
- Pointer placement verification (`==>` strictly on `centerLine`).
- Non-existent and binary file rejection.

---

### 2.3 Action Normalization

#### Responsibility
Deterministically classifies and maps heterogeneous tool invocation names and action verbs (from various agent harnesses, models, and protocols) into canonical WTF action classes.

#### Exact Inputs
- `actionName`: string — Raw tool name or verb (e.g. `replace_in_file`, `write_to_file`, `run_shell`, `edit_file`).

#### Exact Outputs
`CanonicalActionClass`:
```typescript
type CanonicalActionClass = 'MUTATION' | 'READ' | 'SHELL' | 'FINISH' | 'UNKNOWN';
```

Canonical mapping:
- **`MUTATION`**: `replace_in_file`, `replace_file_content`, `write_file`, `write_to_file`, `edit_file`, `apply_patch`.
- **`READ`**: `read_file`, `view_file`, `get_file`, `cat`.
- **`SHELL`**: `run_command`, `run_shell`, `bash`, `search`, `list_dir`, `ls`.
- **`FINISH`**: `finish`, `complete`, `exit`.
- **`UNKNOWN`**: Any unmapped string.

#### Deterministic Invariant
Pure static string table lookup. Case-insensitive and trimmed. Zero heuristic inference.

#### Fail-Closed Behavior
Any action name not explicitly in the static canonical map evaluates strictly to `'UNKNOWN'`.

#### Relationship to Existing v0.1 Primitives
Provides canonical action classification for trajectory tracking and action compilation.

#### Production Module Boundary
- Module: `src/core/action-normalizer.ts`
- Public API: `normalizeActionName(rawAction: string): CanonicalActionClass`

#### Experimental Source Being Promoted
- `scratch/action_normalizer.py` (`CANONICAL_ACTION_MAP`, `normalize_action()`)
- Research report: [`docs/research/observations/residual_boundary_detection_phase8_3a.md`](residual_boundary_detection_phase8_3a.md)

#### Behavioral Equivalence Tests Required
- All 18 canonical action names mapped to correct class.
- Case and whitespace insensitivity (`"  REPLACE_IN_FILE  "` $\to$ `'MUTATION'`).
- Unknown actions fall closed to `'UNKNOWN'`.

---

### 2.4 Action Compilation

#### Responsibility
Deterministically resolves model-generated patch intents against actual disk bytes. Normalizes formatting entropy (mixed indentation, trailing whitespace, blank line boundaries, JSON escaping artifacts) to apply code replacements bit-for-bit without semantic modification, while strictly failing closed on any ambiguity.

#### Exact Inputs
`ActionCompilerParams`:
```typescript
interface ActionCompilerParams {
  content: string;         // Current disk file contents
  oldText: string;         // Target text to replace
  newText: string;         // Replacement text
  startLine?: number;      // Optional 1-indexed bounding constraint
  endLine?: number;        // Optional 1-indexed bounding constraint
}
```

#### Exact Outputs
`ActionCompilerResult`:
```typescript
interface ActionCompilerResult {
  success: boolean;
  content: string;         // Mutated file content if success = true
  strategyUsed?: 'exact' | 'line_normalized' | 'token_sequence';
  spansMatched: number;
  error?: string;          // Explicit diagnostic if success = false
}
```

#### Deterministic Invariant & The 3-Tier Resolution Hierarchy
1. **Tier 1 — Exact Substring Match:**
   - If `oldText` matches `content` exactly once: perform direct replacement.
   - If `oldText` matches $>1$ times, check if `startLine` and `endLine` narrow the match to exactly 1 occurrence. If so, replace.
2. **Tier 2 — Line-Normalized Match (Indentation & Blank Line Entropy):**
   - Strip leading/trailing blank lines from `oldText`.
   - Normalize whitespace on non-empty lines (`' '.join(line.trim().split())`).
   - Match sequence of non-empty normalized lines across `content`.
   - If exactly one unique span matches:
     - Preserve target base indentation from the original file.
     - Re-align `newText` indentation if `oldText` lacked relative base indentation.
     - Preserve existing line endings (LF).
     - Apply replacement.
   - If multiple spans match: filter by `[startLine, endLine]`. If still $>1$, **FAIL CLOSED** (`Ambiguous match: N occurrences found`).
3. **Tier 3 — Token-Sequence Match (Line-Wrap & Whitespace Entropy):**
   - Tokenize non-whitespace tokens in `oldText` and `content`.
   - Match consecutive token sequence.
   - If exactly one span matches: replace character span from first token start to last token end with `newText`.
   - If multiple spans match: **FAIL CLOSED**.

#### Fail-Closed Behavior
- If `oldText` is empty or only whitespace: **FAIL** (`"Target text is empty"`).
- If target text is not found by any of the 3 tiers: **FAIL** (`"Target text not found in file"`).
- If $>1$ match is found at any tier and cannot be disambiguated by coordinate constraints: **FAIL** (`"Ambiguous match: N occurrences found. Please provide more context lines."`).
- **NEVER** apply a replacement to an ambiguous location.
- **NEVER** modify `newText` logic or semantics.

#### Relationship to Existing v0.1 Primitives
Creates verified `CHANGE` instances on disk that are immediately measured by `git diff` and verified by `runner.ts`.

#### Receipt / Evidence Emitted
Emitted by `wtf patch` CLI or tool integration:
```markdown
✓ patch applied: src/marshmallow/validate.py (strategy: line_normalized, 1 occurrence)
  - 4 lines removed, + 5 lines added
```

#### Production Module Boundary
- Module: `src/core/action-compiler.ts`
- CLI subcommand: `wtf patch <file> --old <text> --new <text> [--start N] [--end N]`
- Public API: `compileAndApplyPatch(params): ActionCompilerResult`

#### Experimental Source Being Promoted
- `scratch/action_compiler_v0.py` (`action_compiler_replace()`)
- `scratch/test_action_compiler.py`
- Research reports: [`docs/research/observations/action_compilation_experiment.md`](action_compilation_experiment.md), [`docs/research/observations/action_compilation_substrate_audit_phase7_3c.md`](action_compilation_substrate_audit_phase7_3c.md)

#### Behavioral Equivalence Tests Required
- All 80 historical real execution events from Phase 7.3C audited dataset.
- Exact substring match (clean 1-to-1).
- Tabs vs. spaces indentation discrepancy resolution.
- Mixed line-ending / blank line boundary resolution.
- Multi-occurrence disambiguation via `startLine` and `endLine`.
- Ambiguity fail-closed rejection (e.g. duplicate single-line statements).
- Empty target rejection.
- Zero semantic modification: `newText` applied byte-for-byte.

---

## 3. The Composed v0.2 Substrate Lifecycle

The four components compose into an unbroken, deterministic operational loop around intelligence:

```
                      REALITY (Repository State on Disk)
                                     │
                                     ▼
                     [ Deterministic Verification ]
                        (npm test / cargo test)
                                     │
                                     ▼
                             [ TRACE SLICE ]
                     (src/core/trace-slice.ts)
                 Extracts exact failing file:line
                                     │
                                     ▼
                       [ BOUNDED CONTEXT VIEWPORT ]
                         (src/core/viewport.ts)
                Projects [coord - 15 : coord + 15] lines
                                     │
                                     ▼
                      INTELLIGENCE (Agent / Model)
           Reads localized code; authors bug repair intent
                                     │
                                     ▼
                        [ ACTION NORMALIZATION ]
                     (src/core/action-normalizer.ts)
                     Maps tool verb to 'MUTATION'
                                     │
                                     ▼
                          [ ACTION COMPILATION ]
                     (src/core/action-compiler.ts)
               Compiles whitespace/anchors against disk
               (Fails closed if ambiguous; zero guessing)
                                     │
                                     ▼
                        [ DETERMINISTIC EXECUTION ]
                         Applies bytes to disk
                                     │
                                     ▼
                        [ VERIFICATION LIFECYCLE ]
                         (src/verify/runner.ts)
                         Auto-proves new reality
                                     │
                                     ▼
                           [ PROTOCOL v0 RECEIPT ]
                         (src/formatters/agent.ts)
                   Emits WTF-RECEIPT machine contract
                                     │
                                     ▼
                                 REALITY'
```

### What This Composition Eliminates
1. **Target Search Paging (7.0% turns):** Eliminated by Trace Slice.
2. **Anchor Acquisition Re-reads (42.7% turns):** Eliminated by Bounded Viewport.
3. **Mechanical Patch Retries (22.4% turns):** Eliminated by Action Compilation.
4. **Manual Verification Loops (7.3% turns):** Eliminated by Verification Lifecycle.

**Total Deterministic Waste Eliminated:** **72.1% of agent turns**.

---

## 4. Architectural Non-Goals for v0.2

To preserve the constitutional boundary and keep WTF zero-dependency and deterministic, the following mechanisms are **strictly excluded** from v0.2:

- **No Trajectory Boundary Detection:** Belongs to multi-turn agent supervisors, not the single-turn execution substrate.
- **No Compiled Handoff / State Transfer:** Belongs in multi-agent routing layers.
- **No Model Profiling / Capability Handshake:** Belongs in harness tuning, not core substrate.
- **No Dynamic Intelligence Switching / Routing:** Belongs above the substrate.
- **No JUG / Jev / Probabilistic Decision Heads:** Rejected/deferred; redundant in local repair.
- **No LLM Calls Inside WTF:** WTF v0.2 executes zero inference calls.

---

## 5. Proposed Production Module Inventory (v0.2)

```
src/
├── cli.ts                          # Subcommands: wtf, check, verify, view, patch, init-agent
├── types.ts                        # Added: TraceFrame, ViewportResult, ActionCompiler types
├── core/
│   ├── protocol-v0.ts              # Canonical Five Primitives
│   ├── evidence-compiler.ts        # Evidence compression
│   ├── evidence.ts                 # Analysis coordinator
│   ├── git.ts                      # Git inspection
│   ├── path-tree.ts                # Radix-trie projection
│   ├── classifier.ts               # Meaningful/mechanical classifier
│   ├── security.ts                 # Path sanitization
│   │
│   │── [NEW v0.2 MODULES]
│   ├── trace-slice.ts              # Error traceback coordinate extraction
│   ├── viewport.ts                 # Bounded code window projector
│   ├── action-normalizer.ts        # Canonical action vocabulary mapper
│   └── action-compiler.ts          # Deterministic patch resolution engine
│
├── detectors/                      # Unchanged mechanical relation detectors
├── formatters/                     # Updated to embed trace coordinates and viewports
└── verify/
    └── runner.ts                   # Updated to pass stderr to trace-slice
```

---

## 6. v0.2 Causal Reproduction Gate

To establish that the production TypeScript implementation preserves the exact empirical mechanisms established in Python research, the following **frozen historical benchmark challenge sets** must be re-run against the compiled v0.2 binary:

### Gate 1: Action Compilation Fidelity (Historical 80-Event Gate)
- **Dataset:** The 80 real Action Compilation events audited in Phase 7.3C (11 from Phase 7.1 Bonsai, 7 from Stage 5.2 Qwen, 62 from Phase 6 Frontier ladder).
- **Target Criterion:**
  - 80/80 (100.0%) successful resolutions.
  - 9/9 clean ambiguous/empty rejections.
  - Exactly 0 false mutations.
  - Exactly 0 semantic alterations.

### Gate 2: Trace Slice & Viewport Accuracy (Stage 2.6 / 4.2 Gate)
- **Dataset:** The 5 canonical multi-ecosystem challenge tasks:
  1. `task-01-python-starlette-status-code` (Python pytest)
  2. `task-02-python-marshmallow-url-fragment` (Python unittest)
  3. `task-09-rust-walkdir-skip-dir` (Rust cargo test)
  4. `task-11-rust-anyhow-ensure-neg` (Rust macro failure)
  5. `task-12-node-plimit-detached-map` (Node.js test)
- **Target Criterion:**
  - 5/5 (100.0%) ground-truth file and line coordinates extracted from failed test stderr.
  - 5/5 (100.0%) bounded viewports correctly centered on failure line with correct line numbering and pointer indicator.

### Gate 3: End-to-End Mechanical Patch Closure (Task 09 WalkDir Reproduction)
- **Dataset:** `task-09-rust-walkdir-skip-dir`.
- **Target Criterion:**
  - An indentation-mismatched single-line patch (`if self.depth == 0 { return None; }`) applied against `src/lib.rs` via `wtf patch` compiles and matches the single valid code location with zero manual whitespace alignment.

---

## 7. Sign-off & Completion Status

```markdown
PHASE 9.1: COMPLETE
V0.2 COMPONENTS: Trace Slice, Bounded Context Viewport, Action Normalization, Action Compilation
EXPERIMENTAL IMPLEMENTATIONS LOCATED:
1. Trace Slice: scratch/run_stage2_6_trace_slice.py & scratch/handoff_compiler_v84a.py
2. Bounded Viewport: scratch/run_stage4_2_viewport_experiment.py & scratch/handoff_compiler_v84a.py
3. Action Normalization: scratch/action_normalizer.py
4. Action Compilation: scratch/action_compiler_v0.py & scratch/test_action_compiler.py
PRODUCTION MODULES PROPOSED:
- src/core/trace-slice.ts
- src/core/viewport.ts
- src/core/action-normalizer.ts
- src/core/action-compiler.ts
CONSTITUTIONAL BOUNDARY PRESERVED: YES
NEW SEMANTIC DECISION LOGIC: NO (100% deterministic Regime 0 computation)
CAUSAL REPRODUCTION GATE:
- Gate 1: 80/80 historical Action Compilation replay (100% resolution, 0 false mutations)
- Gate 2: 5-task multi-ecosystem Trace Slice & Viewport coordinate accuracy
- Gate 3: End-to-end task-09 WalkDir indentation-mismatched patch closure
UNRESOLVED ARCHITECTURAL QUESTIONS: None (all 4 components are fully proven in research)
READY FOR IMPLEMENTATION: YES
IMPLEMENTATION PERFORMED: NO
```
