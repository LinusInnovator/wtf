# Security Policy

WTF is a local developer tool designed to inspect software changes and report verified test outcomes.

## Threat Model

WTF is designed under the assumption that it may be executed in repositories containing untrusted or hostile content—such as machine-generated code from third-party agents, unreviewed pull requests, or maliciously structured git repositories.

The security model distinguishes between two operational modes with different trust boundaries:

---

## 1. Normal Analysis Boundary (`wtf`, `wtf show`, `wtf --json`)

During normal analysis, WTF inspects working tree changes, commit diffs, and file metadata.

* **Does NOT intentionally execute project code.**
* **Does NOT modify files or repository state.**
* **Does NOT evaluate commands through a shell.** Git operations run via direct binary execution (`child_process.spawnSync` with `shell: false`).
* **Does NOT make network calls.** WTF contains no network client code, transmits no telemetry, and functions fully offline.

### Defenses Implemented for Normal Analysis:
* **Git Execution Hardening**: Prepend configuration overrides (`core.fsmonitor=false`, `diff.external=`, `core.hooksPath=/dev/null`, `pager.diff=false`) and pass `--no-ext-diff` and `--no-textconv` to all diff operations. Historical blobs are read via `git cat-file -p` to prevent Git from invoking repository-defined smudge filters.
* **Git Reference Validation**: All revisions and ranges are strictly validated (`sanitizeGitRef()`) to prevent flag injection (leading `-`) and argument metacharacter abuse.
* **Filesystem & Symlink Containment**: Untracked file inspection checks filesystem `realpath` resolution to verify that files and symlink targets strictly reside within the repository root before reading.
* **Terminal Output Sanitization**: Content from untrusted repository diffs, filenames, and snippets is sanitized before printing to strip ANSI cursor-positioning codes, OSC sequences, carriage returns, and Unicode Bidi override controls.
* **Bounded Resource Consumption**: Untracked file processing is capped at 500 files; individual file reads are capped at 5MB; process buffers are bounded; diff lines are truncated to 2,000 characters before regex evaluation to avoid catastrophic backtracking (ReDoS).
* **Zero Runtime Dependencies**: The published package has 0 runtime npm dependencies, reducing third-party supply-chain exposure.

---

## 2. Verification Boundary (`wtf verify`)

`wtf verify` executes detected project verification commands (such as `npm test`, `cargo test`, `pytest`, or `go test`).

* **Runs locally with current user permissions.**
* **Not sandboxed**: WTF does not provide an isolated container, VM, or syscall sandbox for test execution.
* **Trust requirement**: Running test suites inherently executes project-defined code (e.g. `scripts.test` in `package.json` or Python test scripts).
* **Usage guidance**: **Only run `wtf verify` on code you trust to execute.**

---

## 3. Residual Risks

1. **Project Code Execution Under `wtf verify`**: Running test runners executes repository-controlled code. Users must exercise caution before verifying untrusted pull requests or repositories.
2. **Host Environment Vulnerabilities**: Vulnerabilities in the host Git installation, Node.js runtime, or operating system kernel could potentially be exploited by malicious repository structures.
3. **Build and Publishing Pipeline**: While WTF has zero runtime dependencies, build-time dependencies (`typescript`, `esbuild`, `vitest`) and npm registry infrastructure remain part of the overall supply chain.
4. **No Guarantee of Software Correctness**: WTF is an evidence ledger, not a proof engine. Passing tests or a clean receipt does not prove software is bug-free, safe, or correct.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

---

## Reporting Vulnerabilities

If you identify a security issue, unintended execution vector, or containment failure, please report it responsibly:

* **Email**: security@agent-wtf.org (or open a confidential GitHub Security Advisory).
* Please include reproduction steps and sample repository context.
