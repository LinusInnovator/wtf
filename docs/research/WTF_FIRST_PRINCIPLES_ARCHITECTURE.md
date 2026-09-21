# WTF — First-Principles Architecture

**Document Type**: Architectural Specification & Design Record  
**Status**: FROZEN ARCHITECTURAL BASELINE (Step 4 Completed)  
**Date**: September 21, 2026  
**Prerequisites**: [`WTF_RESEARCH_STATE.md`](WTF_RESEARCH_STATE.md), [`WTF_EVIDENCE_PROTOCOL_V0.md`](WTF_EVIDENCE_PROTOCOL_V0.md), [`WTF_CONSTITUTIONAL_AUDIT.md`](WTF_CONSTITUTIONAL_AUDIT.md)

---

## 1. Executive Conclusion

If WTF were designed from scratch today, armed with the findings of ten controlled experiments, thirty preserved agent trajectories, and real-world dogfood failures, **WTF would not be built as an opinionated terminal linter that guesses test commands and gates exit codes on keyword regexes.**

Instead:
> **WTF is a deterministic evidence compiler and perception layer for software work.**
> It observes software state transitions, executes explicitly verified checks, establishes mechanical relationships, and compiles those facts into a canonical five-primitive model (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`).
>
> **WTF observes. The agent reasons and acts. Humans decide.**

### The Core Realization
The experimental record demonstrated that probabilistic models fail not because they lack code-generation ability, but because they waste context and reasoning capacity reconstructing deterministic facts that can be computed mechanically in microseconds.

However, we must strictly separate **empirical observation** from **design hypothesis**:
- **Empirically Observed**: Under Condition D (stripped exploratory tools + structured Delta perception), an 8B model matched the 30B MoE model's viability envelope (80% success) while reducing tokens by 30.7% and costs by 40.6% on tested tasks ([Report 10](experiments/10_capability_frontier.md)).
- **Mechanically Established**: A regex or diff parser can establish spatial coordinate intersection between diagnostics and git hunks with zero LLM inference ([Report 08](experiments/08_information_parity_audit.md)).
- **Hypothesis (Not Proven Generally)**: That deterministic perception universally shifts the capability frontier across all SWE-bench tasks. (Condition D changed multiple variables simultaneously: it removed bash noise, prevented directory wandering, and provided structured deltas).
- **Design Choice**: Adopting the Five Primitives as the canonical internal substrate rather than an ad-hoc CLI JSON schema.
- **Unknown**: Whether persistent, multi-turn stateful perception in an agent daemon outperforms stateless turn-by-turn deltas.

WTF's architecture must reflect these boundaries. It must never promote weak evidence into strong assertions, and it must never guess what it cannot deterministically observe.

---

## 2. Constitutional Principles

The architecture adheres to four core constitutional principles:

1. **Principle of Responsibility**:
   *WTF observes. The agent reasons and acts. Humans decide.*
   In the canonical evidence core, WTF does not suggest code changes, does not infer intent as established fact, does not autonomously repair files, and does not declare that a task is complete.
2. **Principle of Provenance**:
   *Every factual statement emitted by WTF must either have deterministic provenance or be represented as `UNKNOWN`.*
   WTF’s canonical evidence core must not use probabilistic intelligence where deterministic evidence is sufficient. Probabilistic capabilities are not part of the current evidence core; if an observation cannot be verified by a deterministic sensor (Git, filesystem, compiler, process execution), it is represented as `UNKNOWN`. Future optional consumer layers are not constitutionally prohibited if later evidence justifies them, but they must never silently weaken provenance or epistemic boundaries.
3. **Principle of Epistemic Humility**:
   *Passing checks prove only that the executed tests ran and exited 0. They never prove user intent alignment, task correctness, or the absence of bugs.*
4. **Principle of Separation**:
   *Evidence ("What happened?") must remain strictly decoupled from Policy ("Is this acceptable? Should the process exit 1? What should be done next?").*

---

## 3. Canonical Evidence Model: The Five Primitives

WTF's internal representation is not a collection of ad-hoc summary strings. It is a strictly typed evidence graph comprising **exactly five canonical primitives**.

> [!NOTE]
> **Canonical Status & Falsifiability of the Five Primitives**:
> These five primitives (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`) survived the current ontology falsification work across 14 failure and thrash trajectories and are canonical for Protocol v0. They remain falsifiable: future empirical evidence may demonstrate that the ontology is insufficient. No sixth primitive is added at this stage.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CANONICAL EVIDENCE MODEL                        │
│                                                                        │
│   CHANGE          Mechanically observed state differences              │
│   DIAGNOSTIC      Deterministic reports from external tools/compilers  │
│   RELATION        Spatial and mechanical intersections between items   │
│   VERIFICATION    Deterministic lifecycle outcome of an explicit check │
│   UNKNOWN         First-class declarations of unobserved boundaries    │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Primitive: `CHANGE`
- **Represents**: Discrete modifications to repository files, working tree, or environment between two state boundaries (`STATE_BEFORE` and `STATE_AFTER`).
- **Deterministic Sources**: Git index (`git diff`, `git status --porcelain`), filesystem metadata (mtime, inode, file hashes).
- **Explicitly CANNOT Establish**: Whether the change is correct, whether it satisfies user requirements, or whether it caused a subsequent build failure.
- **Provenance**: Byte-level diffs and filesystem state hashes.
- **Epistemic Status**: `OBSERVED`.
- **Relationship to Other Primitives**: Forms the spatial target for `RELATION` (e.g. diagnostic line coordinates intersecting modified line numbers).

### 3.2 Primitive: `DIAGNOSTIC`
- **Represents**: Explicit findings emitted by tools (compilers, linters, static analyzers, test runners).
- **Deterministic Sources**: Process exit streams (`stdout`, `stderr`) parsed deterministically via formal grammars (e.g. rustc JSON/regex, TypeScript error format, pytest failure snippets).
- **Explicitly CANNOT Establish**: That the diagnostic is the "root cause" of a failure, or that a suggestion emitted by the tool (e.g. `help: consider borrowing here`) is the semantically correct fix.
- **Provenance**: The raw output stream of the emitting tool.
- **Epistemic Status**: `REPORTED` (The fact that rustc reported error E0308 is `OBSERVED`; the semantic correctness of the compiler's suggested fix is `UNKNOWN`).

### 3.3 Primitive: `RELATION`
- **Represents**: Mechanical, spatial, or structural intersections between entities.
- **Deterministic Sources**: Line coordinate math (e.g., diagnostic line 54 falls within git hunk `+52..58`), dependency graph edges, import graph traversal.
- **Explicitly CANNOT Establish**: Semantic causality. (e.g., If file A changed and file B broke, WTF establishes that file B imports file A; WTF does *not* assert "Change in A broke B" unless a formal compiler proof is present).
- **Provenance**: Deterministic coordinate or graph intersection.
- **Epistemic Status**: `MECHANICALLY DERIVED`.

### 3.4 Primitive: `VERIFICATION`
- **Represents**: The execution lifecycle and outcome of an explicit validation check.
- **Deterministic Sources**: Subprocess execution exit codes, signals, process execution duration, and standard output summaries.
- **Explicitly CANNOT Establish**: User intent satisfaction or repository correctness beyond the exact command executed.
- **Provenance**: Direct process lifecycle monitoring (`spawnSync` / `exec`).
- **Epistemic Status**: `VERIFIED` (for executed checks) or `UNKNOWN` (for unrun/ambiguous checks).

### 3.5 Primitive: `UNKNOWN`
- **Represents**: What WTF cannot deterministically prove or what was left unobserved.
- **Deterministic Sources**: System boundary analysis (e.g. tests detected but not run, intent unverified, files uninspected due to binary encoding).
- **Explicitly CANNOT Establish**: Positive facts; it defines the epistemic horizon.
- **Provenance**: Invariant declarations and unresolved references.
- **Epistemic Status**: `UNKNOWN`.

> [!IMPORTANT]
> **No Confidence Scores**: WTF never outputs probabilistic confidence scores (e.g. `confidence: 85%`). A fact is either deterministically established or `UNKNOWN`.
> **No Correlation into Causality**: WTF never claims a change "caused" an error. It claims: `DIAGNOSTIC at src/lib.rs:42 intersects CHANGE hunk at src/lib.rs:40-45`. Causality is an inference reserved for the agent or human.

---

## 4. Evidence vs. Policy Boundary

WTF currently mixes **Evidence** ("What happened in software reality?") with **Policy** ("Is this acceptable? Should the agent stop?").

```
                                  SOFTWARE REALITY
                                         │
                                         ▼
                             [DETERMINISTIC EVIDENCE]
                         (CHANGE, DIAGNOSTIC, RELATION,
                            VERIFICATION, UNKNOWN)
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
          [AGENT PERCEPTION]                          [HUMAN PRESENTATION]
      Compact state transitions,                 Structured receipts, summaries,
      token-dense reality deltas                 meaningful line counts
                   │                                           │
                   ▼                                           ▼
             AGENT DECIDES                               HUMAN DECIDES
```

### The Architectural Separation
1. **The Evidence Core (WTF Engine)**:
   - Contains zero opinions.
   - Emits only the Five Primitives.
   - Does not have a concept of `severity: 'CRITICAL'` or "blocking failure".
   - Does not set exit codes based on file paths.
2. **The Policy Layer (Consumer / Harness / CI Rule)**:
   - Determines what deserves attention or blocking action.
   - *Example*: An organization may establish a policy: "If an auth file changes without an added test, flag for human review."
   - This policy consumes WTF's `CHANGE` and `RELATION` evidence. **WTF is the evidence provider, not the policy enforcer.**

### Concrete Resolution of Existing Conflicts
- **`expiresIn` modified**:
  - *Evidence*: `CHANGE: auth/session.ts modified (+1/-1, line 42: expiresIn: '15m')`.
  - *Legacy WTF*: Flagged as `CRITICAL`, forced process exit code 1, trapped the agent.
  - *First-Principles WTF*: Emits the `CHANGE`. In the human view, a review-tag `[security-surface]` may highlight the modified line for human eyes. Under the evidence model, it does not cause an exit-code failure or tell the agent to stop.

---

## 5. Verification Architecture from First Principles

### 5.1 What Can WTF Truthfully Know About Verification?
WTF cannot guess what command "verifies" arbitrary software. Verification is an active, side-effect-bearing system execution.

We model verification as an explicit **Lifecycle State Machine**:

```
[DISCOVERY] ──> [REQUESTED] ──> [INVOKED] ──> [EXECUTED] ──> [ANALYZED]
     │               │              │             │              │
  UNKNOWN        UNVERIFIED      INVOCATION    EXECUTION      VERIFICATION
  COMMAND         (NOT RUN)       FAILURE       TIMEOUT         OUTCOME
                                (ENOENT, etc) (SIGTERM, etc)   (PASSED/FAILED)
```

WTF distinguishes the following mutually exclusive lifecycle states:
1. **`COMMAND_UNKNOWN`**: No unambiguous verification contract exists. (Status: `UNKNOWN`).
2. **`NOT_RUN`**: Command is known but was not executed. (Status: `UNVERIFIED`).
3. **`INVOCATION_FAILED`**: The command binary could not be spawned (e.g. `ENOENT`, permissions, invalid flags). The test suite was **not** verified. (Status: `INVOCATION_FAILED`, Tier: `UNKNOWN`).
4. **`EXECUTION_TIMEOUT`**: The process was terminated because it exceeded the allotted execution window. Tests did not complete. (Status: `TIMEOUT`, Tier: `UNKNOWN`).
5. **`BUILD_FAILED`**: The compilation or build step failed prior to test execution (e.g. `cargo check` or `tsc` failed). (Status: `BUILD_FAILED`, Tier: `VERIFIED`).
6. **`TESTS_FAILED`**: Test runner executed to completion and reported test failures. (Status: `FAILED`, Tier: `VERIFIED`).
7. **`TESTS_PASSED`**: Test runner executed to completion with zero test failures. (Status: `PASSED`, Tier: `VERIFIED`).
8. **`PARTIAL_EXECUTION`**: Test runner aborted mid-suite or only a subset of targets ran. (Status: `PARTIAL`, Tier: `UNKNOWN`).

> [!CRITICAL]
> **Constitutional Fix**: By principle, a `TIMEOUT` or `INVOCATION_FAILED` is not marked as `status: 'FAILED', tier: 'VERIFIED'`. Calling an interrupted process or unspawnable command a "verified test failure" misrepresents execution state as test suite verification.

### 5.2 Verification Discovery Principle and Candidate Hierarchy

#### The Architectural Principle
> **Weak evidence must not authorize potentially expensive or incorrectly scoped execution. WTF must preserve `UNKNOWN` when it cannot deterministically establish an appropriate verification command and scope.**

#### Candidate Discovery Hierarchy (Design Decision for Step 4 Evaluation)
The exact discovery hierarchy remains a design decision to be implemented and tested, not an established empirical fact. An explicit verification contract is a strong candidate mechanism, while project-declared commands and conservative deterministic discovery may also prove valid:

1. **Tier 1: Explicit Verification Contract / Invocation (Candidate)**:
   The user, agent, or configuration explicitly provides the exact verification command (e.g. `wtf verify -- cargo test --test impls` or explicit CLI flags).
2. **Tier 2: Project-Declared Configuration (Candidate)**:
   The repository defines its verification contract declaratively (e.g. `package.json` `"scripts": { "test": ... }`, `Cargo.toml`, or a dedicated project configuration).
3. **Tier 3: Conservative Deterministic Discovery (Candidate)**:
   Unambiguous, single-ecosystem root manifests where exactly one test runner is configured and verified to exist.
4. **Tier 4: Ambiguous / Polyglot Fallback → `UNKNOWN` (Candidate)**:
   If multiple candidate runners exist, structural evidence is ambiguous (e.g. generic unconfigured `tests/` directory), or execution scope is uncertain, WTF does not guess. It preserves `UNKNOWN`:
   ```markdown
   ## UNKNOWN
   - Verification command: ambiguous or unverified (declare command explicitly or configure verification contract).
   ```

### 5.3 Explaining and Eliminating the Omnicap Failure Class
- **Why Omnicap Happened**: Legacy WTF used structural heuristic guessing (`fs.existsSync('tests')` → run `pytest`). In Omnicap, `tests/` was an unconfigured subfolder; bare `pytest` traversed into unrelated ML model packages, initiated remote network calls, and hung.
- **How First-Principles Architecture Prevents It**:
  1. The architectural principle forbids converting weak structural evidence (`tests/` directory presence) into active execution authorization. In a polyglot repository without unambiguous root configuration, discovery preserves `UNKNOWN`.
  2. If a command hangs or is aborted, it is classified as `TIMEOUT` (`UNKNOWN`), never as a verified test suite outcome.
  3. The Omnicap regression must remain a required acceptance test case for any discovery implementation.

---

## 6. Evidence Without Active Verification

A primary flaw of legacy CLI tools is assuming that inspection always requires executing the repository's test suite.

In many scenarios, agents and humans need to know:
> *"What changed in observable software reality?"*

without incurring a two-minute build or running untrusted test code.

### Separation of Read-Only Observation from Active Verification
- **Observation Mode (`wtf`)**:
  - Purely read-only.
  - Zero subprocess execution outside deterministic local sensors (`git`, filesystem).
  - Collects `CHANGE`, static `DIAGNOSTIC` (if pre-existing logs/caches exist), and surfaces `UNKNOWN` for unexecuted verification.
  - Runtime: < 50ms. Completely safe to run anywhere, anytime.
- **Verification Mode (`wtf check` / `wtf verify`)**:
  - Active execution.
  - Spawns subprocesses according to the Discovery Hierarchy.
  - Compiles `VERIFICATION` evidence and relates failures to `CHANGE` via `RELATION`.

---

## 7. Human WTF vs. Agent WTF: Two Consumers, One Evidence Substrate

```
                       CANONICAL EVIDENCE GRAPH
            (CHANGE, DIAGNOSTIC, RELATION, VERIFICATION, UNKNOWN)
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       [HUMAN PRESENTATION]             [AGENT PRESENTATION]
       - Visual hierarchy               - Zero-ANSI Markdown / JSON
       - Prioritized review surfaces    - Token-dense Reality Deltas
       - Meaningful diff stats          - Coordinate-level relations
       - Human merge receipt            - Invariant UNKNOWN boundaries
```

### What Must Remain Identical Underneath
The underlying evidence substrate is identical across presentations. If an agent receives a report that 2 files changed with +12/-4 lines and 1 test passed, the human CLI must report the exact same line counts, changed hunks, and test outcomes. The difference is purely in presentation and density:

1. **The Human Interface**:
   - Focus: **"What just happened?"**
   - Emphasizes cognitive scannability: net meaningful lines, security-sensitive file tags, clear pass/fail status, and a one-line shareable receipt.
2. **The Agent Interface**:
   - Focus: **"What changed in observable software reality after my action?"**
   - Emphasizes token efficiency and precision: exact changed line numbers, compiler error codes, spatial hunk intersections, and explicit `UNKNOWN` boundaries that stop hallucinated claims of completion.

### Forward Compatibility for Stateful Agent Perception
While current experiments evaluate single-turn deltas, the canonical evidence model naturally supports an eventual persistent agent perception daemon:
- A daemon simply tracks `STATE_BEFORE` and `STATE_AFTER` across successive tool calls.
- By defining `CHANGE` as a transition between two snapshot hashes, WTF is ready for continuous perception without requiring an architectural rewrite.

---

## 8. "Why Not Just Git?"

A rigorous architecture must justify its existence beyond standard tooling.

```
┌─────────────────┐       ┌────────────────────────┐       ┌─────────────────┐
│       GIT       │       │          WTF           │       │  PROJECT TOOLS  │
│                 │       │                        │       │ (rustc, pytest) │
│ - Commit graph  │──────▶│ - Correlates diffs     │◀──────│ - Emit errors   │
│ - Raw diffs     │       │   with tool diagnostics│       │ - Run test suites│
│ - Tracked trees │       │ - Epistemic tiers      │       │ - Process exit  │
│                 │       │ - Token compression    │       │                 │
│                 │       │ - Reality Deltas       │       │                 │
└─────────────────┘       └────────────────────────┘       └─────────────────┘
```

### What Git Establishes
- Exact file content modifications across commits and working tree.
- Author, timestamp, branch, and commit lineage.

### What Git CANNOT Represent
1. **Tool Diagnostics**: Git does not know that line 54 in `src/impls.rs` failed rustc compilation with E0308.
2. **Verification Reality**: Git does not know whether the test suite passed, failed, timed out, or was never executed.
3. **Spatial Relationship Compilation**: Git cannot compute the intersection between compiler diagnostics and modified hunks.
4. **Epistemic Boundaries**: Git has no concept of `UNKNOWN` or unrun verification suites.
5. **Noise Filtering**: Git treats mechanical lockfile updates and binary blobs with the same priority as core logic changes.

### The True Framing
> **Git is one of WTF's primary sensors.**
> *Git records changes to repository state. WTF compiles evidence about observable software reality.*

If all a user wants is a raw patch, they should use `git diff`. When an agent or human needs to know whether an action broke the build, what tests actually ran, and what files intersect compiler errors, they need WTF.

---

## 9. Large-Change Evidence Density Requirements

In Omnicap, an agent-generated PR modified **225 files with +38,355 lines**. Legacy WTF printed 8 files and hid the remaining 217 behind `... and 217 more files`. This is an unacceptable loss of evidence.

### Established Requirement
> **WTF must scale to large changes without silently discarding relevant evidence, optimizing useful evidence density per token.**

The Omnicap observation establishes that collapsing 225 files to 8 visible files destroys too much information. It does **not** establish that "hierarchical subsystem clustering" is the uniquely correct solution.

- **`UNKNOWN`**: The optimal deterministic compression and grouping strategy for large change surfaces remains an open research and design question.

### Candidate Strategies for Evaluation in Step 4
1. **Avoid Arbitrary Head-Truncation**:
   WTF should avoid simply slicing the first $N$ items and discarding the rest with an opaque ellipsis without structural accounting.
2. **Candidate: Structural Subsystem / Package Clustering**:
   Evaluate grouping modified files by package/subsystem boundaries (e.g. `crates/parser`, `packages/ui`) and mechanical categories. This is a candidate design hypothesis requiring separate empirical validation.
3. **Candidate: Path-Tree / Change-Density Summaries**:
   Evaluate directory-tree summaries or topological diff density metrics.
4. **Token Density Budgeting**:
   The representation should adapt its verbosity to remain within a predictable token envelope (e.g. < 500 tokens for agent view) while preserving accurate accounting across all modified surfaces.
5. **Preserve Mechanical Filtering**:
   Lockfiles (`package-lock.json`, `Cargo.lock`) and generated artifacts must continue to be segregated from logic changes so mechanical volume does not crowd out critical review surfaces.

---

## 10. Audit & Disposition of Legacy Concepts

Every legacy concept in `src/` is audited and assigned a first-principles disposition:

| Concept | Current Location | Disposition | First-Principles Reason |
| :--- | :--- | :--- | :--- |
| **`payAttention`** | `src/core/evidence.ts` | **REMOVE** | Conflates objective evidence with subjective policy/alarmism. Replaced by structural `CHANGE` and `DIAGNOSTIC` tags. |
| **`alsoSummary`** | `src/core/evidence.ts` | **REMOVE** | Unstructured bucket for miscellaneous string items. Replaced by typed `RELATION` and `CHANGE` summaries. |
| **`detectors/*`** | `src/detectors/` | **REDESIGN** | Brittle regex string matching must be replaced by structural deterministic file/manifest analyzers. |
| **`severity / CRITICAL`** | `src/types.ts` | **REMOVE** | Opinions about severity belong to external policy or human reviewers, not the core evidence engine. |
| **Exit-Code Gating** | `src/cli.ts` | **REDESIGN** | CLI must exit 1 ONLY when active verification fails or WTF errors. Never for static detection of sensitive files. |
| **Verification Discovery** | `src/verify/runner.ts` | **REDESIGN** | Eliminate heuristic guessing. Implement and test candidate discovery hierarchy anchored by explicit contracts; must pass Omnicap regression. |
| **Auto Verification** | `src/verify/runner.ts` | **MOVE** | Active execution must be decoupled from passive observation. Default `wtf` must be strictly read-only. |
| **Timeout Behavior** | `src/verify/runner.ts` | **REDESIGN** | Timeouts must yield `status: 'TIMEOUT', tier: 'UNKNOWN'`. Never classify as `status: 'FAILED', tier: 'VERIFIED'`. |
| **Test Detection** | `src/detectors/tests.ts` | **KEEP** | Tracking added, removed, and skipped tests (`it.skip`, `#[ignore]`) is clean, deterministic diff observation. |
| **Mechanical Classifier** | `src/core/classifier.ts` | **KEEP** | Essential sensor for filtering noise (lockfiles, build artifacts, snapshots) from human/agent review. |
| **Diff Truncation** | `src/formatters/agent.ts`| **REDESIGN** | Replace flat 8-file head truncation with an evidence-density strategy (candidate: subsystem/category grouping) to be validated in Step 4. |
| **Agent Formatter** | `src/formatters/agent.ts`| **REDESIGN** | Align output strictly with the Five Primitives (`WTF Evidence Protocol v0`). |
| **Human Formatter** | `src/formatters/terminal.ts`| **REDESIGN** | Render views directly from the canonical evidence model rather than legacy ad-hoc structures. |
| **JSON Receipt** | `src/formatters/json.ts` | **REDESIGN** | Update schema from `wtf/0.1` to strict Protocol v0 Five-Primitive JSON. |
| **`wtf` (default command)**| `src/cli.ts` | **KEEP** | Pure read-only inspection of what just changed in observable reality. |
| **`wtf check`** | `src/cli.ts` | **KEEP** | Single-turn agent verification contract (executes verification + diff inspection). |
| **`wtf verify`** | `src/cli.ts` | **KEEP** | Active verification runner. |
| **`wtf show`** | `src/cli.ts` | **KEEP** | Detailed drill-down into specific hunks and diagnostics. |
| **`wtf init-agent`** | `src/cli.ts` | **KEEP** | Agent instruction generator for `.cursorrules`, `AGENTS.md`, etc. |
| **Evidence Compiler** | `src/core/evidence-compiler.ts` | **MOVE TO CORE** | Promoted from prototype to the canonical core evidence compiler. |
| **Evidence Protocol v0**| `docs/research/` | **CANONICAL SPEC** | The authoritative specification governing all internal and external schemas. |

---

## 11. Proposed Architecture & Data Flow

```
                                  SOFTWARE REALITY
             ┌───────────────┬─────────────────┬──────────────┐
             │               │                 │              │
        Git Index       Filesystem        Compilers &     Active Test
       & Porcelain       Metadata        Tool Streams      Execution
             │               │                 │              │
             └───────┬───────┴─────────┬───────┴──────────────┘
                     │                 │
                     ▼                 ▼
          [PASSIVE SENSORS]       [ACTIVE SENSORS]
          (Git, Filesystem,       (Process Runner,
           AST Classifiers)        Compiler Parsers)
                     │                 │
                     └────────┬────────┘
                              │
                              ▼
                  ┌────────────────────────┐
                  │    CANONICAL CORE      │
                  │   EVIDENCE COMPILER    │
                  └────────────────────────┘
                              │
                              ▼
                  [CANONICAL EVIDENCE GRAPH]
                   • CHANGE
                   • DIAGNOSTIC
                   • RELATION
                   • VERIFICATION
                   • UNKNOWN
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
   [POLICY ENGINE]     [AGENT VIEW]         [HUMAN VIEW]
  (External Rules,   (Reality Deltas,     (Token-dense UI,
   CI Gates, etc.)    Token-Dense Spec)    Receipts, Diffs)
```

### Component Structure
1. **Sensors Layer (`src/sensors/`)**:
   - `git.ts`: Porcelain status, hunks, branch, commit hashes.
   - `filesystem.ts`: File stats, mtimes, mechanical path matching.
   - `parsers/`: Compiler diagnostic parsers (rustc, tsc, pytest, go) converting streams into `DIAGNOSTIC` instances.
   - `runner.ts`: Safe process runner with timeout and exit signal tracking.
2. **Core Layer (`src/core/`)**:
   - `types.ts`: Formal TypeScript definitions of the Five Primitives.
   - `compiler.ts`: Compiles raw sensor inputs into the Canonical Evidence Graph.
   - `relation.ts`: Computes spatial intersections between diagnostics and hunks.
3. **Formatters Layer (`src/formatters/`)**:
   - `agent.ts`: Emits Protocol v0 Markdown / Delta format.
   - `terminal.ts`: Emits human-readable terminal review.
   - `json.ts`: Emits machine-readable Protocol v0 JSON.
4. **CLI Entrypoint (`src/cli.ts`)**:
   - Dispatches `wtf`, `wtf check`, `wtf verify`, `wtf show`. Handles exit codes based strictly on verification success.

---

## 12. Falsification Analysis: Testing the Architecture

We stress-test this proposed architecture against 13 concrete failure and edge cases:

| Case | Scenario | What WTF Can Deterministically Establish | What Remains UNKNOWN | Result & Architecture Defense |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Simple JS Repo | `package.json` scripts, git diff, `npm test` exit code & summary. | User intent correctness. | **PASS**: Clean Tier 2 discovery, zero ambiguity. |
| **2** | Rust Repo | `Cargo.toml` manifests, rustc diagnostics intersected with diff hunks. | Causal relationship between warnings. | **PASS**: Proven by smolcoder experiments. |
| **3** | Python Repo | Explicit `pyproject.toml` pytest execution; test failure trace. | Test coverage completeness. | **PASS**: Clean Tier 2 discovery when configured. |
| **4** | Heterogeneous Repo (Omnicap) | Multiple ecosystems detected; refuses to guess bare `pytest`. | Verification status (`AMBIGUOUS`). | **PASS**: Eliminates the Omnicap runaway hang class. |
| **5** | Monorepo | Scopes changes to touched subpackages; runs package-local checks. | Unrun workspace packages. | **PASS**: Structural boundaries preserved. |
| **6** | No Test Command | Git changes, mechanical status, zero test runner found. | Verification: `NOT CONFIGURED`. | **PASS**: Honest `UNKNOWN` without erroring. |
| **7** | Broken Invocation (`ENOENT`) | Command spawned; returned `ENOENT` / binary missing. | Test suite outcome (`NOT RUN`). | **PASS**: Classified as `INVOCATION_FAILED`, tier `UNKNOWN`. |
| **8** | Execution Timeout | Process ran 120s; killed by `SIGTERM`. | Test suite outcome (`ABORTED`). | **PASS**: Classified as `TIMEOUT`, tier `UNKNOWN`, not `VERIFIED FAILED`. |
| **9** | False-Positive Passing Tests | `tests passed (42/42)`, but changed file was never imported by tests. | Task intent satisfaction. | **PASS**: Explicit `UNKNOWN` boundary stops completion claim. |
| **10**| 225-file / 38k-line PR | Changes summarized within token budget without arbitrary head-truncation. | Optimal deterministic grouping. | **PASS**: Eliminates silent information loss; evaluates candidate clustering. |
| **11**| Deliberate Auth Change | `CHANGE` at `auth/session.ts:42` recorded; tests pass. | Security policy acceptability. | **PASS**: Zero exit-1 gating; agent completes task cleanly. |
| **12**| Per-Action Delta Perception | Computes exact delta between tool call $N$ and $N+1$. | Long-term session intent. | **PASS**: Fits Action → Reality Delta contract. |
| **13**| Human: "What happened?" | Human terminal view shows 3 files changed, 44 tests passed, 1 receipt. | External architectural context. | **PASS**: Instant, clean cognitive grounding. |

---

## 13. Remaining UNKNOWNs

The following questions cannot be answered from current research and require future empirical validation:
1. **Long-Horizon SWE-bench Discovery**: Does Condition D (minimal perception) scale to tasks requiring discovery across hundreds of files, or will agents require an active search primitive?
2. **Optimal Large-Change Compression**: What is the most effective deterministic algorithm for grouping or summarizing 200+ modified files without introducing semantic speculation or losing review context?
3. **Multi-Agent Coordination**: Can WTF receipts serve as a trustless cryptographic/hash-grounded handoff protocol between independent agent tiers?

---

## 14. Explicit Things We Should NOT Build Yet

To preserve research discipline, the following are explicitly **out of scope**:
1. **Probabilistic Intelligence in the Evidence Core**: WTF's canonical evidence core does not use an LLM, embeddings, or semantic summarization. Probabilistic capabilities are outside the current evidence core; any future optional consumer layer must never silently weaken deterministic provenance or epistemic boundaries.
2. **No Stateful Agent Daemon**: Do not build a persistent server/daemon now; keep WTF a lightweight stateless CLI/library until stateful benefits are tested.
3. **Autonomous Code Repair**: Repair/action is outside the canonical evidence core and is explicitly out of scope for the current architecture. The core boundary remains: *WTF observes. The agent reasons and acts. Humans decide.*
4. **No Configurable Warning Policy Engine**: Do not invent a complex DSL or rule engine for custom linting.
5. **No Monorepo Workspace Orchestration**: Do not build a replacement for Turborepo, Nx, or Cargo workspaces.

---

## 15. Proposed Step 4 Implementation Sequence

*(For future execution — DO NOT IMPLEMENT IN THIS TASK)*

When work commences on bringing the codebase into alignment with this architecture, execution should follow an incremental, testable sequence:

1. **Phase 1: Canonical Type Core & Five Primitives**
   - Define formal TypeScript types for `CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, and `UNKNOWN` in `src/types.ts`.
   - Implement the invariant `EvidenceGraph` interface.
2. **Phase 2: Verification Engine Refactoring**
   - Rewrite `src/verify/runner.ts` to implement the strict Verification Lifecycle state machine.
   - Separate `INVOCATION_FAILED` and `TIMEOUT` from `VERIFIED` test outcomes.
   - Test candidate verification discovery hierarchy against the Omnicap regression.
3. **Phase 3: Decouple Evidence from Policy**
   - Remove `severity: 'CRITICAL'` exit-code coupling in `src/cli.ts`.
   - Ensure `wtf check` exits with non-zero only on verified test failures or fatal runtime errors.
4. **Phase 4: Promote Evidence Compiler to Core**
   - Integrate `src/core/evidence-compiler.ts` into the main `analyzeRepo` pipeline.
   - Replace ad-hoc `payAttention` and `alsoSummary` structures.
5. **Phase 5: Large-Diff Density Optimization**
   - Design and validate deterministic representation strategies (evaluating candidate subsystem clustering or path-tree summaries) to scale beyond arbitrary head-truncation without semantic loss.
6. **Phase 6: Update Agent and JSON Formatter to Protocol v0**
   - Align output formats with `WTF Evidence Protocol v0`.

---

## 16. Status: FROZEN FOR STEP 4

**Architecture status: FROZEN FOR STEP 4**

- **Implementation Readiness**: The conceptual boundaries, five-primitive model, verification lifecycle, and evidence-policy separation are sufficient to begin incremental implementation.
- **Canonical Substrate**: Evidence Protocol v0 is the current canonical substrate.
- **Preservation of UNKNOWNs**: Remaining architectural and design unknowns (such as the exact discovery mechanism and optimal large-diff density strategy) stay explicit and must not be silently resolved during implementation.
- **Empirical Revision**: This architecture is grounded in accumulated evidence; future empirical observations may revise or refine it.
