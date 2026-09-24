# WTF

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security Policy](https://img.shields.io/badge/Security-Policy-blue.svg)](SECURITY.md)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success.svg)](#local-by-default-paranoid-by-design)
[![Gauntlet: 100/100](https://img.shields.io/badge/Gauntlet-100%2F100-brightgreen.svg)](#contributing)

### Your coding agent says it’s done. WTF checks.

**Git records what changed. WTF tells you what in that change deserves your attention and what has actually been verified.**

Any agent. Any Git repo. Local. No account. No AI required.

WTF works with any coding agent (Claude Code, Cursor, Copilot, Codex, Aider) because it inspects the resulting software change, not the agent.

```bash
npx agent-wtf
```

---

```
$ npx agent-wtf
WTF — what just happened?
47 files changed · +4,180 / -101

VERIFIED
  ○ Tests not yet run · Run wtf verify to validate
    tests (npm test)

FILES
  • auth/session.ts                     +12/-4
  • test/charge.test.js                 +1/-2
  + package-lock.json                   [mechanical · +4,050/-30]
  • package.json                        +3/-1
  ... and 43 more files. Run `wtf show` for full list.

PAY ATTENTION
  1. AUTH
     Session expiry / timeout behavior modified
     auth/session.ts:42
     > const SESSION_EXPIRY = 60 * 60 * 24 * 7;
  2. TESTS
     Test skipped or disabled
     test/charge.test.js:9
     > test.skip('handles VIP coupon cap calculation', () => {

ALSO
  ⚠ 1 skipped test
  ⚠ auth logic modified
  + 1 dependency added

Most changes appear mechanical/generated.
Review surface:
  ~146 meaningful lines / 4,281 changed (96.6% compressed)
```

Then:

```
$ npx agent-wtf verify
WTF — what just happened?
47 files changed · +4,180 / -101

VERIFIED
  ✓ tests       183/183 passed (312ms)

Review surface:
  ~146 meaningful lines / 4,281 changed (96.6% compressed)
```

```
Agent finishes
     ↓
   `wtf`
     ↓
4,281 lines → 146 meaningful lines
Catches skipped tests & auth regression
     ↓
Agent fixes
     ↓
`wtf verify`
     ↓
Independent local execution receipt
     ↓
Human decides
```

---

## Why WTF?

Coding agents can generate more code in two minutes than you can review in an afternoon.

When an agent claims: *"Done! Refactored the billing module and all tests pass."* — humans are left with three questions:

1. **What actually happened?**
2. **Did it actually work, or did the agent just say it did?**
3. **Where do I actually need to look?**

WTF gives you the answers in under a second.

---

## Compression is the Product

Most agent diffs are dominated by lockfiles, minified bundles, snapshots, and generated boilerplate.

WTF separates mechanical churn from code that actually deserves human attention:

```
  3,812 changed lines
          ↓
         WTF
          ↓
  94 meaningful lines to review (97.5% compressed)
```

You review what matters. WTF accounts for the rest.

---

## Why Not Just `git diff`?

Git tells you what changed. WTF tells you what in that change deserves your attention and what has actually been verified.

Git is the underlying sensor. WTF is the observer and verification layer.

| Dimension | Plain Git (`git diff`) | WTF (`npx agent-wtf`) |
| :--- | :--- | :--- |
| **Review Surface** | Floods terminal with 4,000+ lines of lockfiles, build artifacts, snapshots, and mechanical churn. | **Semantic compression**: Compresses mechanical churn to isolate meaningful code (~96% compression typical). |
| **High-Risk Detection** | Shows raw line diffs; human must manually spot subtle regressions buried across dozens of files. | **Routes attention**: Automatically flags auth changes, skipped tests (`test.skip`), DB migrations, env vars, and debug leftovers. |
| **Execution Evidence** | None. Git records file changes, but has no concept of whether tests passed or code built. | **Independent execution**: Discovers and runs project checks (`wtf verify`), recording local execution evidence (`VERIFIED`). |
| **Agent Completion** | Free-form claims: Agent says *"Done, refactored billing and all tests pass."* | **Completion protocol**: Gives agents a machine-readable schema (`wtf --json`) and auto-configures completion rules (`wtf init-agent`) so agents self-audit and verify before reporting. |

---

## Try It in 5 Seconds

No installation required:

```bash
npx agent-wtf
```

Or install globally:

```bash
npm install -g agent-wtf
```

### The Essential Commands

| Command | What it does |
| :--- | :--- |
| `wtf` | See what changed and what needs attention in your working tree (~50ms). |
| `wtf check` | Single-turn verification and change inspection designed for coding agents. |
| `wtf verify` | Discover and run your tests/builds to produce an independently verified receipt. |
| `wtf view <file:line>` | Deterministically project bounded context viewport around failure coordinates. |
| `wtf patch <file> ...` | Apply patch with formatting and indentation normalization via Action Compilation. |
| `wtf init-agent` | Automatically configure your repository for autonomous agent self-auditing. |
| `wtf show` | View exact diff snippets and line evidence for every finding. |
| `wtf --json` | Machine-readable evidence schema (`wtf/0.1`) for coding agents. |

---

## Make Your Agent Check Itself Autonomously

Run this once in any repository:

```bash
npx agent-wtf init-agent
```

This automatically configures your repository's agent rules (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, and `.github/copilot-instructions.md`).

From that moment on, whenever Claude Code, Cursor, Copilot, or Cline works in your repo, the agent autonomously:
1. **Runs WTF** before declaring completion.
2. **Catches shortcuts**: Detects its own skipped tests (`test.skip`), debug leftovers (`console.log`), and schema risks.
3. **Executes tests**: Runs `wtf verify` to independently execute and validate your test suite.
4. **Hands you proof**: Attaches the independent local verification receipt directly to its final reply before you review.

*(To view the markdown template without modifying files, pass `npx agent-wtf init-agent --print`).*

---

## Local by Default. Paranoid by Design.

WTF is designed to inspect machine-generated changes, so it treats repository content as untrusted input.

* **No code uploads**: Zero code or diffs ever leave your machine.
* **No telemetry**: Works completely offline with zero tracking or background pings.
* **No account or API key**: No signup, no LLM tokens, no monthly bill.
* **No required AI model**: Fast, local deterministic analysis.
* **No shell-based Git commands**: Direct binary spawning (`shell: false`) with baseline Git configuration overrides.
* **Repository filesystem containment**: Enforces realpath containment to prevent symlinks from escaping the repository.
* **Terminal control-sequence sanitization**: Strips ANSI cursor escapes, OSC sequences, and Unicode Bidi controls.
* **Zero runtime npm dependencies**: Pure ESM package with 0 runtime dependencies, reducing third-party supply-chain exposure.

Normal `wtf` analysis does not intentionally execute project code.

`wtf verify` is different: it runs your project’s verification commands locally with your user permissions and is not sandboxed. Only use it on code you trust to execute.

See [SECURITY.md](SECURITY.md) for details.

---

## Epistemic Integrity

WTF is an evidence ledger, not an oracle.

We strictly avoid fabricated confidence scores (e.g. "87% safe" or "clean code guarantee"). Instead, WTF categorizes facts into four strict evidence tiers:

- **`REPORTED`**: What something claims happened (e.g., an agent summary).
- **`OBSERVED`**: What WTF directly confirmed in the Git diff (e.g., session timeout altered, `.env` introduced).
- **`VERIFIED`**: What WTF independently executed and validated (e.g., test runner exited code 0).
- **`UNKNOWN`**: What available evidence cannot prove (e.g., tests exist but have not been run).

WTF does not claim to catch every bug or replace human judgment. It eliminates the blind spots between what the machine claimed and what the machine actually did.

---

## Contributing

```bash
git clone https://github.com/LinusInnovator/wtf.git
cd wtf
npm install
npm run build
npm test
npm run gauntlet
```

---

Built by [@LinusInnovator](https://github.com/LinusInnovator). Explored in depth at [Great Delights](https://great.delights.pro/ai-patterns).

## License

[MIT](LICENSE)
