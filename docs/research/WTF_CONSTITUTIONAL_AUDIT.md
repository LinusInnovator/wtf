# WTF Constitutional Implementation Audit

**Audit Date**: September 21, 2026  
**Scope**: Complete codebase of WTF (`src/`) audited against `WTF_RESEARCH_STATE.md` and `WTF_EVIDENCE_PROTOCOL_V0.md`.  
**Question**: *Which parts of WTF were built before we understood what WTF is?*

---

## Executive Summary

WTF is undergoing an architectural transition:
- **What WTF Was Conceived As**: A local developer CLI tool that combines Git change summaries with heuristic static regex detectors and automated test invocation for a quick terminal receipt.
- **What Research Has Revealed WTF To Be**: A strict, deterministic evidence and perception layer that represents state transitions across five primitives (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`), enabling humans and agents to perceive software reality without spending probabilistic intelligence reconstructing deterministic facts.

This audit inspects the current codebase against our constitutional research principles. **No code has been altered or repaired in this task.** The findings are cataloged below, prioritized by how fundamentally they conflict with WTF's research direction.

---

## 1. Prioritized Constitutional Findings

### Finding 1: Heuristic Verification Discovery Converts Weak Structural Clues into Invasive Execution
- **Current behavior**: When discovering verification targets in Python, if a directory named `tests` exists anywhere in the repository root, WTF registers `pytest` with zero arguments as the verification command.
- **Relevant code**: [`src/verify/runner.ts:81-94`](file:///Users/linus/Projects/WTF/src/verify/runner.ts#L81-L94)
- **Relevant research principle**: *Epistemic Invariant: Every factual statement emitted by WTF must have deterministic provenance or be represented as UNKNOWN. WTF MUST NOT infer execution contracts from ambiguous hints.*
- **Evidence**: In Omnicap ([Observation 01](file:///Users/linus/Projects/WTF/docs/research/observations/01_omnicap_heterogeneous_repo.md)), a generic `tests/` directory triggered bare `pytest`, which traversed into subpackages (`Skills/FastMetal`), triggered gated Hugging Face model downloads, and hung until killed by a 120s timeout.
- **Classification**: **POSSIBLE VIOLATION**
- **Why it matters**: WTF broke its constitutional contract by turning an ambiguous structural clue into an invasive, side-effect-bearing system execution. In monorepos or polyglot repositories, running an unconfigured root command can trigger network access, hardware initialization, or destructive scripts.
- **Possible direction** *(hypothesis only)*: Verification commands should be explicitly declared (or validated through definitive configuration files like `pyproject.toml` with explicit test sections). If command discovery is ambiguous, verification status must be reported as `UNKNOWN` rather than guessed.
- **Confidence**: HIGH

---

### Finding 2: Inappropriate Error Classification: Invocation Failures and Timeouts Marked as `VERIFIED` Tests
- **Current behavior**: When a verification command fails to execute, is killed by timeout (`120000ms`), or exits with a non-zero exit code, `runVerification` assigns it `status: 'FAILED'` and `tier: 'VERIFIED'`.
- **Relevant code**: [`src/verify/runner.ts:158-200`](file:///Users/linus/Projects/WTF/src/verify/runner.ts#L158-L200)
- **Relevant research principle**: *WTF Evidence Protocol v0: Section on VERIFICATION vs. INVOCATION. A passing or failing check proves only that the executed check ran. If a command cannot execute or times out, the test suite was NOT verified.*
- **Evidence**: In Omnicap, a 120-second network hang resulted in `status: 'FAILED', tier: 'VERIFIED'`. In the forensic analysis of 14 failure events ([Report 05](file:///Users/linus/Projects/WTF/docs/research/experiments/05_forensic_trajectory_analysis.md)), models were misled when a missing test target or runner failure was reported as a test failure rather than an invocation failure.
- **Classification**: **POSSIBLE VIOLATION**
- **Why it matters**: Conflating "the tool could not run / timed out" with "the software under test failed verification" generates false negatives and misleads agents into modifying working code to fix a harness or environment failure.
- **Possible direction** *(hypothesis only)*: Separate `invocation` status (`SUCCESS` vs `FAILED` vs `TIMEOUT`) from `verification` outcome (`PASSED` vs `FAILED`). A timed-out or unspawnable command should yield `VERIFICATION (status: UNRESOLVED / TIMEOUT)` with tier `UNKNOWN`, not `VERIFIED`.
- **Confidence**: HIGH

---

### Finding 3: Exit-Code Coupling to Static Heuristics Traps Coding Agents (`PAY ATTENTION` as Failure)
- **Current behavior**: In `wtf check`, the CLI exits with code `1` if any item under `payAttention` has severity `CRITICAL`.
- **Relevant code**: [`src/cli.ts:89-94`](file:///Users/linus/Projects/WTF/src/cli.ts#L89-L94) and [`src/detectors/auth.ts:49-52`](file:///Users/linus/Projects/WTF/src/detectors/auth.ts#L49-L52)
- **Relevant research principle**: *WTF observes. The agent reasons and acts. Humans decide. WTF MUST NOT choose coding strategy or declare completion.*
- **Evidence**: `src/detectors/auth.ts` flags any added line containing `expiresIn` or `maxAge` as `severity: 'CRITICAL'`. If an agent's assigned task is to modify a token expiry, `wtf check` exits with code 1. According to `AGENTS.md` ("If [PAY ATTENTION] -> fix issues"), the agent is trapped: it cannot complete its task because WTF treats an intentional change as an exit-code failure.
- **Classification**: **POSSIBLE VIOLATION**
- **Why it matters**: WTF conflates *surfacing risk for human review* with *automated task failure*. Exit code 1 should indicate that verification checks failed or WTF crashed, not that an agent touched a sensitive file.
- **Possible direction** *(hypothesis only)*: Decouple agent completion from static risk notices. Static findings should inform the human review receipt under `ATTENTION` without triggering a process exit failure, unless an explicit hard gate is requested by configuration.
- **Confidence**: HIGH

---

### Finding 4: Core CLI Engine Still Uses Pre-Protocol Data Model (Missing the Five Primitives)
- **Current behavior**: The main pipeline ([`src/core/evidence.ts`](file:///Users/linus/Projects/WTF/src/core/evidence.ts)) structures repository reality as `{ receipt: { repo, change, payAttention, verification, files }, alsoSummary }`. The Five Primitives (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`) defined in Protocol v0 are implemented only in the separate compiler prototype ([`src/core/evidence-compiler.ts`](file:///Users/linus/Projects/WTF/src/core/evidence-compiler.ts)) and experimental harnesses.
- **Relevant code**: [`src/types.ts:60-75`](file:///Users/linus/Projects/WTF/src/types.ts#L60-L75), [`src/core/evidence.ts:12-115`](file:///Users/linus/Projects/WTF/src/core/evidence.ts#L12-L115)
- **Relevant research principle**: *WTF Evidence Protocol v0: Reality is represented using exactly five primitives. No informal side categories.*
- **Evidence**: The core CLI emits categories like `PAY ATTENTION`, `ALSO`, `OBSERVED`, and `VERIFIED` as ad-hoc data structures rather than instances of `CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, and `UNKNOWN`.
- **Classification**: **LEGACY ASSUMPTION**
- **Why it matters**: Future development on the CLI is maintaining a legacy 2024 CLI data model that diverges from the validated 2026 research protocol. This prevents the CLI from benefiting from the Action → Reality Delta representation tested in the Context Ablation and Capability Frontier experiments.
- **Possible direction** *(hypothesis only)*: Refactor the internal analysis pipeline so that all detectors and verifiers emit strict Protocol v0 primitive instances, and formatters render views directly from those five primitives.
- **Confidence**: HIGH

---

### Finding 5: Static Detectors Rely on Brittle Keyword Regexes Rather Than Deterministic Syntax or Graph Relationships
- **Current behavior**: Detectors in `src/detectors/` (auth, db, deps, env, hygiene, workflows) scan diff lines using regular expressions like `/(^|\/)auth/i`, `/(^|\/)session/i`, `/\b(jwt|token|passport)\b/`.
- **Relevant code**: [`src/detectors/auth.ts:4-15`](file:///Users/linus/Projects/WTF/src/detectors/auth.ts#L4-L15), [`src/detectors/db.ts:4-14`](file:///Users/linus/Projects/WTF/src/detectors/db.ts#L4-L14)
- **Relevant research principle**: *Deterministic provenance: A tool reporting something does not make the underlying semantic claim independently true.*
- **Evidence**: Adding a comment `// this is not an auth token` triggers an `auth-secret` warning. Modifying an unrelated variable named `role` in a game codebase triggers a `permission-bypass` warning.
- **Classification**: **LEGACY ASSUMPTION**
- **Why it matters**: Brittle keyword matching generates false positives, noise, and token bloat. In large diffs ([Observation 02](file:///Users/linus/Projects/WTF/docs/research/observations/02_large_diff_pressure.md)), regex alarms overwhelm human and agent attention.
- **Possible direction** *(hypothesis only)*: Replace generic string regexes with structural deterministic indicators (e.g. AST file classifications, actual package import changes, manifest additions) or explicitly scope detectors to verified language parsers.
- **Confidence**: MEDIUM-HIGH

---

### Finding 6: Fixed 8-File Diff Truncation Fails Under Large Agent Workloads
- **Current behavior**: In `src/formatters/agent.ts`, when more than 8 files are changed, WTF prints the first 8 and truncates all remaining files with `... and N more files`.
- **Relevant code**: [`src/formatters/agent.ts:90-97`](file:///Users/linus/Projects/WTF/src/formatters/agent.ts#L90-L97)
- **Relevant research principle**: *Evidence Compression without Semantic Loss.*
- **Evidence**: In Omnicap ([Observation 02](file:///Users/linus/Projects/WTF/docs/research/observations/02_large_diff_pressure.md)), 225 files were changed. 217 files disappeared into an ellipsis, completely hiding the distribution and nature of the modifications from both agent and human.
- **Classification**: **LEGACY ASSUMPTION**
- **Why it matters**: Arbitrary head-truncation drops deterministic data without compression. An agent cannot know what changed in files 9 through 225.
- **Possible direction** *(hypothesis only)*: Group changes by package/subsystem or file category (e.g. tests, source, configuration, generated) with line counts rather than a flat, arbitrary 8-item slice.
- **Confidence**: HIGH

---

### Finding 7: Formatter Renders Mixed Results Under `## FAILED` Header
- **Current behavior**: If two checks run (e.g. `tests` and `lint`) and `tests` passes while `lint` fails, `src/formatters/agent.ts` outputs `## FAILED` as the top-level section and nests `✓ tests: passed` inside it. The `## VERIFIED` header is suppressed entirely.
- **Relevant code**: [`src/formatters/agent.ts:21-26`](file:///Users/linus/Projects/WTF/src/formatters/agent.ts#L21-L26)
- **Relevant research principle**: *Clear separation of epistemic tiers.*
- **Evidence**: Visual inspection of agent markdown output during mixed-target runs.
- **Classification**: **LEGACY ASSUMPTION**
- **Why it matters**: Presenting passing checks under a `## FAILED` header causes ambiguity for LLM parsers and human reviewers about whether the passing check was actually verified.
- **Possible direction** *(hypothesis only)*: Separate passing checks under `## VERIFIED` and failing checks under `## FAILED`, or format each target with its individual tier and status.
- **Confidence**: HIGH

---

### Finding 8: Git Porcelain Status and Diff Accounting are Strictly Grounded
- **Current behavior**: Change tracking queries Git via `status --porcelain`, reads hunks line-by-line, tracks untracked files, and calculates net meaningful lines excluding whitespace and comments.
- **Relevant code**: [`src/core/git.ts:47-150`](file:///Users/linus/Projects/WTF/src/core/git.ts#L47-L150)
- **Relevant research principle**: *Deterministic provenance: Grounding in concrete system state.*
- **Evidence**: Line-by-line parity audit in [Report 08](file:///Users/linus/Projects/WTF/docs/research/experiments/08_information_parity_audit.md).
- **Classification**: **ALIGNED**
- **Why it matters**: This is one of the cleanest components of WTF; it provides unassailable ground truth about repository modifications.
- **Possible direction**: Preserve and build upon this core.
- **Confidence**: HIGH

---

### Finding 9: Explicit `UNKNOWN` Intent Boundary in Agent Formatter
- **Current behavior**: Agent output ends with an explicit `## UNKNOWN` declaration stating that passing checks prove only that executed tests ran, not that user requirements or intent are satisfied.
- **Relevant code**: [`src/formatters/agent.ts:118-129`](file:///Users/linus/Projects/WTF/src/formatters/agent.ts#L118-L129)
- **Relevant research principle**: *WTF MUST NOT declare task completion or requirement correctness from passing checks. Epistemic humility.*
- **Evidence**: Successfully grounded weaker models and prevented hallucinated claims in the Qwen3-4B and smolcoder evaluations ([Report 02](file:///Users/linus/Projects/WTF/docs/research/experiments/02_qwen3_4b_substitution.md), [Report 03](file:///Users/linus/Projects/WTF/docs/research/experiments/03_smolcoder_evidence_compilation.md)).
- **Classification**: **ALIGNED**
- **Why it matters**: This single invariant prevents coding agents from making unsupported claims of victory when existing test suites do not exercise the changed code.
- **Possible direction**: Preserve as an immutable contract.
- **Confidence**: HIGH

---

## 2. The Architectural Retrospective

### Question 1: If WTF had been designed from scratch today, knowing everything these experiments taught us, which existing behaviors would we choose not to build?

**The Smallest Defensible Answer**:
1. **We would not build speculative, unconfigured verification guessing.**
   We would not guess `pytest` without arguments merely because a folder named `tests` exists. If the repository lacks an explicit, unambiguous test configuration, WTF would report verification capability as `UNKNOWN` rather than running speculative commands that can hang, download remote weights, or crash.
2. **We would not build keyword-based regex detectors with `CRITICAL` exit-code gating.**
   We would not flag strings like `expiresIn` with regexes and force `process.exit(1)`. This turns an evidence engine into an opinionated, brittle linter that traps agents attempting legitimate work.
3. **We would not build arbitrary 8-file diff slicing.**
   We would not truncate large change surfaces with `... and 217 more files`.
4. **We would not conflate invocation failure with test verification.**
   A missing binary, invalid argument, or 120s timeout would never be reported as `status: 'FAILED', tier: 'VERIFIED'`.

---

### Question 2: Does the current implementation still behave primarily like a Git/test CLI with accumulated heuristics, or has its implementation actually caught up with the emerging deterministic-perception architecture?

**Critical, Unvarnished Answer**:

> **The current implementation in `src/` still behaves primarily like a 2024 developer CLI with accumulated heuristics, while the 2026 deterministic-perception architecture exists almost entirely in the research reports, protocol specs, and experimental harness prototypes.**

Specifically:
- The core CLI engine in [`src/core/evidence.ts`](file:///Users/linus/Projects/WTF/src/core/evidence.ts) and [`src/types.ts`](file:///Users/linus/Projects/WTF/src/types.ts) still operates on an ad-hoc schema (`payAttention`, `alsoSummary`, `verification`, `isMechanical`) designed for terminal display.
- The **Five Primitives** (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`) that proved capable of shifting the model capability frontier from 30B down to 8B are currently isolated in [`src/core/evidence-compiler.ts`](file:///Users/linus/Projects/WTF/src/core/evidence-compiler.ts) and [`scratch/`](file:///Users/linus/Projects/WTF/scratch).
- The discovery logic in `src/verify/runner.ts` is still vulnerable to catastrophic monorepo/polyglot misfires (as proven by Omnicap).
- The exit-code semantics in `src/cli.ts` still attempt to enforce behavioral opinions rather than clean epistemic evidence.

**Conclusion**: WTF's research has far outpaced its product implementation. Before adding new product features or expanding agent integrations, WTF's core engine must be brought into constitutional alignment with WTF Evidence Protocol v0.
