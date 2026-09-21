# WTF Agent Completion Protocol

WTF is an independent evidence engine for machine-generated software work.

```
Agents act. WTF proves. Humans decide.
```

## How Coding Agents Use WTF

When an agent works in a repository equipped with WTF (or using `npx agent-wtf`), the agent follows this single-turn completion protocol before claiming its task is complete:

```
Agent implements
      ↓
Agent thinks it's done
      ↓
`wtf check` (single turn: verifies tests + inspects changes + flags risks)
      ↓
If [FAILED] or [PAY ATTENTION] → fix issues & re-run `wtf check`
      ↓
Attach WTF-RECEIPT to final completion report
      ↓
Human decides
```

### Protocol Rules

1. **Check before completion**: Always run `wtf check` (or `npx agent-wtf check`) before concluding work.
2. **Never claim code is verified without evidence**: Do not state that "tests pass" unless `wtf check` independently validates them (`status: PASSED`, `tier: VERIFIED`). Remember that passing checks prove only that the executed tests/checks passed, not that overall user intent or software behavior is correct.
3. **Inspect PAY ATTENTION**: If items appear under `PAY ATTENTION`, resolve them or explain why they are intentional in your report.
4. **Clean up hygiene**: Do not leave `console.log`, `debugger;`, or temporary `TODO` comments behind.
5. **No silent skips**: Never introduce `it.skip` or comment out tests to artificially make test suites pass. WTF flags skipped tests immediately.

### Machine Contract

Run:
```bash
wtf check
```

Output format (zero-ANSI, token-dense Markdown):
```markdown
## VERIFIED
✓ tests: passed (183/183) in 412ms [npm test]

## OBSERVED
3 files changed: +45 / -12 (57 meaningful lines)
  • src/auth/session.ts (+35/-10)
  • src/types.ts (+10/-2)

## UNKNOWN
- Task intent correctness: unverified (passing checks prove only that executed tests passed, not that overall user intent or requirements are met)

WTF-RECEIPT: v0.1 | base:abc1234 | VERIFIED (1/1) | ATTENTION (0) | OBSERVED (+45/-12, 3f)
```

JSON Schema (`wtf/0.1`) remains available via `wtf check --json` or `wtf --json`.

### Harness Integration (Cursor, Claude Code, Copilot, Cline, Aider)

Add this snippet to your repository rules (`.cursorrules`, `CLAUDE.md`, or `AGENTS.md`):

```markdown
## Task Verification with WTF
Before declaring a coding task complete:
1. Run `npx agent-wtf check` (or `wtf check`).
2. If checks fail under `[FAILED]` or critical items appear under `[PAY ATTENTION]`, resolve them.
3. Include the `WTF-RECEIPT:` line in your response to the user.
```

---

## Developing WTF Itself
Before modifying WTF's evidence model, verification behavior, agent-facing protocol, or core architecture:
1. Read [`docs/research/WTF_RESEARCH_STATE.md`](docs/research/WTF_RESEARCH_STATE.md) and [`docs/research/WTF_EVIDENCE_PROTOCOL_V0.md`](docs/research/WTF_EVIDENCE_PROTOCOL_V0.md).
2. Do not violate established epistemic constraints or alter the five primitives without documenting the empirical reason.

