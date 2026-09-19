# Task Plan: WTF (V0 Build) — Developer Evidence Engine

## Goal
Build and release WTF V0: a blazing-fast, zero-cloud, harness-independent CLI tool that analyzes what just changed in a repository, what actually worked, what was not verified, and what deserves human/agent attention — scoring >90/100 across a 10-scenario acceptance gauntlet.

## Current Phase
Phase 8: Polish, Packaging & Launch Readiness (COMPLETE)

## Phases

### Phase 1: Requirements, Research & Architecture
- [x] Analyze WTF specification and user requirements
- [x] Research existing tools & approaches to ensure WTF's unique value
- [x] Define the 100-point Gauntlet Test Suite specification
- [x] Design core architecture, data structures, and `wtf/0.1` JSON schema
- [x] Document initial findings in `findings.md`
- **Status:** complete

### Phase 2: Project Scaffolding & Core Architecture
- [x] Initialize Git repository & TypeScript/Node.js project (`agent-wtf` / `wtf`)
- [x] Configure build setup (`esbuild` bundling to single self-contained `dist/cli.js`)
- [x] Establish CLI entry points (`bin/wtf.js`, `wtf`, `wtf verify`, `wtf show`, `wtf --json`)
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

### Phase 7: Gauntlet Loop & Acceptance Testing (100/100 Score Achieved!)
- [x] Build automated gauntlet runner evaluating all 10 core scenarios:
  1. Trivial clean change (10/10 pts)
  2. Large mechanical / generated / lockfile change (10/10 pts)
  3. Dependency addition (10/10 pts)
  4. Database migration (10/10 pts)
  5. Auth-sensitive change (10/10 pts)
  6. Failing tests (10/10 pts)
  7. Skipped / disabled tests (10/10 pts)
  8. Clean successful change (10/10 pts)
  9. Mixed unrelated changes & debug leftovers (10/10 pts)
  10. Agent & CLI contract (10/10 pts)
- [x] Total score: 100 / 100 (surpassing requirement of >90)
- [x] Dogfooded WTF on WTF repository itself
- **Status:** complete

### Phase 8: Polish, Packaging & Launch Readiness
- [x] Outstanding README.md with clear concept, ASCII/ANSI terminal preview, quickstart (`npx agent-wtf`), agent guide
- [x] MIT License & package.json metadata for npm publish (`agent-wtf` and `bin: { wtf: ... }`)
- [x] Verified zero runtime dependencies, bundle size <55KB, execution <50ms
- [x] Committed clean Git release v0.1.0
- **Status:** complete

## Key Decisions Made
| Decision | Rationale |
|----------|-----------|
| TypeScript + Node.js ESM + esbuild bundle | Instant startup, native cross-platform support, single-file bundle for zero install delay with `npx agent-wtf`. |
| Zero runtime dependencies | Keeps bundle ~50KB, installs instantaneously via `npx`, zero supply-chain risk. |
| Strict 4-tier model: REPORTED, OBSERVED, VERIFIED, UNKNOWN | Zero hallucinations or fake confidence percentages; facts first. |
| Objective 100-point Gauntlet Suite | All 10 acceptance scenarios tested and scored 100/100. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| ANSI color codes in test assertions | 1 | Added `stripAnsi` helper in gauntlet tests for robust plain-text assertions. |
| Diff chunk context truncation in package.json | 2 | Switched dependency detector to compare manifests directly (`git show HEAD:manifest` vs disk) for 100% accuracy. |
