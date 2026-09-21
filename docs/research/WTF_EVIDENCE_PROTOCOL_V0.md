# WTF Evidence Protocol v0
**A Minimal Specification for Deterministic Software-Reality Evidence**

```
Status: Experimental Specification (v0)
Scope: Action → Reality Delta Observation
Foundational Axiom: WTF observes. The agent reasons and acts.
```

---

## 1. Core Purpose

The WTF Evidence Protocol answers exactly one question:

> **What changed in observable software reality after an action?**

WTF is an independent evidence engine, not an agent, planner, or code repair tool. It observes software reality, verifies claims against deterministic state, and compiles observable transitions into a strict five-primitive format.

---

## 2. Epistemic Invariant

> **Every factual statement emitted by WTF MUST either:**
> 1. **Have deterministic provenance, or**
> 2. **Be explicitly represented as `UNKNOWN`.**

* No inference may be converted into an asserted fact.
* Uncertainty must never be converted into a convenient default value (e.g. `tests_executed: 0` is forbidden unless zero execution is deterministically observed).
* Passing checks prove only that executed tests ran without error; they never establish task correctness, code quality, or user intent alignment.

### Internal Epistemic Distinctions
Where useful within primitive fields, facts are qualified by provenance:
* **`REPORTED`**: Emitted directly by an external tool or compiler stdout/stderr.
* **`OBSERVED`**: Mechanically measured from the repository environment (e.g. Git working-tree diff, filesystem state).
* **`VERIFIED`**: Established by execution of a deterministic check terminating in a known exit status and harness summary.
* **`UNKNOWN`**: Explicit declaration that the fact is unobserved, ambiguous, or unestablished.

*(Note: These epistemic qualifiers operate as field-level provenance values; they do not form additional top-level primitives.)*

---

## 3. The Action → Reality Delta Envelope

The protocol structures observations as an **Action → Reality Delta**:

```
[ENVELOPE METADATA]
  STATE_BEFORE:  <deterministic state snapshot identifier / git commit / tree hash>
  ACTION:        <tool name & exact parameters dispatched by agent>
  STATE_AFTER:   <deterministic state snapshot identifier / git commit / tree hash>
      │
      ▼
[WTF DELTA (Output contains ONLY the Five Primitives)]
  CHANGE
  DIAGNOSTIC
  RELATION
  VERIFICATION
  UNKNOWN
```

* `ACTION`, `STATE_BEFORE`, and `STATE_AFTER` are envelope metadata defining the transition boundaries. They are **not** evidence primitives.
* The output body of the delta contains strictly and exclusively the five primitives.

---

## 4. The Five Primitives

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           THE FIVE PRIMITIVES                           │
│                                                                         │
│   CHANGE          Mechanically observed state differences               │
│   DIAGNOSTIC      Independently observed tool/compiler error reports    │
│   RELATION        Mechanically established spatial/structural links     │
│   VERIFICATION    Deterministic status of executed validation commands  │
│   UNKNOWN         First-class declarations of unestablished facts       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Primitive 1: `CHANGE`

#### Purpose
Represents mechanically observed differences in software reality between `STATE_BEFORE` and `STATE_AFTER`.

#### Allowed Evidence Sources
* Git working-tree diff / status (`git diff`, `git status --porcelain`).
* Filesystem directory entries, mtime, and file size transitions.

#### Minimum Fields
* `status`: `none observed` OR list of modified entities.

#### Optional Fields
* `file`: Relative path to file.
* `additions`: Count of added lines (`+N`).
* `deletions`: Count of removed lines (`-N`).
* `operation`: `MODIFIED` | `CREATED` | `DELETED` | `RENAMED` | `REJECTED`.

#### MUST NOT Claim
* MUST NOT claim a change is "correct" or "buggy".
* MUST NOT claim a change satisfies user or task intent.
* MUST NOT claim a change caused a subsequent diagnostic.

#### Provenance Requirements
Must be verifiable by re-running diff/status between the two boundary snapshots.

#### Observed Experimental Example
```yaml
CHANGE
src/impls.rs modified (+2 / -2)
```

---

### Primitive 2: `DIAGNOSTIC`

#### Purpose
Represents exact, independently reported diagnostic items emitted by tools, compilers, linters, or execution runtimes.

#### Allowed Evidence Sources
* Exact subprocess `stdout` and `stderr` streams.
* Exit status codes.
* Tool failure return payloads (e.g. file edit mismatch errors).

#### Minimum Fields
* `status`: `none` OR list of diagnostics.
* Per diagnostic: `tool` and `message`.

#### Optional Fields
* `target`: Specific build/test target or package name named in the error.
* `file`: Relative path where the diagnostic occurred.
* `line`: 1-indexed line number.
* `column`: 1-indexed column number.
* `level`: `error` | `warning` | `note` | `help`.

#### MUST NOT Claim
* MUST NOT convert compiler "help" or "suggestions" into WTF recommendations.
* MUST NOT synthesize root cause explanations.
* MUST NOT filter out diagnostics based on speculative relevance.

#### Provenance Requirements
Must match substrings or parsed AST tokens from the literal tool output payload.

#### Observed Experimental Example
```yaml
DIAGNOSTIC
tool: cargo
target: impl_partial_eq_cow
message: no test target named impl_partial_eq_cow
```

---

### Primitive 3: `RELATION`

#### Purpose
Represents **only** mechanically established structural, spatial, or inventory relationships between evidence entities.

#### Allowed Evidence Sources
* Intersection of diagnostic `(file, line)` with `CHANGE` hunk line intervals.
* Intersection of requested CLI target arguments with targets reported by tool output or project manifests.
* Filesystem path existence queries.

#### Minimum Fields
* `status`: `none` OR list of established relation statements.

#### Optional Fields
* `diagnostic_location`: `in changed code` | `in changed file (unchanged line)` | `in unchanged file`.
* `target_inventory`: `target absent from observed tool targets` | `target present in manifest`.
* `filesystem`: `target path exists in working tree` | `target path absent from workspace`.

#### MUST NOT Claim
* MUST NOT claim causal relationship (e.g. "diagnostic caused by edit" or "root cause").
* MUST NOT use subjective proximity terms like "near", "related to", or "likely triggered by".

#### Provenance Requirements
Must be mechanically computable via set intersection or string lookup without statistical or semantic inference.

#### Observed Experimental Example
```yaml
RELATION
requested target impl_partial_eq_cow absent from observed Cargo targets
```

---

### Primitive 4: `VERIFICATION`

#### Purpose
Represents what validation procedure was actually attempted and what mechanical outcome was established.

#### Allowed Evidence Sources
* Invocation command string.
* Process exit status code.
* Deterministic test runner result summaries (e.g. `test result: ok. 183 passed; 0 failed`).

#### Minimum Fields
* `status`: `none` (when action is not a verification command) OR command execution record.

#### Required Fields When Applicable
* `command`: Exact command invoked.
* `invocation`: `VALID` | `FAILED` (distinguishes whether the test runner actually launched or died on CLI/target arguments).
* `compilation`: `VALID` | `FAILED` (when build stage precedes test execution).
* `status`: `PASSED` | `FAILED` (test suite execution outcome).
* `tests_executed`: Integer count OR `UNKNOWN`.

#### Critical Invariants
* **Never emit `tests_executed: 0` unless the runner explicitly reports 0 executed tests** (e.g. `running 0 tests`). If the harness failed to launch or compile, tests executed must be emitted strictly as `UNKNOWN`.
* Passing verification does **not** establish task intent correctness.

#### Provenance Requirements
Traceable to process exit code and parsed harness summary lines.

#### Observed Experimental Example
```yaml
VERIFICATION
command: cargo test --test impl_partial_eq_cow
invocation: FAILED
tests_executed: UNKNOWN
```

---

### Primitive 5: `UNKNOWN`

#### Purpose
Represents first-class, explicit declarations of facts that software reality has **not** established.

#### Allowed Evidence Sources
* Epistemic boundaries inherent to the action and observation scope.

#### Invariant
* `UNKNOWN` is first-class evidence, not an error state.
* It must never be omitted merely because other fields appear reassuring.

#### Standard Unknown Categories
* `intended verification command`: Agent intent is unobservable.
* `project test status`: State of project test suite when invocation or compilation failed.
* `source change correctness`: Passing tests prove only that executed tests ran; correctness remains unverified.
* `intended edit location`: Target string not found in file.

#### Observed Experimental Example
```yaml
UNKNOWN
intended verification command
project test status
source change correctness
```

---

## 5. Compression vs. Perception

The protocol explicitly distinguishes two distinct mechanisms:

```
┌────────────────────────────────────────────────────────────────────────┐
│ COMPRESSION:                                                           │
│ Same information, better representation.                               │
│ • Strips ANSI escapes, progress bars, compiler banners.                │
│ • Extracts structured tokens (tool, target, file, line, message).      │
│ • Derives mechanical properties (invocation validity, test counts).    │
│ • Source: Exclusively tool stdout / stderr / exitCode.                 │
├────────────────────────────────────────────────────────────────────────┤
│ PERCEPTION:                                                            │
│ Additional deterministic observations gathered from environment.       │
│ • Queries working-tree state via Git diff before/after action.         │
│ • Cross-references diagnostic line numbers against changed hunks.      │
│ • Checks file/directory existence in filesystem.                       │
│ • Source: Working tree Git index, filesystem stats, manifest files.    │
└────────────────────────────────────────────────────────────────────────┘
```

**Provenance Invariant**: Every non-UNKNOWN field emitted by WTF must be tagged internally to its source so that COMPRESSION and PERCEPTION are never conflated. Additional sensing must never be disguised as compression.

---

## 6. The Boundary Between WTF and Agent

```
╔════════════════════════════════════════════════════════════════════════╗
║ WTF MAY:                                                               ║
║ • Observe software reality before and after an action.                 ║
║ • Execute explicitly requested verification commands.                  ║
║ • Collect deterministic evidence from tools, Git, and filesystem.      ║
║ • Compress noisy feedback into structured primitives.                  ║
║ • Establish mechanical spatial/inventory relations.                   ║
║ • Expose uncertainty explicitly via UNKNOWN.                           ║
╠════════════════════════════════════════════════════════════════════════╣
║ WTF MUST NOT:                                                          ║
║ • Infer task intent or user requirements.                              ║
║ • Choose the next coding action or plan.                               ║
║ • Recommend fixes or commands.                                         ║
║ • Repair code or touch files autonomously.                             ║
║ • Reason about root cause as an asserted fact.                         ║
║ • Compensate for an agent failing to act.                              ║
║ • Convert uncertainty into confidence or convenient defaults.          ║
║ • Declare task completion from passing checks.                         ║
╚════════════════════════════════════════════════════════════════════════╝
```

### The DELTA Run 4 Boundary Case
In DELTA Run 4 of our experiment:
1. WTF correctly observed and compiled:
   - `CHANGE: src/impls.rs modified (+2 / -2)`
   - `DIAGNOSTIC: target: impl_partial_eq_cow, message: no test target named impl_partial_eq_cow`
   - `RELATION: requested target absent from observed Cargo targets`
   - `VERIFICATION: invocation: FAILED, tests_executed: UNKNOWN`
2. The agent correctly reasoned from this evidence:
   - *"The test target impl_partial_eq_cow does not exist in the project... Use cargo test without specifying a test name to execute all tests."*
3. The agent failed to act:
   - It printed this conclusion in natural language and stopped without issuing the `run_command cargo test` tool call.

**Conclusion**: This was an **agent action failure**, not a WTF perception failure. WTF must not absorb agent execution responsibilities by auto-running commands or nudging agents to act.

---

## 7. Protocol Examples (Derived Strictly from Observed Trials)

### Example 1: Successful Source Code Edit
*(Observed: Task 5, Turn 2)*
```yaml
CHANGE
src/impls.rs modified (+2 / -2)

DIAGNOSTIC
none

RELATION
target file src/impls.rs exists in working tree

VERIFICATION
none

UNKNOWN
source change correctness
```

---

### Example 2: Failed Exact-String Edit
*(Observed: 14B RAW Run 4 / Event 2)*
```yaml
CHANGE
none observed

DIAGNOSTIC
tool: edit_file
message: old_text not found in src/impls.rs

RELATION
target file src/impls.rs exists in working tree

VERIFICATION
none

UNKNOWN
intended edit location
```

---

### Example 3: Compiler Diagnostic in Changed Code
*(Observed: Task 5, Syntax/Type Error Hunk)*
```yaml
CHANGE
none observed

DIAGNOSTIC
tool: cargo
file: src/impls.rs
line: 55
message: mismatched types: expected `&[u8]`, found `bool`

RELATION
diagnostic on changed line 55 in src/impls.rs

VERIFICATION
command: cargo test
invocation: VALID
compilation: FAILED
tests_executed: UNKNOWN

UNKNOWN
project test status
source change correctness
```

---

### Example 4: Compiler Diagnostic in Unchanged Code
*(Observed: Task 1, Broken Dependency in Lib)*
```yaml
CHANGE
none observed

DIAGNOSTIC
tool: cargo
file: src/lib.rs
line: 120
message: cannot find value `foo` in this scope

RELATION
diagnostic in unchanged file src/lib.rs

VERIFICATION
command: cargo test
invocation: VALID
compilation: FAILED
tests_executed: UNKNOWN

UNKNOWN
project test status
source change correctness
```

---

### Example 5: Invalid Cargo Test Target Invocation
*(Observed: 8B DELTA Run 4 / Event 11)*
```yaml
CHANGE
none observed

DIAGNOSTIC
tool: cargo
target: impl_partial_eq_cow
message: no test target named impl_partial_eq_cow

RELATION
requested target impl_partial_eq_cow absent from observed Cargo targets

VERIFICATION
command: cargo test --test impl_partial_eq_cow
invocation: FAILED
tests_executed: UNKNOWN

UNKNOWN
intended verification command
project test status
source change correctness
```

---

### Example 6: Successful Verification Execution
*(Observed: Task 5, Passing Test Run)*
```yaml
CHANGE
none observed

DIAGNOSTIC
none

RELATION
none

VERIFICATION
command: cargo test
invocation: VALID
status: PASSED
tests_executed: 193

UNKNOWN
source change correctness
```

---

### Example 7: Verification Not Actually Executed (Missing Directory)
*(Observed: 8B RAW Run 5 / Event 12)*
```yaml
CHANGE
none observed

DIAGNOSTIC
tool: list_files
target: tests
message: folder "tests" does not exist

RELATION
target path tests absent from workspace

VERIFICATION
none

UNKNOWN
intended path
```

---

### Example 8: Destructive Overwrite / Zero-Byte Truncation
*(Observed: Historical Trial / Event 6)*
```yaml
CHANGE
src/impls.rs modified (+0 / -350)

DIAGNOSTIC
none

RELATION
target file src/impls.rs exists in working tree

VERIFICATION
none

UNKNOWN
intended edit content
source change correctness
```

---

## 8. Provenance Invariant

Every factual statement emitted by WTF must answer the question:

> **"Why is WTF allowed to say this?"**

### Permitted Deterministic Provenance Sources:
1. **Git Object Database / Index**: Working tree diff hunks, status porcelain, commit hashes.
2. **Filesystem Reality**: Exact file existence, file size in bytes, directory listings.
3. **Tool Process Execution**: Literal process exit code, stdout stream, stderr stream.
4. **Project Manifests**: Explicit target tables in `Cargo.toml`, `package.json`, `pyproject.toml`.
5. **Boundary State Comparison**: Delta computed between snapshot $T_0$ and snapshot $T_1$.

Any statement that cannot be traced directly to one of these sources must be emitted under `UNKNOWN`.

---

## 9. Falsification Conditions

Protocol v0 is considered falsified if any of the following occur:

1. **Expressive Incompleteness**: An observed, deterministic software reality event cannot be represented using the five primitives without losing essential facts.
2. **Probabilistic Contamination**: An essential piece of evidence requires statistical, heuristic, or LLM interpretation before it can be assigned to a primitive.
3. **Necessary Information Loss**: The five-primitive representation systematically strips information that an agent strictly requires to complete verification.
4. **Provenance Breakdown**: A factual statement emitted under one of the four non-UNKNOWN primitives cannot be mechanically traced to a deterministic source.

The five primitives survived the initial 14-event failure inventory. If a 15th event breaks this ontology, the protocol must be revised.

---

## 10. Non-Goals

Protocol v0 explicitly excludes:
* **Agent Planning**: Decomposing user goals into steps.
* **Autonomous Repair**: Modifying code on behalf of the agent.
* **Recommendations**: Telling the agent what tool to run next.
* **Semantic Code Understanding**: Reading code to divine developer intent.
* **AST Requirements**: Mandatory AST parsing as a prerequisite for compilation.
* **Embeddings & Vector Databases**: Probabilistic similarity search.
* **LLM Calls Inside WTF**: Any LLM-in-the-loop processing inside the compiler.
* **Root-Cause Engines**: Speculative causal attribution.
* **Multi-Agent Orchestration**: Managing communication graphs or agent pools.
* **Persistent Stateful Memory**: Long-term state stores across sessions.

---

## 11. What We Have Actually Earned

We separate what our experimental work has established from what remains unverified:

### ESTABLISHED BY OBSERVATION
1. **Representational Sufficiency**: The five primitives (`CHANGE`, `DIAGNOSTIC`, `RELATION`, `VERIFICATION`, `UNKNOWN`) cleanly represent all 14 observed failure, thrash, and recovery events across 3 model tiers (14B, 30B MoE, 8B).
2. **Context Compression**: Compiling noisy tool output into the five primitives reduces total token consumption by **36.7%** ($N=5$, 5,360 vs. 8,473 avg tokens) without loss of diagnostic facts.
3. **Thrash Elimination**: Grounded feedback eliminated 100% of exploratory error loops (0 vs. 2) and repeated reads (0 vs. 1).
4. **Recovery Enablement**: Explicitly declaring `invocation: FAILED` and `target absent` allowed an 8B model to recover from an invalid target invocation via manifest inspection (`read_file Cargo.toml` → `cargo test --package bstr`).
5. **Action/Perception Separation**: Perfect perception and reasoning do not guarantee tool dispatch (DELTA Run 4). Agent action failure is orthogonal to evidence compilation.

### SUPPORTED HYPOTHESIS
* Compiling raw tool feedback into a deterministic Action → Reality Delta substitutes for probabilistic reasoning tokens, allowing smaller models to understand execution reality with less context exhaustion.

### UNTESTED FUTURE POSSIBILITY
* **Stateful Perception Protocol**: Whether WTF should maintain a persistent cross-turn state store, tracking cumulative evidence across an entire session rather than functioning as an ephemeral single-action delta compiler. *(Untested. Do not assume or implement.)*
* **General Multi-Ecosystem Parity**: Whether non-Cargo build systems (Go, Node, Python) yield identical compression and recovery profiles under the five primitives.

---

## 12. Minimal Definition: WTF Evidence Protocol v0

```
A stateless deterministic compiler that accepts:
  (STATE_BEFORE, ACTION, TOOL_OUTPUT, STATE_AFTER)

And emits strictly:
  CHANGE        := Mechanically observed working-tree delta (+lines / -lines / none)
  DIAGNOSTIC    := Extracted tool errors (tool, target, location, message)
  RELATION      := Mechanically established relations (spatial location, target presence)
  VERIFICATION  := Invocation and harness execution status (command, invocation, status, tests_executed)
  UNKNOWN       := Explicit declarations of unestablished facts

Invariants:
  1. Every non-UNKNOWN statement has deterministic provenance.
  2. No uncertainty is converted into a default value.
  3. No causal inferences, recommendations, or intent claims are emitted.
  4. Passing checks verify only that executed checks ran, never task correctness.
```
