# Task Plan: WTF (V0 Build) — Developer Evidence Engine

## Goal
Build and release WTF V0: a blazing-fast, zero-cloud, harness-independent CLI tool that analyzes what just changed in a repository, what actually worked, what was not verified, and what deserves human/agent attention — scoring >90/100 across a 9-scenario acceptance gauntlet.

## Current Phase
Phase 1: Requirements, Research & Architecture

## Phases

### Phase 1: Requirements, Research & Architecture
- [x] Analyze WTF specification and user requirements
- [x] Research existing tools & approaches (git diff tools, jest-diff, git-what-changed, etc.) to ensure WTF's unique value
- [x] Define the 100-point Gauntlet Test Suite specification
- [x] Design core architecture, data structures, and `wtf/0.1` JSON schema
- [x] Document initial findings in `findings.md`
- **Status:** complete

### Phase 2: Project Scaffolding & Core Architecture
- [x] Initialize Git repository & TypeScript/Node.js project (`agent-wtf` / `wtf`)
- [x] Configure build setup (esbuild/tsup for single zero-dependency standalone bundle or fast Node ESM)
- [x] Establish CLI entry points (`wtf`, `wtf verify`, `wtf show`, `wtf --json`, `wtf --version`)
- [x] Set up unit testing framework (Vitest)
- **Status:** complete

### Phase 3: Evidence Engine Implementation
- [x] Universal Git analyzer (staged, unstaged, branch base, commit range, untracked files)
- [x] Diff compression & classifier (distinguishing mechanical/generated/lockfile vs meaningful lines)
- [x] High-value pattern detectors:
  - Auth, session, permissions, security-sensitive changes
  - Database schema migrations (SQL, Prisma, Drizzle, Alembic, etc.)
  - Dependency additions & lockfile diffs (npm, cargo, pip, go, etc.)
  - Environment variables & configuration changes (.env*, configs)
  - CI/CD workflow modifications (.github/workflows, etc.)
  - Tests added / deleted / skipped / disabled (it.skip, xit, @pytest.mark.skip, #[ignore], etc.)
  - Debug leftovers & TODO/FIXME markers
  - Destructive behavior indicators (drop table, rm -rf, fs.unlink, bypasses)
- [x] Four-tier evidence categorization model (REPORTED, OBSERVED, VERIFIED, UNKNOWN)
- **Status:** complete

### Phase 4: Verification Engine (`wtf verify`)
- [x] Safe, conservative repository validator detection (npm, pnpm, yarn, bun, cargo, pytest, go test, make)
- [x] Isolated execution runner with timeouts and output capture
- [x] Translation of runner results into VERIFIED receipts (passed, failed, skipped)
- [x] Read-only safety guardrails (never run untrusted arbitrary commands without detection confidence)
- **Status:** complete

### Phase 5: Terminal UX & Formatter (`wtf`, `wtf show`)
- [x] Beautiful, screenshot-worthy ANSI terminal UI fitting on one screen
- [x] Review surface compression counter (~X meaningful lines / Y changed)
- [x] Calm, clear hierarchy: VERIFIED, PAY ATTENTION, ALSO, summary
- [x] `wtf show` for drill-down evidence inspection with context
- [x] Zero-color / plain text / NO_COLOR fallback
- **Status:** complete

### Phase 6: Agent Integration & Schema (`wtf --json`)
- [x] Output strictly conformant `wtf/0.1` JSON
- [x] Agent instruction templates (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`)
- [x] Agent workflow integration test (agent ingests json, acts on findings, reruns wtf)
- **Status:** complete

### Phase 7: Gauntlet Loop & Acceptance Testing (>90/100 Target)
- [x] Build automated gauntlet runner evaluating all 9 core scenarios:
  1. Trivial clean change
  2. Large mechanical / generated / lockfile change
  3. Dependency addition
  4. Database migration
  5. Auth-sensitive change
  6. Failing tests
  7. Skipped / disabled tests
  8. Clean successful change
  9. Mixed unrelated changes
- [x] Benchmark 20-second human test & compression ratio
- [x] Benchmark agent consumption & receipt loop
- [x] Dogfood WTF on WTF repository itself
- [x] Score gauntlet test suite and iterate until score > 90/100
- **Status:** complete

### Phase 8: Polish, Packaging & Launch Readiness
- [x] Outstanding README.md with clear concept, ASCII/ANSI terminal preview, quickstart (`npx agent-wtf`), agent guide
- [x] MIT License & package.json metadata for npm publish (`agent-wtf` and `bin: { wtf: ... }`)
- [x] Final verification & goal completion
- **Status:** complete

## Key Questions
1. How to ensure near-zero startup time (<100ms)? Bundle into single self-contained executable JS file using esbuild/tsup, avoiding heavy runtimes.
2. How to distinguish mechanical/generated changes from human-meaningful lines? Track generated file heuristics (lockfiles, minified, sourcemaps, generated comments, repeated patterns, large diff-to-file ratio).
3. How to avoid false positives in "Pay Attention"? Use strict heuristic rules with high signal-to-noise ratio rather than speculative fuzzy matching.
4. How to guarantee safety for `wtf verify`? Strictly whitelist known project standard build/test runners and parse exit codes without shell-escaping risks.

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| TypeScript + Node.js ESM + bundle to dist/index.js | Fast execution, native cross-platform support, single-file bundle for zero install delay with `npx agent-wtf`. |
| Zero external heavy CLI frameworks (clean minimal CLI parser or micro-lib) | Keeps binary size tiny (<50KB bundled) and execution under 50ms. |
| Strict 4-tier model: REPORTED, OBSERVED, VERIFIED, UNKNOWN | Zero hallucinations or fake confidence percentages; facts first. |
| Objective 100-point Gauntlet Suite | Ensures reproducible, rigorous verification of all requirements before completion. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes
- Regularly update `task_plan.md`, `findings.md`, and `progress.md`.
- Keep terminal output concise, calm, and readable within 20 seconds.
- Goal: Gauntlet score > 90/100.
