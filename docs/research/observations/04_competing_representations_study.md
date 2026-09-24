# Observation & Evaluation Record: Competing Evidence Representations

**Date**: September 21, 2026  
**Context**: Step 2 of Evidence Density Research (evaluating representations against commit `fb914b6` and Omnicap `base:415db84`).  
**Status**: OBSERVATIONAL EVALUATION ONLY / NO PRODUCTION CODE CHANGES

---

## 1. Objective & Evaluation Task

> **What is the smallest initial representation of a large software-reality delta that preserves the consumer’s ability to choose what evidence to inspect next?**

### The Evaluation Task
For every candidate representation, the evaluation is tested against one concrete question:
> *What should the consumer inspect next, and what evidence in the initial perception allows them to make that choice?*

### Epistemic Constraints
The evaluation adheres strictly to WTF's epistemic principles:
* Do **not** assume application code matters more than vendor/skill code.
* Do **not** assume source code matters more than documentation.
* Do **not** assume a large line diff matters more than a small diff.
* Do **not** assume relation matches (e.g. auth tokens) imply behavioral significance or defects.
* Do **not** assume directory depth equals architectural importance.
* Do **not** assume test skips are accidental defects or debt.
* Do **not** assume generated/vendor-looking files are unimportant.
* **WTF observes deterministic structure; it does not know user task intent.**

---

## 2. The Two Real-World Specimens

1. **Specimen 1: WTF Step-4 Migration (`fb914b6`)**
   * Total Footprint: 41 files, +7,447 / -287 lines (7,723 meaningful lines).
   * Verified: 81/81 tests passed in 4.3s (`npm test`), typecheck passed (0.6s), build passed (0.1s).
   * Key Changes: Core verification rewrite (`src/verify/runner.ts` +539/-30), Protocol v0 types (`src/core/protocol-v0.ts` +285), formatters (+440/-205), 18 research docs (+4,036), 7 test suites (+1,921).
   * Relations: 2 skipped tests in `test/canonical-consumers.test.ts`, 7 `[auth-surface]` token matches across auth detector and test suites.

2. **Specimen 2: Omnicap Monorepo Change (`base:415db84`)**
   * Total Footprint: 225 files, +38,355 / -442 lines.
   * Verification: `pytest .` timed out after 120s (`SIGTERM`) on unguided recursive traversal into ML pipeline (`Skills/FastMetal`).
   * Key Changes: Native Swift macOS application (`Sources/Omnicap/` 18 files, +1,846/-412), Python ClipDirector agent (8 files, +846/-19), imported Python ML music pipeline (`Skills/YuEMusic/` 182 files, +34,920/-11), FastMetal & skills (17 files, +743).
   * Relations: 12 regex/pattern matches across Python scripts.

---

## 3. Construction of Candidate Representations

### Candidate A — Structural Hierarchy
*Concept*: Compress deterministically using repository path hierarchy, projecting file counts and line diffs onto directory nodes.

#### Specimen 1 (WTF Step 4):
```markdown
## VERIFIED
✓ tests: passed (81/81) in 4300ms [npm test]
✓ typecheck: passed in 662ms [npm run typecheck]
✓ build: passed in 142ms [npm run build]

## OBSERVED CHANGES (41 files · +7447 / -287)
• docs/research/ (18 files, +4036/-0)
  ├── experiments/ (10 files, +1970/-0)
  ├── observations/ (2 files, +116/-0)
  └── core specs (4 files, +1950/-0)
• src/ (15 files, +2000/-280)
  ├── core/ (4 files, +1071/-47)
  ├── verify/ (1 file, +539/-30) [runner.ts]
  ├── formatters/ (4 files, +440/-196)
  ├── detectors/ (4 files, +56/-28)
  └── cli.ts, types.ts (2 files, +54/-7)
• test/ (7 files, +1921/-5)
• root (3 files, +18/-2) [package.json, AGENTS.md, GEMINI.md]

## OBSERVED RELATIONS
• [test-skip] 2 skipped tests in test/canonical-consumers.test.ts
• [auth-surface] 7 token matches across src/detectors/auth.ts (2) and test/ (5)

## UNKNOWN
- Task intent correctness: unverified (passing checks prove only executed tests passed)
```

#### Specimen 2 (Omnicap):
```markdown
## VERIFICATION
○ tests: TIMEOUT after 120s [pytest .] (execution unverified)

## OBSERVED CHANGES (225 files · +38355 / -442)
• Sources/Omnicap/ (18 files, +1846/-412)
  ├── Foundation/ (12 files, +920/-180)
  └── UI & Features/ (6 files, +926/-232)
• Skills/ (207 files, +36509/-30)
  ├── YuEMusic/ (182 files, +34920/-11)
  ├── ClipDirector/ (8 files, +846/-19)
  ├── FastMetal/ (11 files, +520/-0)
  └── other skills (6 files, +223/-0)

## OBSERVED RELATIONS
• 12 pattern matches across Skills/YuEMusic and Skills/ClipDirector

## UNKNOWN
- Verification outcome: timed out (runner hung on remote/model dependencies)
- Task intent correctness: unverified
```

---

### Candidate B — Deterministic Facets
*Concept*: Partition evidence into mechanically identifiable functional facets (Code, Tests, Documentation, Vendor/Upstream, Config, Verification, Relations). If a facet cannot be established deterministically, mark it `UNKNOWN`.

#### Specimen 1 (WTF Step 4):
```markdown
## VERIFICATION (passed)
✓ tests: passed (81/81) in 4300ms [npm test]
✓ typecheck: passed in 662ms [npm run typecheck]
✓ build: passed in 142ms [npm run build]

## OBSERVED FACETS (41 files · +7447 / -287)
• Engine Code: 15 files (+2000/-280) across src/core, src/verify, src/formatters, src/detectors
• Test Suites: 7 files (+1921/-5) in test/ [covers protocol, lifecycle, policy, formatters]
• Documentation: 18 files (+4036/-0) in docs/research/
• Configuration & Rules: 3 files (+18/-2) [package.json, AGENTS.md, GEMINI.md]
• Vendor / Generated: none observed

## RELATIONS
• [test-skip] 2 skipped tests in test/canonical-consumers.test.ts
• [auth-surface] 7 token matches in auth detector & test fixtures

## UNKNOWN
- Task intent correctness: unverified
```

#### Specimen 2 (Omnicap):
```markdown
## VERIFICATION (timeout)
○ tests: TIMEOUT after 120s [pytest .] (execution unverified)

## OBSERVED FACETS (225 files · +38355 / -442)
• Native Application Code: 18 files (+1846/-412) in Sources/Omnicap/
• Local Skill Code: 14 files (+1069/-19) in Skills/ClipDirector, Skills/FastMetal
• Tests: 6 files (+380/-0) in Skills/*/tests/
• Config / Manifests: 5 files (+140/-0) [manifest.json, setup.cfg]
• Uncategorized / Vendor-like Subtree: 182 files (+34920/-11) in Skills/YuEMusic/

## RELATIONS
• 12 pattern matches across Python skill modules

## UNKNOWN
- Facet boundary for Skills/YuEMusic: unverified whether authored in-house or imported vendor
- Verification: runner timed out
- Task intent correctness: unverified
```

---

### Candidate C — Evidence-Anchored Representation (Protocol v0)
*Concept*: Organize strictly around Protocol v0's canonical primitives (`VERIFIED`, `CHANGE`, `RELATION`, `UNKNOWN`), applying structural aggregation *inside* each primitive.

#### Specimen 1 (WTF Step 4):
```markdown
## VERIFIED
✓ tests: passed (81/81) in 4300ms [npm test]
✓ typecheck: passed in 662ms [npm run typecheck]
✓ build: passed in 142ms [npm run build]

## CHANGE (41 files · +7447 / -287 across 4 structural clusters)
• src/ (15 files · +2000/-280): core (4f, +1071), verify (1f, +539), formatters (4f, +440), detectors (4f, +56), root (2f, +54)
• test/ (7 files · +1921/-5): protocol-v0, verification-lifecycle, policy-separation, canonical-consumers
• docs/research/ (18 files · +4036/-0): specifications (4f), experiment reports (10f), observations (2f)
• root config (3 files · +18/-2): package.json, AGENTS.md, GEMINI.md

## RELATION
• [test-skip] 2 skipped tests in test/canonical-consumers.test.ts
• [auth-surface] 7 token matches (2 in src/detectors/auth.ts, 5 in test suites)

## UNKNOWN
- Task intent correctness: unverified (passing checks prove only executed tests passed)
```

#### Specimen 2 (Omnicap):
```markdown
## VERIFICATION
○ tests: TIMEOUT after 120s [pytest .] (testsExecuted: UNKNOWN; exit: SIGTERM)

## CHANGE (225 files · +38355 / -442 across 2 root namespaces)
• Sources/Omnicap/ (18 files · +1846/-412): Foundation (12f), UI & Features (6f)
• Skills/ (207 files · +36509/-30): YuEMusic (182f, +35k), ClipDirector (8f), FastMetal (11f), other (6f)

## RELATION
• 12 pattern matches across Skills/ (process execution, environment reads)

## UNKNOWN
- Verification: command timed out on recursive traversal into Skills/FastMetal
- Task intent correctness: unverified
```

---

## 4. Evaluation Against Next-Inspection Options

### Concrete Inspection Options Exposed by Full Evidence
When examining the full, uncompressed git diffs and logs of the two specimens, the actual next inspection options a consumer might legitimately choose are:

* **In WTF Step 4**:
  1. Inspect the verification engine overhaul (`src/verify/runner.ts` +539 lines).
  2. Inspect the core protocol data types (`src/core/protocol-v0.ts` +285 lines).
  3. Inspect formatters (`src/formatters/` +440 lines).
  4. Inspect the 2 skipped tests in `test/canonical-consumers.test.ts` to confirm if they are intentional regression fixtures or skipped suite debt.
  5. Inspect the research reports and constitutional audit in `docs/research/`.
  6. Inspect `package.json` for new script or dependency declarations.

* **In Omnicap**:
  1. Inspect the Swift application UI and service layer in `Sources/Omnicap/Foundation/`.
  2. Inspect the ClipDirector narrative agent logic (`Skills/ClipDirector/llm_narrative_agent.py` +547 lines).
  3. Inspect why `pytest .` timed out during discovery in `Skills/FastMetal`.
  4. Inspect `Skills/YuEMusic/` to determine package origin and integration point.
  5. Inspect the 12 relation matches.

---

### Comparative Evaluation Matrix

| Evaluation Dimension | Candidate A (Structural Hierarchy) | Candidate B (Deterministic Facets) | Candidate C (Evidence-Anchored / Protocol v0) |
| :--- | :--- | :--- | :--- |
| **Important options preserved** | **HIGH**. Exposes `src/verify/` (+539) immediately as a distinct single-file node. In Omnicap, cleanly isolates `Sources/Omnicap/` (18f) from `Skills/` (207f). | **MEDIUM**. Groups by facet, but completely buries `src/verify/runner.ts` inside "Engine Code: 15 files". | **HIGH**. Identifies `verify (1f, +539)` and `core (4f, +1071)` within `src/` cluster. Preserves all 5 Protocol v0 primitives. |
| **Important options obscured / lost** | Does not convey functional facet (e.g. docs vs code) except through directory names. | **High risk of semantic loss**: Path context is lost. In Omnicap, whether `Skills/YuEMusic` is vendor or first-party code cannot be established without intent. | Minor: individual file names inside large clusters (e.g. 18 docs) require drill-down. |
| **Misleading implications introduced** | Implies directory depth = architectural importance. Small files in deep paths get equal visual billing. | **SEVERE EPISTEMIC BREACH**: Labeling a directory "Vendor / Upstream" without deterministic proof asserts unobserved intent. | **MINIMAL**. Makes zero claims about "importance" or "vendor status". Reports deterministic path clusters. |
| **Redundant information retained** | Repeated directory path prefixes across multiple sub-bullet levels. | Low redundancy, but facet labels repeat concept definitions. | **LOWEST**. Token-dense, compact representation without repetitive path nesting. |
| **Approximate size** | ~24–28 lines / ~220 tokens | ~20–24 lines / ~190 tokens | **18–22 lines / ~170 tokens** |
| **What requires drill-down** | Contents of directories with $>3$ files (`docs/research/`, `Skills/YuEMusic/`). | Path breakdown inside facets (e.g. which files constitute the 15 code files). | File list inside clusters (`wtf show src/` or `wtf show change`). |

---

## 5. Retrieval Mechanism (Addressability)

To avoid loss of evidence, every aggregated representation must provide an explicit, unambiguous address for on-demand drill-down.

> [!NOTE]
> **Provisional Retrieval Syntax**: Queries such as `wtf show change <cluster>` are illustrative retrieval concepts, not accepted CLI/API designs. The requirement established by observation is strictly: **Aggregated evidence must remain deterministically addressable and retrievable.** How that interface is exposed in the CLI remains an implementation decision.

1. **In Candidate A (Structural Hierarchy)**:
   * **Address scheme**: Filesystem path.
   * **Illustrative query**: `wtf show <path>` (e.g. `wtf show docs/research/`, `wtf show Sources/Omnicap/`).
   * **Addressable data**: Immediate children of the addressed directory node with file-level line counts.

2. **In Candidate B (Deterministic Facets)**:
   * **Address scheme**: Facet identifier.
   * **Illustrative query**: `wtf show --facet=<name>` (e.g. `wtf show --facet=code`, `wtf show --facet=docs`).
   * **Addressable data**: List of files categorized under that facet. *(Weakness: requires maintaining arbitrary facet mappings)*.

3. **In Candidate C (Evidence-Anchored / Protocol v0)**:
   * **Address scheme**: Protocol v0 primitive + cluster key.
   * **Illustrative query**:
     * For changes: `wtf show change <cluster>` (e.g. `wtf show change src/`, `wtf show change Skills/YuEMusic`).
     * For relations: `wtf show relation <predicate>` (e.g. `wtf show relation test-skip`, `wtf show relation auth-surface`).
     * For verification: `wtf show verify <target>` (e.g. `wtf show verify tests`).
   * **Addressable data**: Complete underlying Protocol v0 records (`ChangeItemV0`, `RelationItemV0`, `VerificationItemV0`).

---

## 6. Synthesis & Decision

### 1. Is there a clear winning representation?
**No single pure candidate is an uncompromised winner, but Candidate C (Evidence-Anchored) is fundamentally superior to Candidate B and provides the cleanest constitutional substrate.**

### 2. Why does the evidence support this finding?
- **Candidate B introduces semantic assumptions that WTF cannot justify**: Attempting to group by semantic facets ("Engine Code", "Vendor / Upstream") violates WTF's core rule: *WTF observes structure, it does not know user intent.* In Omnicap, `Skills/YuEMusic` was checked into `Skills/`, not `vendor/` or `third_party/`. Calling it "Vendor" is a semantic guess; calling it `UNKNOWN` forces half the repository into an uninformative category. Furthermore, grouping 15 disparate engine files into a single "Engine Code" facet concealed `src/verify/runner.ts` (+539 lines), which was the central architectural change in WTF Step 4.
- **Candidate A preserves useful deterministic structure, but does not provide the canonical outer organization**: Tree paths alone do not tell the consumer how changes interact with verification or relations.
- **Candidate C provides the strongest constitutional substrate**: It keeps the five primitives (`VERIFIED`, `CHANGE`, `RELATION`, `UNKNOWN`) as the authoritative outer envelope, while using Candidate A's path-clustering inside `CHANGE`.

### 3. What combination / minimal revision should be tested once?
The candidate synthesis supported by current observations is **Candidate C with Hierarchical Cluster Projections**:
1. **Outer Envelope**: Protocol v0 canonical primitives (`VERIFIED`, `CHANGE`, `RELATION`, `UNKNOWN`).
2. **Inside `CHANGE`**: Cluster files by top-level repository namespace (e.g. `src/`, `test/`, `docs/`, `Sources/`, `Skills/`), displaying:
   * Cluster file count and net line delta.
   * Hierarchical child projection as a candidate mechanism (e.g. projecting immediate child sub-directories such as `src/verify/` or `Skills/YuEMusic/`).
   * **Epistemic Rule on Sub-Clusters**: Size alone must not be treated as significance. WTF cannot deterministically establish that +539 lines are more important than +37 lines. The deterministic rule governing when a child remains visible versus collapses into its parent directory is not yet established; this is the primary unresolved rule for the final synthesis test.
3. **Inside `RELATION`**: Aggregate by predicate with count and file targets (e.g. `• [test-skip] 2 skipped tests in test/canonical-consumers.test.ts`).
4. **Addressable Drill-Down**: Every cluster remains deterministically addressable and retrievable (illustrative concept: `wtf show change <cluster>`).

### 4. What information was impossible to compress safely without task intent?
- **Distinguishing Author-Written Code from Vendor / Upstream Imports**:
  Without task intent or an explicit contract, WTF cannot know whether a 35,000-line addition (`Skills/YuEMusic`) is an imported third-party library or the user's primary engineering feat. Any compression that demotes or collapses it as "unimportant" risks hiding the user's actual work.
- **The Intent Behind Anomalous Relations**:
  Whether a test skip (`it.skip`) is an intentional regression fixture (as in WTF Step 4) or a sloppy omission masking broken code cannot be determined mechanically. It must be surfaced neutrally as an observed relation.

### 5. Did any candidate materially reduce representation size without observed loss of next-inspection options?
**Yes. Candidate C (Evidence-Anchored Representation)** reduced representation size from:
* WTF Step 4: from 50+ lines (full list) to **18 lines** (~170 tokens).
* Omnicap: from 230+ lines (full list) or blind truncation (`... and 217 more files`) to **19 lines** (~180 tokens).

Crucially, it accomplished this **with no observed loss among the 11 next-inspection options identified across these two specimens** (this study does not claim universal losslessness across arbitrary codebases).

---

## 7. Final Research Question & Recommendation

**Final synthesis test**:
> **Can Protocol v0 + deterministic hierarchical projection preserve all 11 currently identified next-inspection options while materially compressing both specimens, without introducing importance judgments?**

**Decision Criteria**:
* **If YES** $\rightarrow$ Evidence-density research stops and implementation begins.
* **If NO** $\rightarrow$ Identify the exact inspection option(s) lost and permit one minimal correction only.
* **No further open-ended representation exploration.**

