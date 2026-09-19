# Security Policy

WTF is designed from the ground up as a **zero-trust, local-first developer tool**.

## Security Architecture & Guarantees

1. **Zero Network Communication**: WTF contains zero network calls, telemetry, tracking, or remote phone-home mechanisms. It functions entirely offline.
2. **Zero Shell Evaluation**: All Git commands execute via direct binary invocations (`child_process.spawnSync` with `shell: false`). Arguments and references are strictly whitelisted and validated against flag and command injection.
3. **Zero Runtime Dependencies**: WTF is built with 0 runtime npm dependencies. It is completely immune to third-party npm package compromises.
4. **Path Boundary Enforcement**: All file operations strictly enforce that paths resolve within the repository root to prevent directory traversal (`../../`).
5. **Read-Only by Default**: The default command (`wtf`) never executes project code or modifies files. Test execution is only performed when explicitly requested via `wtf verify`.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in WTF, please report it responsibly:

- **Email**: security@agent-wtf.org (or open a confidential GitHub Security Advisory).
- Please include steps to reproduce, the environment details, and sample repository/diff content.
- We aim to acknowledge security reports within 24 hours and issue a fix within 48 hours.
