# Security Policy

WTF is a local-first developer tool designed to inspect software changes and run test suites.

## Security Architecture & Design

1. **No Network Calls**: WTF does not make HTTP/HTTPS network requests, transmit telemetry, or contact remote services. It operates entirely offline.
2. **No Shell Invocations for Git**: Git commands are executed directly via `child_process.spawnSync` (`shell: false`). Arguments are checked to prevent flag and command injection, and baseline Git overrides (`core.fsmonitor=`, `diff.external=`, `core.hooksPath=/dev/null`, `--no-ext-diff`, `--no-textconv`) are enforced to prevent Git from executing repository-configured scripts.
3. **Symlink and Path Containment**: File reading operations verify that canonical realpaths remain within the repository root to prevent reading files outside the repository boundary via symlinks or relative traversals.
4. **Terminal Output Sanitization**: Untrusted repository content (filenames, diff lines, code snippets) is sanitized before display to strip ANSI cursor escapes, OSC sequences, control characters, and Unicode Bidi override controls.
5. **Zero Runtime Dependencies**: The published package contains 0 runtime npm dependencies, reducing third-party supply-chain exposure. (Build-time dependencies include TypeScript, esbuild, and Vitest).

## Trust Boundaries & `wtf verify`

- **Default mode (`wtf`)**: Read-only diff inspection. Designed to run safely on untrusted repositories without executing project code.
- **Verification mode (`wtf verify`)**: Discovers and executes project test and build scripts (such as `npm test`, `cargo test`, `pytest`) directly with the user's permissions. **WTF does not sandbox test runners.** Running `wtf verify` on untrusted repositories will execute repository-defined test scripts. Only run `wtf verify` on code you trust to execute.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security issue or unexpected execution vector in WTF, please report it responsibly:

- **Email**: security@agent-wtf.org (or open a confidential GitHub Security Advisory).
- Please provide reproduction steps and sample repository context.
