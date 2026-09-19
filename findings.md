# Findings & Research: WTF (V0 Build)

## Requirements Breakdown
- **Target Audience 1: Humans**
  - Instant clarity: what changed, what worked, what wasn't verified, what needs attention.
  - Read-only by default (`wtf`).
  - Terminal UX: Calm, scannable, fits ~1 screen, compression is key (~X meaningful lines / Y changed).
  - Drill-down available via `wtf show`.
  - Verification run via `wtf verify`.
- **Target Audience 2: Coding Agents**
  - Stable machine-readable output: `wtf --json` conforming to `wtf/0.1` spec.
  - Strict evidence tiers: REPORTED, OBSERVED, VERIFIED, UNKNOWN.
  - No synthetic confidence scores (e.g., no "87% safe").
  - Agent instructions template (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`).
- **Core Principles & Constraints**
  - Zero cloud dependency, zero accounts, local-first, zero telemetry.
  - Harness independent (works whether change was made by Claude Code, Cursor, Copilot, Aider, human, etc.).
  - Fast execution (<1 second; ideally <100ms).
  - Works on any Git repository.
- **Gauntlet Loop & Acceptance Test**
  - Score > 90/100 across 9 real repository scenarios.
  - Dogfood WTF on WTF itself.

## 100-Point Gauntlet Rubric Specification
To achieve the user's requirement ("go gauntlet loop. report back when at over 90 of 100 score"), we define an objective automated gauntlet evaluation:
1. **Scenario 1: Trivial clean change (10 pts)**
   - Single file doc/minor edit: output is calm, 0 noise, quick clean receipt.
2. **Scenario 2: Large mechanical / generated / lockfile changes (10 pts)**
   - +5,000 line package-lock.json / generated protobuf / bundle: accurately identifies generated vs meaningful lines, review surface compressed to only human files.
3. **Scenario 3: Dependency additions & version updates (10 pts)**
   - `package.json` / `Cargo.toml` dependency additions surfaced under ALSO or PAY ATTENTION if suspicious.
4. **Scenario 4: Database schema migration (10 pts)**
   - New SQL / migration script detected, highlighted under PAY ATTENTION (e.g., table alter/drop/ownership change).
5. **Scenario 5: Auth / security-sensitive changes (10 pts)**
   - Session/token/auth/crypto changes flagged under PAY ATTENTION with file & context.
6. **Scenario 6: Failing tests & test regressions (10 pts)**
   - When tests fail during `wtf verify`, reported as UNVERIFIED/FAILED with exact failed test count and output snippet.
7. **Scenario 7: Skipped or disabled tests (10 pts)**
   - Newly introduced `it.skip`, `xit`, `#[ignore]`, or commented out tests flagged as warning.
8. **Scenario 8: Clean successful change with full verification (10 pts)**
   - All tests/checks passing: calm, green VERIFIED receipt with passing count.
9. **Scenario 9: Mixed unrelated changes & debug leftovers (10 pts)**
   - `console.log`, `debugger`, `TODO`, `FIXME` leftovers flagged, unrelated modified files categorized.
10. **Agent & CLI Contract (10 pts)**
    - `wtf --json` validates against schema, `wtf show` shows detail, dogfooding on itself passes cleanly, execution time < 500ms.

Total: 100 points. Passing threshold: > 90 points.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Node.js 18+ / TypeScript + esbuild bundle | Instant startup, native JSON, cross-platform git invocation, single distributed binary `dist/index.js` with `bin: { wtf: "bin/wtf.js" }`. |
| Zero external heavy runtime dependencies | Keeps bundle < 100KB, installs in 1 second via `npx agent-wtf`, zero vulnerability surface. |
| Direct Git Plumbing (`git status --porcelain=v2`, `git diff --numstat`, `git diff -U0`) | Highly reliable, machine-stable, fast, avoids parsing brittle human git porcelain v1 formats. |
| Modular Detector Architecture | Clean detector interfaces (`detectors/auth.ts`, `detectors/db.ts`, `detectors/deps.ts`, `detectors/tests.ts`, `detectors/hygiene.ts`, `detectors/mechanical.ts`). |
| Verification Adapter System | Safe autodetection of npm, yarn, pnpm, bun, cargo, pytest, make. Never executes arbitrary unknown strings. |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
|       |            |
