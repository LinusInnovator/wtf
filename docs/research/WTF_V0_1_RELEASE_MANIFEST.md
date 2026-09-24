# WTF v0.1 Release Manifest & Consolidation Report

**Release Candidate Version:** `v0.1.0`  
**Date:** September 2026  
**Artifact Type:** Release Candidate Architecture, Surface Definition, and Consolidation Manifest  
**Constitutional Invariant:**
> *"WTF deterministically compiles software reality into evidence that intelligence can efficiently reason over.*  
> *WTF establishes what is and what happened. It does not decide what should happen."*

---

## 1. Minimal Production Surface Definition

WTF v0.1 is an independent evidence and perception layer for software work. The production package is strictly zero-runtime-dependency pure TypeScript/ESM designed for immediate global execution via `npx agent-wtf` or `wtf`.

### 1.1 The Constitutional Five Primitives
Every observation, report, and machine receipt emitted by WTF v0.1 adheres strictly to the Five Primitives of Protocol v0:
1. **`CHANGE`**: Concrete modifications to files or repository environment (lines added/deleted, file status, mechanical vs meaningful classification).
2. **`DIAGNOSTIC`**: Structured findings emitted by deterministically executed tools (linters, test suites, compilers).
3. **`RELATION`**: Exact coordinate, spatial, or structural intersections between entities (e.g. auth-surface intersections, skipped test declarations, schema operations).
4. **`VERIFICATION`**: Deterministic outcomes of explicitly executed verification commands (exit codes, execution duration, stdout/stderr streams).
5. **`UNKNOWN`**: Explicit recognition of unverified state, unexecuted suites, or unprovable user intent.

### 1.2 Public CLI & API Surface
The release candidate provides 5 public subcommands and flags:
- `wtf` (default): Fast working tree inspection (read-only, ~15ms).
- `wtf check`: Single-turn verification and change inspection designed for autonomous coding agents (runs tests, inspects changes, flags risks, and emits the one-line `WTF-RECEIPT:`).
- `wtf verify`: Autonomous test/build discovery and execution, producing independently verified execution receipts.
- `wtf init-agent`: Repository configuration utility for coding agents (configures `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, and `.github/copilot-instructions.md`; supports `--print`).
- `wtf show [filter]`: Detailed evidence ledger drill-down with lossless secondary filtering.
- `wtf --json` / `wtf check --json`: Full machine-readable `wtf/0.1` JSON evidence schema.

---

## 2. Production Files & Module Inventory

The production build bundles into `dist/cli.js` (102.7 KB) and `dist/evidence-compiler.js` (11.5 KB). The production modules are strictly quarantined in `src/`:

```
src/
├── cli.ts                   # CLI entrypoint, argument parsing, command dispatch
├── types.ts                 # Shared domain types, exit codes, evidence interfaces
├── core/
│   ├── protocol-v0.ts       # Canonical Evidence Protocol v0 schema & builder
│   ├── evidence-compiler.ts # High-density evidence compilation engine
│   ├── evidence.ts          # Core analysis coordinator (git + detectors + verification)
│   ├── git.ts               # Hardened, zero-shell Git inspection & diff parser
│   ├── path-tree.ts         # Deterministic compact radix-trie projection (two-tier folding)
│   ├── classifier.ts        # Meaningful vs mechanical change classification
│   └── security.ts          # Path traversal, symlink containment & ANSI sanitization
├── detectors/
│   ├── auth.ts              # Authentication & authorization surface detector
│   ├── db.ts                # Database migration and schema change detector
│   ├── deps.ts              # Dependency manifest & lockfile modification detector
│   ├── env.ts               # Environment variable & secrets exposure detector
│   ├── hygiene.ts           # Debug leftovers (console.log, debugger) detector
│   ├── tests.ts             # Test skip / disable detector (it.skip, @unittest.skip)
│   └── workflows.ts         # CI/CD and automation workflow modification detector
├── formatters/
│   ├── agent.ts             # Token-dense zero-ANSI agent markdown formatter & WTF-RECEIPT
│   ├── json.ts              # wtf/0.1 JSON schema serializer
│   ├── show.ts              # Detailed evidence ledger formatter with path filtering
│   └── terminal.ts          # Human-facing terminal overview with semantic compression
└── verify/
    └── runner.ts            # Deterministic test runner discovery & execution harness
```

---

## 3. Test Suite Protection & Coverage

The production runtime is protected by **10 test suites comprising 94 comprehensive tests** executing via Vitest in under 4.5 seconds with 100% pass rate:

1. **`test/gauntlet.test.ts` (10/10 scenarios, 100/100 points):** Complete end-to-end acceptance loop covering clean changes, mechanical lockfiles, dependency additions, database migrations, auth changes, failing tests, skipped tests, clean verified receipts, hygiene issues, and agent CLI contracts.
2. **`test/protocol-v0.test.ts` (8 tests):** Canonical Protocol v0 schema validation, Five Primitives compliance, and provenance tracking.
3. **`test/evidence-compiler.test.ts` (2 tests):** High-density compression and semantic preservation.
4. **`test/evidence-density.test.ts` (13 tests):** Two-tier compact radix trie path projection, cluster compaction, sibling limits, and aggregation.
5. **`test/agent-contract.test.ts` (11 tests):** Token-dense formatting, zero-ANSI emission, receipt parsing, and agent consumption.
6. **`test/canonical-consumers.test.ts` (13 tests):** Multi-consumer contract verification (agent, show, json, terminal).
7. **`test/verification-lifecycle.test.ts` (9 tests):** Independent verification execution, command discovery, timeouts, and error handling.
8. **`test/policy-separation.test.ts` (7 tests):** Strict separation between deterministic observation and speculative policy.
9. **`test/security.test.ts` (20 tests):** Path containment, symlink traversal prevention, ANSI stripping, and shell injection immunity.
10. **`test/smoke.test.ts` (1 test):** Package export and binary bootstrap smoke check.

---

## 4. Intentionally Excluded Research Machinery

All experimental trial runners, evaluation frameworks, MLX models, and historical research tooling are strictly excluded from the production package (`package.json` includes only `bin`, `dist`, `README.md`, `LICENSE`, `AGENTS.md`):

- **Historical JUG/Kev Engines:** `scratch/jug-experiment*`, `run_phase4_experiment.py`, `run_phase8_j1_experiment.py`, MLX logit scorers.
- **Dynamic Switching & Boundary Detection Harnesses:** `scratch/blind_boundary_detector*`, `scratch/compatibility_selector.py`, `scratch/state_transfer_compiler.py`, `scratch/run_phase8_*.py`.
- **Benchmark Repositories & Workspaces:** `scratch/taskset_6_3_v1`, `scratch/repos`, `scratch/repos_pool`, `scratch/bench_eval`.
- **Model Telemetry Logs & Analysis Scripts:** `scratch/phase8_*`, `scratch/handshake_*`, `scratch/stage*`.

*All historical research documents, forensic inventories, and observations remain completely preserved under `docs/research/`.*

---

## 5. Known Limitations & Post-v0.1 Opportunities

### 5.1 Known Limitations (Documented in v0.1)
- **Local Language Ecosystems:** Auto-discovery currently specializes in Node.js, Python, Rust, Go, and Shell test runners. Other ecosystems require explicit test scripts or configuration.
- **Text-Span Anchor Exactness:** Code mutation still operates via text replacements (`replace_in_file`), requiring models to acquire exact character context.
- **Single-Turn Scope:** WTF v0.1 is an evidence and verification engine, not an autonomous multi-turn orchestrator.

### 5.2 Post-v0.1 Opportunities (Phase 9 Roadmap)
1. **Phase 9.1 — AST Symbol Resolution:** Mechanically resolving unindexed compiler error tokens directly to AST coordinates without text paging.
2. **Phase 9.2 — Coordinate-Targeted Patch Normalization:** Replacing raw string anchor matching with coordinate-based syntax node mutation.
3. **Phase 9.3 — Cross-Repo Autonomous Portfolio Routing:** Exploring bounded decision intelligence where candidate sets are genuinely discrete (e.g. tool selection across 20+ specialized remote agents).

---

## 6. Audit & Release Verification Summary

```markdown
WTF v0.1 RELEASE CANDIDATE: READY
PRODUCTION SURFACE:
  • Binaries: bin/wtf.js, bin/agent-wtf.js
  • Bundles: dist/cli.js (102.7kb), dist/evidence-compiler.js (11.5kb)
  • Modules: src/cli.ts, src/types.ts, src/core/*, src/detectors/*, src/formatters/*, src/verify/*
  • CLI: wtf, wtf check, wtf verify, wtf init-agent, wtf show, wtf --json
FILES CHANGED:
  • src/cli.ts (+5 / -1)
  • src/core/path-tree.ts (+355 / -0)
  • src/formatters/agent.ts (+113 / -31)
  • src/formatters/show.ts (+19 / -0)
  • scripts/demo.sh (+4 / -1)
  • test/evidence-density.test.ts (+442 / -0)
  • test/gauntlet.test.ts (+1 / -1)
  • docs/research/WTF_RESEARCH_STATE.md
  • docs/research/WTF_V0_1_RELEASE_MANIFEST.md
FILES REMOVED FROM PRODUCTION PATH: 0 (All research scaffolding was already isolated in scratch/)
RESEARCH HISTORY PRESERVED: YES (All 41 observation files & full research state preserved)
TESTS: 94 passed (94/94), 10 test files, Gauntlet 100/100, demo.sh verified
REGRESSIONS: NONE
PUBLIC CLI VERIFIED: YES (All subcommands and help verified)
NEW BEHAVIOR INTRODUCED: NO
JUG/JEV IN RUNTIME: NO
PHASE 9 WORK ACCIDENTALLY INCLUDED: NO
GIT STATUS: Clean modified working tree; all tests and build artifacts verified.
PROPOSED COMMIT: "release: consolidate WTF v0.1 release candidate and manifest"
PROPOSED TAG: v0.1.0-rc1
BLOCKERS: NONE
NEXT ACTION: User review of release candidate before tagging.
```
