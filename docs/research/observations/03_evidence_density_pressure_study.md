# Observation Record: Evidence Density & Large-Diff Information Pressure

**Date**: September 21, 2026  
**Context**: Post-Step 4 architectural baseline freeze (commit `fb914b6`).  
**Status**: EMPIRICAL OBSERVATION ONLY / NO DESIGN OR IMPLEMENTATION

---

## 1. Objective & Research Question

> **How should WTF compress a large software-reality delta while preserving the evidence needed to decide where to look next?**

This study is an observational analysis of information pressure. It does not propose a final compression algorithm, does not implement changes, and does not alter canonical Evidence Protocol v0.

Two real-world software changes are analyzed:
1. **Specimen 1 (WTF Step-4 Migration)**: Commit `fb914b6f7c5fd64bd176ea699fb4defcb6122a21` in this repository (41 files committed, 43 files uncommitted in dogfood, +7,447 / -287 lines).
2. **Specimen 2 (Omnicap Polyglot Refactoring & ML Ingestion)**: Working tree change against merge base `415db840db83` in `/Users/linus/Projects/Omniclip` (225 files changed, +38,355 / -442 lines).

---

## 2. Specimen Descriptions

### Specimen 1: WTF Step-4 Migration (`fb914b6`)
* **Footprint**: 41 files committed (+7,447 / -287 lines, 7,723 meaningful lines).
* **Architecture / Stack**: TypeScript / Node.js CLI with Vitest testing suite.
* **Component Breakdown**:
  * **Documentation & Empirical Research**: 18 markdown files (+4,036 lines), including 10 experiment reports, 2 observation records, and 3 architectural specifications.
  * **Production Engine & CLI**: 15 TypeScript files (+2,000 / -280 lines) across `src/core/`, `src/verify/`, `src/detectors/`, and `src/formatters/`.
  * **Verification & Test Suites**: 7 test files (+1,921 / -5 lines) across `test/`.
  * **Repository Configuration & Rules**: `package.json`, `AGENTS.md`, `GEMINI.md` (+18 lines).
* **Verification Execution**: Full verification ran cleanly in 4.3s: 81/81 tests passed across 9 suites, typecheck passed, build passed.

### Specimen 2: Omnicap Polyglot Refactoring (`base:415db84`)
* **Footprint**: 225 files changed (+38,355 / -442 lines).
* **Architecture / Stack**: Heterogeneous monorepo comprising a native Swift macOS app (`Sources/Omnicap/`) with nested Python ML pipelines and skills (`Skills/ClipDirector/`, `Skills/YuEMusic/`, `Skills/FastMetal/`).
* **Component Breakdown**:
  * **Native Swift Application**: ~15–20 files in `Sources/Omnicap/` (+1,800 / -400 lines) containing UI views, clip services, and orchestrators.
  * **Imported/Vendor Python ML Pipeline**: ~180+ files in `Skills/YuEMusic/yue2/` and `Skills/FastMetal/` (+35,000+ lines) containing VAE modeling, tokenizers, and CUDA/Metal graph routines.
  * **Local Python Scripts & Manifests**: ~20 files in `Skills/*/` (`manifest.json`, `script.py`, tests).
* **Verification Execution**: Verification hung on unguided recursive `pytest` traversal into `Skills/FastMetal`, resulting in process timeout (120s `SIGTERM`) and `PARTIAL (0/1)` verification.

---

## 3. Observed Sources of Information Pressure

Across both specimens, what makes the initial perception large and difficult to parse?

### 1. Bimodal Content Distribution (Core Authoring vs. Bulk Subtrees)
* **WTF**: Bulk research documentation (+4,036 lines across 18 files) accounted for >50% of the entire diff volume, visually crowding out the 15 production engine files (+2,000 lines) and 7 test files (+1,921 lines).
* **Omnicap**: Bulk vendor/ML pipelines (`Skills/YuEMusic/yue2/` with +35,000 lines across 180+ files) overwhelmed the ~15 native Swift application files (+1,800 lines) where the actual authored product changes occurred.

### 2. File Count Blind Truncation
* WTF's current representation prints 8 files and truncates the remainder:
  * In WTF (41 files): Truncated 33 files with `... and 33 more files`. Among the hidden files were `src/verify/runner.ts` (+539 lines, the core verification engine) and `src/formatters/agent.ts` (+180 lines, the primary agent view).
  * In Omnicap (225 files): Truncated 217 files with `... and 217 more files`. Almost the entire native Swift application layer was completely invisible.

### 3. Repetitive Low-Information Mechanical Relations
* Pattern-based detectors emitted repetitive hits that consumed vertical perception budget without adding new structural evidence:
  * In WTF: 7 separate `[auth-surface]` hits for mock session timeout tokens across test suites (`test/canonical-consumers.test.ts`, `test/policy-separation.test.ts`), and 2 `[test-skip]` hits for intentional tests of skip detection.
  * In Omnicap: 12 `ATTENTION` hits generated across Python vendor scripts.

### 4. Flat Representation of Hierarchical Subsystems
* Both changes occurred across clearly bounded subsystems (docs vs engine vs tests in WTF; native app vs ML skills in Omnicap), but current WTF flattens all files into a single alphabetical or arbitrary linear list, obscuring architectural boundaries.

---

## 4. Provisional Information Classification

Based on empirical inspection of the two specimens, observed information falls into four perceptual value categories:

| Category | Definition | Concrete Examples from Specimens |
| :--- | :--- | :--- |
| **VISIBLE** | Information necessary in the initial perception to orient the consumer and choose what to inspect next. | • High-level diff volume and file counts (+7.4k/-287, 41f)<br>• Subsystem breakdown with file/line counts (`docs/research`, `src/`, `test/`)<br>• Verification lifecycle, executed count, and duration (`tests: 81/81 passed in 4.3s`)<br>• High-signal anomalies: skipped tests (`2 skipped tests in test/canonical-consumers.test.ts`)<br>• Root `UNKNOWN` disclosures (e.g. task intent unverified) |
| **AGGREGATABLE** | Information whose individual instances need not be listed, but whose count, aggregate volume, or structural pattern is essential. | • 18 documentation files in `docs/research/` (+4,036 lines) aggregated as a single documentation facet<br>• 7 repetitive auth-token regex hits across test files aggregated as `7 auth-token matches in 3 test files`<br>• 180+ vendor ML files in `Skills/YuEMusic/` aggregated under their package boundary (`Skills/YuEMusic (180 files, +35k lines)`)<br>• Test suite additions (+1,921 lines across 7 files in `test/`) |
| **RETRIEVABLE** | Information that must remain available losslessly on demand, but whose inclusion in initial perception wastes attention budget. | • Full flat list of all 225 individual file paths<br>• Raw stdout of 81 passing test cases<br>• Specific line-by-line diff hunks of unchanged or non-anomalous code<br>• Full line numbers and text snippets of non-critical relation matches |
| **UNKNOWN** | Cases where the appropriate perceptual tier cannot be deterministically decided from current evidence. | • Whether a large file modification (+500 lines) in a core module is a routine refactor or a breaking API rewrite<br>• Whether a test skip is an intentional unit test of skip-detection or an accidental commit of a disabled test suite |

---

## 5. Failure Cases in the Current Representation

1. **Truncation Black Hole**:
   In Omnicap, 217 out of 225 files were hidden beneath `... and 217 more files`. An agent relying on `wtf check` had zero visibility into whether `Sources/Omnicap/ClipboardWatcher.swift` or `Sources/Omnicap/Foundation/Services/` were modified.
2. **Hiding Core Architectural Changes**:
   In WTF, alphabetical or raw order truncation hid `src/verify/runner.ts` (+539 lines) and `src/formatters/agent.ts` (+180 lines), while displaying documentation files that happened to sort earlier.
3. **Relation Flooding**:
   In WTF, 9 lines of terminal output were spent listing individual regex hits for `Session expiry / timeout token match in test/...`, which were identical test fixtures, consuming more vertical lines than the entire verification summary.
4. **Equal Visual Weight for Incommensurate Artifacts**:
   A +600 line research report (`docs/research/WTF_EVIDENCE_PROTOCOL_V0.md`) appeared identical in structural presentation to a +539 line core verification engine overhaul (`src/verify/runner.ts`), providing no clue about runtime behavioral impact.

---

## 6. What Must NOT Be Lost

If the following evidence disappeared from the initial perception, it would **materially degrade the consumer's next inspection decision**:

1. **Subsystem Footprint & Scope**:
   * In Omnicap: The consumer must know that the change spans *both* the Swift UI application (`Sources/Omnicap/`) *and* external Python pipelines (`Skills/`). If the Swift app changes disappear behind skill truncation, the consumer assumes only skills were modified.
   * In WTF: The consumer must know that 54% of the diff is documentation, 27% is production engine, and 19% is tests.
2. **Verification Reality**:
   * In WTF: Knowing that 81/81 tests executed and passed rules out test failure debugging as the next step.
   * In Omnicap: Knowing that verification timed out during discovery prevents the consumer from falsely assuming tests passed or failed due to application bugs.
3. **Anomalous Relation Signals**:
   * The presence of `[test-skip]` (skipped tests) must remain visible in initial perception, because disabled tests can silently mask regressions.
4. **Active Surface Pointer**:
   * The primary directories or files containing concentrated human/agent edits must remain visible or explicitly summarized so the consumer knows *where* to inspect.

---

## 7. Similarities and Differences Between WTF and Omnicap

| Dimension | Specimen 1: WTF Step 4 | Specimen 2: Omnicap Large Change |
| :--- | :--- | :--- |
| **Scale** | 41–43 files, ~7.8k lines changed | 225 files, ~38.8k lines changed |
| **Dominant Bulk** | Author-created Markdown research docs (+4.0k lines) | External / upstream Python ML pipeline check-ins (+35k lines) |
| **Subsystems** | Monoglot TypeScript (docs, src, test) | Polyglot (Swift 6 macOS app + Python ML pipelines) |
| **Verification** | Fast, clean deterministic pass (81/81 tests in 4.3s) | Timeout hang (120s) due to recursive traversal |
| **Truncation Failure** | 33 of 41 files hidden (hid core runner) | 217 of 225 files hidden (hid entire Swift app) |
| **Common Trait** | Both exhibit a stark bimodal distribution between a focused core edit surface and voluminous bulk changes. |

---

## 8. Unresolved Questions

1. **Deterministic Subsystem Discovery**:
   Can WTF discover and project repository subsystem boundaries (e.g. `docs/`, `src/`, `test/`, `Sources/`, `Skills/`) deterministically from the filesystem tree without relying on language-specific heuristics?
2. **Separating Authored vs. Bulk Content**:
   Can deterministic signals (e.g. file extensions, path depth, line count distributions, dependency manifests) reliably group bulk/vendor/doc additions without guessing user intent?
3. **The Retrieval Interface**:
   What is the most token-efficient interface for retrieving aggregated details? A drill-down command (`wtf show <subsystem>`), path-filtered CLI flags (`wtf check --path <dir>`), or structured JSON queries?

---

## 9. Observed Compression Requirements

Based strictly on the two specimens, any representation solution must satisfy the following empirical requirements:

1. **No Silent Black-Hole Truncation**:
   The system must not hide the majority of changed files behind an opaque `... and N more files` line without communicating which directories or subsystems those files belong to.
2. **Hierarchical / Boundary Aggregation**:
   Files must be aggregatable by structural boundary (directory, subsystem, or package) so that a 180-file vendor addition does not displace 15 application files.
3. **Relation Deduplication & Aggregation**:
   Multiple instances of the same relation predicate within identical directories or files (e.g. 7 token matches in tests) must aggregate into counts rather than flooding the perception window.
4. **Subsystem Proportion Transparency**:
   Initial perception must convey the distribution of the change (e.g. lines per subsystem) so the consumer immediately sees whether changes are concentrated in docs, tests, or application core.
5. **Lossless Drill-Down Retrievability**:
   Every aggregated detail must remain retrievable on-demand through a deterministic secondary query without re-running repository analysis.

---

## 10. Candidate Design Space (To Test Next)

Without implementing or choosing a winner, the following three broad representation approaches warrant evaluation in Step 2:

### Approach 1: Path Hierarchy / Subsystem Projection
Project the diff onto a deterministic directory tree with aggregated counts:
```markdown
## OBSERVED CHANGES (+7807/-287 across 41 files)
• docs/research/ (18 files, +4036/-0)
• src/ (15 files, +2000/-280)
  - core/ (4 files, +920/-45)
  - verify/ (1 file, +539/-30) [runner.ts]
  - formatters/ (4 files, +440/-180)
  - detectors/ (4 files, +43/-25)
• test/ (7 files, +1921/-5)
```
*Advantage*: Retains 100% structural coverage; eliminates black-hole truncation; immediately reveals subsystem balance.

### Approach 2: Tiered Multi-Faceted Perception
Separate initial perception into explicit structural facets (`APPLICATION`, `TESTS`, `DOCUMENTATION`, `VENDOR/BULK`) determined by deterministic file extension / path rules:
```markdown
## OBSERVED FACETS
• Core Engine: 15 files (+2000/-280) [src/verify/runner.ts, src/core/protocol-v0.ts, ...]
• Tests: 7 files (+1921/-5) [81 tests executed]
• Documentation: 18 files (+4036/-0) [docs/research/]
```
*Advantage*: Highly token-dense for agents; directly separates author edits from documentation/bulk.

### Approach 3: Relation & Verification-Anchored Clustering
Cluster files by verification target and observed relations rather than pure filesystem paths:
```markdown
## OBSERVED SURFACES
• Verification Surface: targets `tests`, `typecheck`, `build` (covered by 7 test files, 15 src files)
• Unverified Surface: 18 documentation files (no execution contract)
• Sensitive Relations: 2 skipped tests in `test/canonical-consumers.test.ts`
```
*Advantage*: Directly links code changes to verification evidence and detected relations.

---

## 11. Feasibility Assessment

**Do these two specimens provide enough evidence to proceed to constructing 2–3 candidate representations?**

**YES.**

**Justification**:
Specimen 1 (WTF Step 4, ~43 files, +7.8k lines) and Specimen 2 (Omnicap, 225 files, +38.8k lines) establish the clear failure modes of flat truncation (`... and N more files`), the reality of bimodal distributions (core logic vs. documentation/vendor bulk), and the necessity of structural aggregation. They provide concrete bounds and realistic pressure tests to construct and evaluate 2–3 candidate representations in the next step.
