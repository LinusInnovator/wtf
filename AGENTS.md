# WTF Agent Completion Protocol

WTF is an independent evidence engine for machine-generated software work.

```
Agents act. WTF proves. Humans decide.
```

## How Coding Agents Use WTF

When an agent works in a repository equipped with WTF (or using `npx agent-wtf`), the agent should follow this completion loop before claiming its task is complete:

```
Agent implements
      ↓
Agent thinks it's done
      ↓
`wtf` / `wtf --json`
      ↓
Inspect evidence & findings
      ↓
Resolve issues (auth regressions, migration risks, skipped tests, debug leftovers)
      ↓
`wtf verify`
      ↓
Attach WTF Receipt to final completion report
      ↓
Human decides
```

### Protocol Rules

1. **Check before completion**: Always run `wtf` (or `wtf --json`) before concluding work.
2. **Never claim code is verified without evidence**: Do not state that "tests pass" unless `wtf verify` independently validates them (`status: PASSED`, `tier: VERIFIED`). Remember that passing checks prove only that the executed tests/checks passed, not that overall user intent or software behavior is correct.
3. **Inspect PAY ATTENTION**: If items appear under `PAY ATTENTION`, either resolve them or explain why they are intentional in your report.
4. **Clean up hygiene**: Do not leave `console.log`, `debugger;`, or temporary `TODO` comments behind.
5. **No silent skips**: Never introduce `it.skip` or comment out tests to artificially make test suites pass. WTF flags skipped tests immediately.

### Schema (`wtf/0.1`)

Run:
```bash
wtf --json
```

Output format:
```json
{
  "spec": "wtf/0.1",
  "timestamp": "2026-09-19T12:00:00.000Z",
  "repo": {
    "root": "/path/to/repo",
    "branch": "main",
    "head": "abc1234"
  },
  "change": {
    "totalFiles": 3,
    "linesAdded": 45,
    "linesDeleted": 12,
    "meaningfulLines": 57,
    "mechanicalLines": 0,
    "compressionRatio": 0.0,
    "isClean": false
  },
  "payAttention": [
    {
      "id": "auth-expiry-...",
      "category": "AUTH",
      "title": "Session expiry / timeout behavior modified",
      "file": "auth/session.ts",
      "line": 42,
      "severity": "CRITICAL",
      "evidenceTier": "OBSERVED"
    }
  ],
  "also": [],
  "verification": [
    {
      "name": "tests",
      "command": "npm test",
      "status": "PASSED",
      "summary": "183/183",
      "tier": "VERIFIED"
    }
  ],
  "reported": [],
  "observed": [ ... ],
  "verified": [ ... ],
  "unknown": [ ... ]
}
```

### Harness Integration (Cursor, Claude Code, Copilot, Cline, Aider)

Add this snippet to your repository rules (`.cursorrules`, `CLAUDE.md`, or `AGENTS.md`):

```markdown
## Task Verification with WTF
Before declaring a coding task complete:
1. Run `npx agent-wtf` or `wtf --json`.
2. Address any warnings under PAY ATTENTION.
3. Run `npx agent-wtf verify` to run tests and typechecks.
4. Include the verification summary in your response to the user.
```
