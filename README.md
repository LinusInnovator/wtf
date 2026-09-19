# WTF

### Your coding agent says it’s done. WTF checks.

Any agent. Any Git repo. Local. No account. No AI required.

WTF works with any coding agent (Claude Code, Cursor, Copilot, Codex, Aider) because it inspects the resulting software change, not the agent.

```bash
npx agent-wtf
```

---

```
$ npx agent-wtf
WTF — what just happened?
2 files changed · +7 / -5

VERIFIED
  ○ Tests not yet run · Run wtf verify to validate
    tests (npm test)

PAY ATTENTION
  1. TESTS
     Test skipped or disabled
     test/charge.test.js:9
     > test.skip('handles VIP coupon cap calculation', () => {

ALSO
  ⚠ 1 skipped test
  ⚠ 1 debug statement (console.log)

Review surface:
  12 lines to review across 2 files
```

Then:

```
$ npx agent-wtf verify
WTF — what just happened?
2 files changed · +6 / -5

VERIFIED
  ✓ tests       (254ms)

Review surface:
  11 lines to review across 2 files
```

```
Agent finishes
     ↓
    WTF
     ↓
  Evidence
     ↓
Agent fixes
     ↓
WTF verify
     ↓
Human gets receipt
```

---

## Why WTF?

Coding agents can generate more code in two minutes than you can review in an afternoon.

When an agent claims: *"Done! Refactored the billing module and all tests pass."* — humans are left with three questions:

1. **What actually happened?**
2. **Did it actually work, or did the agent just say it did?**
3. **Where do I actually need to look?**

WTF gives you the answers in ~20 seconds.

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

## Try It in 5 Seconds

No installation required:

```bash
npx agent-wtf
```

Or install globally:

```bash
npm install -g agent-wtf
```

### The 4 Essential Commands

| Command | What it does |
| :--- | :--- |
| `wtf` | See what changed and what needs attention in your working tree. |
| `wtf show` | View exact diff snippets and line evidence for every finding. |
| `wtf verify` | Safely discover and run your tests/builds to produce a verified receipt. |
| `wtf --json` | Machine-readable evidence schema (`wtf/0.1`) for coding agents. |

---

## Teach Your Agent to Check Itself

Agents can consume WTF directly. Add this snippet to your repository's agent instructions (`AGENTS.md`, `CLAUDE.md`, or `.cursorrules`):

```markdown
## Task Verification with WTF
Before declaring a coding task complete:
1. Run `wtf` (or `wtf --json`).
2. Inspect its findings.
3. Resolve relevant issues (skipped tests, debug leftovers, auth regressions).
4. Run `wtf verify` when appropriate.
5. Never claim code is verified without supporting evidence.
6. Report meaningful unresolved WTF findings to the human.
```

Or initialize it automatically in your repo:

```bash
wtf init-agent
```

---

## WTF Doesn’t Need Your Code

- **Runs 100% locally**: Zero code or diffs ever leave your machine.
- **Zero network calls**: Works completely offline.
- **Zero telemetry**: No tracking, analytics, or background telemetry.
- **No account or API key**: No signup, no LLM tokens, no monthly bill.
- **Read-only by default**: `wtf` never modifies files or runs code. `wtf verify` only executes standard project test scripts when you explicitly ask it to.

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
git clone https://github.com/agent-wtf/wtf.git
cd wtf
npm install
npm run build
npm test
npm run gauntlet
```

## License

[MIT](LICENSE)
