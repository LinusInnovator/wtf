# WTF

> **See what changed, what actually worked, and what deserves your attention.**  
> *A receipt for machine-generated code.*

```
Agents act. WTF proves. Humans decide.
```

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Gauntlet Score](https://img.shields.io/badge/Gauntlet_Score-100%2F100-brightgreen.svg)](#acceptance-gauntlet)
[![Zero Cloud](https://img.shields.io/badge/Cloud_Dependency-Zero-success.svg)](#privacy--trust)

---

## The Problem

Coding agents (Claude Code, Cursor, Copilot, Codex, Windsurf, Aider) now produce more code than humans can realistically watch, read, or review.

When an agent changes 4,000 lines across 30 files, humans are left asking:
1. **What just happened?**
2. **Did it actually work?**
3. **What was not verified?**
4. **Where should I actually look?**

**WTF** is an evidence engine that answers these questions in seconds.

---

## One-Command Trial

Run directly in any Git repository without installing anything:

```bash
npx agent-wtf
```

Or install globally:

```bash
npm install -g agent-wtf
wtf
```

No account. No API key. No cloud dependency. No setup ceremony.

---

## What It Looks Like

```text
$ wtf
WTF — what just happened?
23 files changed · +3,812 / -621

VERIFIED
  ✓ tests       183/183 (1.2s)
  ✓ typecheck   (840ms)
  ✓ build       (410ms)

PAY ATTENTION
  1. AUTH
     Session expiry / timeout behavior modified
     auth/session.ts:42
     > session.timeout = 86400;
  2. DATABASE
     New migration changes account ownership
     db/0042_accounts.sql:12
     > ALTER TABLE accounts OWNER TO app_admin;

ALSO
  + 1 dependency (express@^4.18.2)
  + 2 environment variables (JWT_SECRET, DATABASE_URL)
  + 3 tests
  ⚠ 1 skipped test

Most changes appear mechanical/generated.
Review surface:
  ~94 meaningful lines / 3,812 changed (97.5% compressed)

Run `wtf show` for evidence details.
```

---

## Core Principle: Evidence, Not Opinion

Facts first. AI optional.

WTF categorizes all information into four strict evidence tiers:

| Tier | Meaning | Example |
| :--- | :--- | :--- |
| **`REPORTED`** | Something claims this happened | Agent completion message claims tests pass |
| **`OBSERVED`** | WTF found direct repository evidence | Diffs show auth session expiry was changed |
| **`VERIFIED`** | WTF independently executed and validated it | WTF ran `npm test` and exited code 0 (183/183) |
| **`UNKNOWN`** | Available evidence cannot establish it | Tests exist in repo but have not been run |

**Zero Hallucinated Confidence:** WTF never invents fake metrics like "87% safe" or "low risk". Every finding links directly to file paths, lines, and unified diff hunks.

---

## Compression is the Product

If an agent runs `npm install` and touches `package-lock.json` alongside minor code tweaks, 99% of the diff is noise.

WTF classifies mechanical changes (lockfiles, generated protobufs, minified bundles, snapshots, build outputs) and calculates the **true human review surface**:

```text
Most changes appear mechanical/generated.
Review surface:
  ~94 meaningful lines / 3,812 changed (97.5% compressed)
```

The human terminal output is deliberately designed to **fit on one screen** and be understood within **20 seconds**.

---

## CLI Usage

### 1. `wtf` (Default)
Read-only analysis of uncommitted working tree and staged changes.
```bash
wtf
```

### 2. `wtf verify`
Discovers and executes project test, typecheck, and build suites safely, printing an independently verified receipt.
```bash
wtf verify
```

### 3. `wtf show`
Drill down into findings with file paths, line numbers, and diff snippets.
```bash
wtf show
```

### 4. `wtf --json`
Outputs strict `wtf/0.1` JSON for agent consumption.
```bash
wtf --json
```

### 5. Inspect specific commits or ranges
```bash
wtf --commit abc1234
wtf --range main..HEAD
wtf --staged
```

---

## For Coding Agents

WTF is built for two users: **humans** and **agents**.

Agents use WTF as an independent checkpoint before claiming their work is complete:

```
Agent implements
      ↓
Agent thinks it's done
      ↓
npx agent-wtf --json
      ↓
Inspect findings & resolve regressions
      ↓
npx agent-wtf verify
      ↓
Attach verified receipt to human
```

### Add to your repo instructions (`AGENTS.md` / `CLAUDE.md` / `.cursorrules`)

```bash
wtf init-agent
```

Or paste:

```markdown
## Completion Protocol with WTF
Before declaring a coding task complete:
1. Run `npx agent-wtf` or `wtf --json`.
2. Inspect items under PAY ATTENTION and ALSO.
3. If tests or typechecks exist, run `npx agent-wtf verify` to independently validate them.
4. Never describe code as verified unless WTF marks it VERIFIED.
5. Fix unresolved findings (skipped tests, debug statements, migration risks) before finishing.
```

---

## Acceptance Gauntlet (100 / 100)

WTF is validated against a rigorous 10-scenario real-world repository gauntlet (`npm run gauntlet`):

| Scenario | Objective Tested | Score |
| :--- | :--- | :--- |
| **1. Trivial Clean Change** | Single-line edit produces calm, zero-noise receipt in <100ms | **10 / 10** |
| **2. Large Mechanical Change** | 4,000 line lockfile accurately compressed to ~2 meaningful lines | **10 / 10** |
| **3. Dependency Addition** | `package.json` / `Cargo.toml` additions extracted & categorized | **10 / 10** |
| **4. Database Migration** | Migrations detected; DROP TABLE and OWNER TO flagged as CRITICAL | **10 / 10** |
| **5. Auth-Sensitive Change** | Session timeout/expiry and permission bypasses flagged in PAY ATTENTION | **10 / 10** |
| **6. Failing Tests** | Non-zero exit code captured, failure snippet extracted under VERIFIED | **10 / 10** |
| **7. Skipped / Disabled Tests** | `it.skip`, `xit`, `#[ignore]`, `@pytest.mark.skip` flagged as warnings | **10 / 10** |
| **8. Clean Verified Change** | All suites pass with counts (42/42) and duration timestamps | **10 / 10** |
| **9. Mixed Changes & Hygiene** | `console.log`, `debugger`, `TODO` leftovers caught across files | **10 / 10** |
| **10. Agent & CLI Contract** | `wtf/0.1` JSON schema conformance, fast startup (<50ms), dogfooding | **10 / 10** |
| **Total** | | **100 / 100** |

---

## Privacy & Trust

- **100% Local-First**: No code or diff ever leaves your machine.
- **Zero Cloud**: No API keys, no external servers, no cloud accounts.
- **Zero Telemetry**: No tracking, analytics, or background pings.
- **Read-Only by Default**: Running `wtf` never modifies files or runs arbitrary code. `wtf verify` only executes standard detected project test scripts.

---

## Architecture

```
Git Working Tree / Commits
         │
         ▼
 ┌─────────────────┐
 │   Git Engine    │  Plumbing queries (git status, git diff, patch parser)
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │   Classifier    │  Separates mechanical/generated lines from human lines
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │ Evidence Engine │  Detectors: Auth, DB, Deps, Env, Tests, Hygiene, Workflows
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │  Verification   │  Safe runner for npm, pnpm, yarn, bun, cargo, pytest, go
 └────────┬────────┘
          │
          ▼
 ┌─────────────────┐
 │   WTF Receipt   │  4-Tier ledger (REPORTED, OBSERVED, VERIFIED, UNKNOWN)
 └────────┬────────┘
          │
   ┌──────┴──────┐
   ▼             ▼
Terminal UI    JSON (wtf/0.1)
```

---

## Contributing

Contributions are welcome!

```bash
git clone https://github.com/agent-wtf/wtf.git
cd wtf
npm install
npm run build
npm test
npm run gauntlet
```

## License

[MIT](LICENSE)
