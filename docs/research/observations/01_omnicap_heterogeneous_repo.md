# Observation Record: Inferred Verification Failure in a Heterogeneous Repository (Omnicap)

**Date**: September 2026  
**Context**: Dogfooding WTF on [Omnicap](file:///Users/linus/Projects/WTF) (a large real-world heterogeneous codebase comprising a native Swift/Xcode macOS app with nested Python/ML packages, model execution pipelines, and local skills).  
**Status**: OBSERVED FAILURE / ARCHITECTURAL PRESSURE

---

## 1. Observed Incident

During a verification pass on Omnicap using `wtf check` / `wtf verify`:
1. WTF executed its repository-level heuristic verification discovery ([`src/verify/runner.ts`](file:///Users/linus/Projects/WTF/src/verify/runner.ts#L80-L94)).
2. Discovering a directory named `tests/` in the repository root, WTF inferred that `pytest` (with no arguments, targeting the root) was the valid verification command for the repository.
3. When executed from root without configuration or targeting, bare `pytest` began recursive traversal into unintended subprojects, specifically traversing into `Skills/FastMetal` and ML pipelines.
4. This traversal imported modules that initialized gated/external Hugging Face model downloads and hardware checks requiring authenticated remote assets.
5. Verification hung indefinitely awaiting remote network/model I/O until WTF's hardcoded process timeout (`120000ms` / 2 minutes) killed the child process.

### Observed Receipt Output
The resulting agent-facing receipt was recorded approximately as:

```markdown
WTF-RECEIPT: v0.1 | base:415db84 | PARTIAL (0/1) | ATTENTION (12) | OBSERVED (+38355/-442, 225f)
```

The verification command exited non-zero due to `SIGTERM`/timeout, marking the check as `FAILED` (or `PARTIAL` when other targets timed out or were bypassed), despite no tests having failed for software defect reasons.

---

## 2. The Epistemic Lesson

> [!CRITICAL]
> **The presence of a generic `tests/` directory was insufficient evidence for the repository-level verification command and scope that WTF selected.**

WTF violated its core epistemic rule: it **inferred** an execution contract (`pytest .`) from weak structural evidence (a directory name) without deterministic proof that:
1. `pytest` was installed or intended to be invoked at root.
2. The entire tree fell under a unified test runner.
3. The environment was configured for end-to-end execution without side-effects (e.g. network/model gating).

By converting an ambiguous structural clue into an invasive, expensive, side-effect-bearing system execution, WTF created friction rather than evidence.

---

## 3. The Deeper Architectural Question

**Is WTF converting weak repository evidence into an expensive action?**

In a monorepo or polyglot project:
- File layout heuristics (e.g. presence of `Cargo.toml`, `package.json`, `go.mod`, `tests/`) are local structural indicators, not authoritative global test runner contracts.
- Running speculative commands risks destructive side effects, runaway hangs, network downloads, or un-sandboxed execution.

### Candidate Principle to Evaluate Later
> **Explicit verification declarations should outrank inferred verification, and insufficient evidence may legitimately result in `UNKNOWN`.**

If WTF cannot deterministically prove how a repository verifies itself (e.g., from an explicit repo config or root build specification), the epistemic truth is:
```markdown
## UNKNOWN
- Verification: command discovery ambiguous or unverified
```
Declaring verification status as `UNKNOWN` is honest; guessing an execution command is probabilistic behavior masquerading as deterministic verification.

---

## 4. Candidate Responses (NOT Established Requirements)

The following were discussed as candidate fixes, but are **unverified hypotheses** that must NOT be implemented without controlled evaluation:
- Stricter pytest detection (e.g. requiring `pyproject.toml` with `[tool.pytest]` or `pytest.ini` before running).
- Configurable pytest ignore lists or exclusion paths.
- Explicit configuration via `.wtfrc` or `package.json` fields (`"wtf": { "verify": ... }`).
- Configurable or dynamic timeouts.
- A `--skip-verify` or read-only perception flag for initial checkouts.

None of these candidates are to be implemented during this consolidation. They serve as open design directions for the future perception architecture.
