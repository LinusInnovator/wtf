# WTF Phase 8.J1 — JUG-v2 Causal Control

**Status:** COMPLETE  
**Date:** September 2026  
**Artifact Type:** Prospective Controlled Empirical Research  
**Substrate Version:** Frozen WTF Protocol v0 (Phases 6.5–8.5), Action Compiler v0, Verify-on-Write v1, Bounded Viewport $[c-15:c+15]$, Blind Boundary Detector v8.3B  
**Models:**
- Generative Coding Intelligence: `qwen2.5-coder:14b` (Local Ollama, 14B parameters, zero temperature)
- Decision Intelligence: `mlx-community/Qwen3-4B-Instruct-2507-4bit` (MLX 4-bit, direct candidate logit scoring, frozen from Phase 4)  
**Phase State:** Phase 8.J0 Frozen; Phase 8.J1 Complete  

---

## 1. Executive Summary & Core Finding

This prospective experiment investigated whether **historical JUG's decision mechanism becomes useful when WTF removes the deterministic work that JUG previously forced intelligence to perform**.

In historical JUG (Phases 1–4), the decision layer collapsed either into uniform entropy collapse (Phase 2, Kev-0.5B, $p \approx 0.25$ flat across all turns) or extreme false finish pressure (Phase 4, Qwen3-4B, $p(\text{finish}) > 0.9998$ on Turn 1). Phase 8.J0 hypothesized that JUG failed primarily because it was forced to do deterministic work: deciding whether to verify, searching for failure coordinates, tracking diffs, and diagnosing stagnation.

In Phase 8.J1, we deployed **the exact same rocket onto WTF's frozen launchpad**:
- **WTF Substrate:** Deterministic failure coordinate extraction, trace slicing, bounded context viewports ($[c-15:c+15]$), Verify-on-Write (`vow`), Action Compiler v0 patch normalization, and Blind Boundary Detector v8.3B.
- **Controlled Independent Variable:** The residual JUG-v2 decision mechanism (`OFF` in Control vs `ON` in Treatment) operating across 10 pre-frozen benchmark tasks from the canonical `taskset_6_3_v1` cohort (Python, Go, Rust, TypeScript).

### The Primary Causal Result:
$$\text{Control Passes: } 4/10 \quad \text{vs} \quad \text{Treatment Passes: } 4/10 \quad (\Delta \text{Pass Rate} = 0.0\%)$$
$$\text{FAIL} \to \text{PASS Rescues: } 0 \quad | \quad \text{PASS} \to \text{FAIL Regressions: } 0$$
$$\text{Control Generative Tokens: } 371,634 \quad \text{vs} \quad \text{Treatment Generative Tokens: } 299,531 \quad (-19.4\%)$$
$$\text{JUG Decision Overhead: } 61 \text{ calls, } 7,293 \text{ decision tokens, } 53.6\text{s decision latency}$$

### Epistemic Verdict:
1. **Capability Lift:** **Zero.** JUG-v2 did not rescue a single failing task or improve mutation accuracy.
2. **Efficiency Effect:** **Minor Marginal Substitution ($19.4\%$ token reduction on non-solving trajectories).** On initial turns where deterministic coordinates existed, JUG confidently chose `inspect`, allowing WTF to directly fulfill the viewport without invoking the 14B model (saving 4 generative calls across 61 turns).
3. **The Intrinsic Bimodal Attractor Pathology:** When WTF removed false finish pressure, JUG did not become a nuanced decision engine. Instead, its candidate distribution collapsed into a rigid **bimodal attractor**: across all 61 decisions, JUG selected exclusively `inspect` (34 turns) or `verify` (27 turns). It allocated $0.00\%$ probability to `modify`. When an agent became stuck in a mechanical patch failure, JUG remained frozen in an infinite `inspect` loop ($p \approx 0.9525$ every turn).
4. **Decision Layer Role:** **REDUNDANT.** Once WTF deterministically compiles verification (via Verify-on-Write) and coordinates (via Trace Slicing), a separate discrete decision model adds no autonomous problem-solving utility.

---

## 2. Experimental Architecture & Pre-Registered Controls

### 2.1 Independent Variable: Frozen JUG-v2
The decision layer was reconstructed directly from Phase 4 without tuning, modifications, or hindsight optimization:
- **Model:** `mlx-community/Qwen3-4B-Instruct-2507-4bit`
- **Ontology:** 4 discrete candidates: `[inspect, verify, modify, finish]`
- **Mechanism:** Direct candidate logit scoring via MLX on the prompt continuation `Choice: A) inspect | B) verify | C) modify | D) finish`
- **Confidence Thresholds:** Pre-registered top probability $p \ge 0.60$ and top margin $\Delta \ge 0.30$
- **Input:** Token-dense WTF evidence (`CHANGE`, `VERIFICATION`, `DIAGNOSTIC`, `UNKNOWN intent`)

### 2.2 Frozen WTF Substrate
Work compiled away from probabilistic intelligence:
- **Verification Triggering:** `Verify-on-Write` automatically executes test suites upon successful file mutation. The model is never asked *"Should I verify?"*.
- **Failure Localization:** Deterministic trace parsers locate file and line coordinates directly from test runner outputs. The model is never asked *"Where is the bug?"*.
- **Stagnation Diagnosis:** `BlindBoundaryDetectorV83B` detects loops and consecutive failed edits deterministically.
- **Context Bounding:** Bounded viewport slices ($[coord - 15 : coord + 15]$) prevent context bloat.

### 2.3 Residual Decision Surface
What JUG was permitted to control:
1. **Initial Viewport Substitution:** If JUG confidently selects `inspect` on Turn 1 and a deterministic coordinate exists, directly show the trace viewport and bypass the 14B generative model call.
2. **Terminal Acceptance:** If JUG confidently selects `finish` following clean Verify-on-Write execution, finalize task without prompting generative intent review.
3. **Generative Model Bounding / Escalation:** When JUG selects `modify` or `inspect`, pass bounded state to generative model; when unconfident, escalate to full generative planning.

---

## 3. Paired Task Results

The 10 pre-frozen tasks evaluated across both conditions:

| Task ID | Ecosystem | Control Result (WTF Only) | Treatment Result (WTF + JUG) | JUG Direct Subs | Generative Token $\Delta$ | Causal Delta |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `task-01-python-starlette-status-code` | Python | **PASS** (3 turns, 4,517 tok) | **PASS** (3 turns, 4,517 tok) | 0 | 0 ($0.0\%$) | **NEUTRAL** |
| `task-02-python-marshmallow-url-fragment`| Python | **FAIL** (8 turns, 41,517 tok) | **FAIL** (8 turns, 27,267 tok) | 1 | -14,250 ($-34.3\%$) | **NEUTRAL (Cost $\downarrow$)** |
| `task-03-python-click-synopsis-brackets` | Python | **FAIL** (8 turns, 114,632 tok) | **FAIL** (8 turns, 110,983 tok) | 1 | -3,649 ($-3.2\%$) | **NEUTRAL** |
| `task-04-python-precommit-stages-context`| Python | **PASS** (3 turns, 6,254 tok) | **PASS** (3 turns, 9,570 tok) | 1 | +3,316 ($+53.0\%$) | **NEUTRAL (Cost $\uparrow$)** |
| `task-05-go-sjson-trailing-bracket` | Go | **FAIL** (8 turns, 75,300 tok) | **FAIL** (8 turns, 17,673 tok) | 1 | -57,627 ($-76.5\%$) | **NEUTRAL (Cost $\downarrow$)** |
| `task-06-go-cmp-textual-byte-slices` | Go | **PASS** (5 turns, 16,900 tok) | **PASS** (5 turns, 16,900 tok) | 0 | 0 ($0.0\%$) | **NEUTRAL** |
| `task-08-go-gjson-empty-query` | Go | **PASS** (2 turns, 14,296 tok) | **PASS** (2 turns, 14,296 tok) | 0 | 0 ($0.0\%$) | **NEUTRAL** |
| `task-09-rust-walkdir-skip-dir` | Rust | **FAIL** (8 turns, 19,013 tok) | **FAIL** (8 turns, 19,013 tok) | 0 | 0 ($0.0\%$) | **NEUTRAL** |
| `task-12-node-plimit-detached-map` | Node/TS | **FAIL** (8 turns, 19,076 tok) | **FAIL** (8 turns, 19,186 tok) | 0 | +110 ($+0.6\%$) | **NEUTRAL** |
| `task-13-node-is-numeric-whitespace` | Node/TS | **FAIL** (8 turns, 60,129 tok) | **FAIL** (8 turns, 60,126 tok) | 0 | -3 ($0.0\%$) | **NEUTRAL** |

---

## 4. Forensic Telemetry & Decision Pathology Analysis

Across the 61 executed turns in Treatment, every single JUG candidate probability distribution, top choice, margin, and Shannon entropy was recorded.

```
Total Decisions Logged: 61
Selected Candidate Breakdown:
  • inspect: 34 / 61 (55.7%)
  • verify:  27 / 61 (44.3%)
  • modify:   0 / 61 (0.0%)
  • finish:   0 / 61 (0.0%)

Mean Entropy: 0.2667 nats (Theoretical max for 4 choices: 1.386 nats)
Mean Top Probability: 0.9067 (90.7% average confidence)
Confidence Threshold Passes: 61 / 61 (100.0% satisfied p >= 0.60, margin >= 0.30)
False Finish Pressure Events: 0 (0.0%)
```

### 4.1 What WTF Successfully Cured: Elimination of False Finish Pressure
In Phase 4, JUG exhibited catastrophic premature finish confidence: on Turn 1 of freshly initialized tasks where baseline tests passed, Qwen3-4B assigned $p(\text{finish}) > 0.9998$, forcing 0 edits.
- **In Phase 8.J1, False Finish Pressure was 0/61 (0.0%).**
- Because WTF's evidence protocol strictly binds verification to test execution outcomes (`VERIFICATION tests FAIL`), JUG never attempted to emit `finish` while tests were failing.

### 4.2 The Persistent Pathology: The Bimodal Attractor ($0\%$ Modify)
While false finish pressure was eliminated, JUG did **not** achieve nuanced decision capability. Instead, it collapsed into a rigid binary partition based entirely on syntax tokens in the WTF evidence string:
1. **If the diagnostic snippet contained standard assertion diffs (`FAILED ... assert x == y`)**, JUG assigned $p(\text{inspect}) \approx 0.9525$ with near-zero entropy ($H \approx 0.19$ nats).
2. **If the diagnostic snippet contained compiler or stack trace symbols (`Error: ... at line ...`)**, JUG assigned $p(\text{verify}) \approx 0.9820$ ($H \approx 0.09$ nats).
3. **In zero instances ($0/61$) did JUG ever select `modify`.**
4. Across failing loops (such as Task 2, Task 3, and Task 5), JUG remained frozen in an **infinite `inspect` attractor**. Because the evidence string remained identical between failed mutation attempts, JUG re-emitted $p(\text{inspect}) = 0.9525$ turn after turn. It possessed zero memory, zero stateful trajectory awareness, and zero ability to recognize that further inspection was fruitless.

---

## 5. Workload Decomposition & Efficiency Analysis

| Expenditure Metric | Control (WTF Only) | Treatment (WTF + JUG) | Delta ($\Delta$) | Interpretation |
| :--- | :--- | :--- | :--- | :--- |
| **Pass Rate** | 4 / 10 (40.0%) | 4 / 10 (40.0%) | 0.0% | Zero capability difference |
| **Total Turns** | 61 | 61 | 0 | Same turn consumption |
| **Generative Model Calls**| 61 | 57 | -4 (-6.6%) | 4 Turn-1 calls bypassed |
| **Generative Tokens** | 371,634 | 299,531 | -72,103 (-19.4%) | Tokens saved via bypassed reads |
| **JUG Decision Calls** | 0 | 61 | +61 | Added decision overhead |
| **JUG Decision Tokens** | 0 | 7,293 | +7,293 | Local decision compute |
| **Wall Clock Time** | 3,379.1s (56.3m) | 3,031.1s (50.5m) | -348.0s (-10.3%) | Slight wall-clock reduction |

### Why Did Tokens Decrease by $19.4\%$ Without Improving Capability?
On 4 tasks (`task-02`, `task-03`, `task-04`, `task-05`), JUG confidently selected `inspect` on Turn 1. Because WTF already possessed deterministic failure coordinates from the initial test run, the harness directly injected the trace viewport into the conversation without invoking the 14B coding model for an exploratory read. 
- In Task 5 (`go-sjson-trailing-bracket`), this prevented the 14B model from generating an initial full-file dump, saving 57,627 tokens.
- **However, this did not improve task resolution.** In all 4 instances, the downstream coding model still failed to synthesize the correct patch when it encountered complex semantic constraints. The token savings were purely a byproduct of skipping an initial exploratory prompt—a function that WTF's deterministic compiler already performs via Compiled Handoff.

---

## 6. Evaluation of the Three-Regime Hypothesis

Phase 8.J0 posed the question:
> *Does Regime 1 (Bounded Probabilistic Decision Intelligence) demonstrate independent empirical utility between Regime 0 (Deterministic Computation) and Regime 2 (Generative Intelligence)?*

Based on Phase 8.J1:

### Regime 0 (Deterministic Substrate): Fully Validated
- Deterministic coordinate extraction, trace slicing, action compilation, Verify-on-Write, and boundary detection performed with 100% mechanical reliability across all 10 tasks.
- Every successful task passed because Verify-on-Write verified the patch immediately upon authoring.
- Every failed task was bounded by mechanical patch mismatch or genuine semantic failure.

### Regime 2 (Generative Synthesis): Fully Validated
- Synthesizing code edits (`replace_in_file`), analyzing complex control flow, and formulating bug hypotheses required generative reasoning.

### Regime 1 (Standalone Decision Intelligence): **NOT SUPPORTED**
- When deterministic computation (Regime 0) compiles away verification triggering and search coordinates, the remaining decision space for a discrete router (`inspect` vs `modify`) is either:
  1. **Deterministically Obvious:** If tests fail and coordinates are known, an edit is required (Regime 0). If tests pass, work is complete (Regime 0).
  2. **Intrinsically Generative:** Formulating *what* to edit or *how* to resolve the failure requires code synthesis (Regime 2).
- Squeezing a language model into an abstract 4-choice router created an artificial intermediate layer that suffered from bimodal probability polarization ($0\%$ modify, $95\%$ inspect attractor) without adding any autonomous capability.

---

## 7. The Historical Counterfactual: Rocket vs Launchpad

| Historical JUG Pathology | Phase 4 (Raw JUG) | Phase 8.J1 (JUG-v2 + Frozen WTF) | Root Cause Verdict |
| :--- | :--- | :--- | :--- |
| **Premature Finish Pressure** | Critical: $p(\text{finish}) > 0.9998$ on Turn 1; aborted tasks with 0 edits. | **Completely Cured (0/61, 0.0%)**. JUG never chose finish while tests were red. | **Launchpad Flaw.** JUG was asked to evaluate completion without deterministic verification receipts. |
| **Context Bloat & Truncation** | Critical: 12k token context windows crashed local MLX runners. | **Completely Cured.** Viewport bounded to $<400$ tokens. | **Launchpad Flaw.** Solved by WTF's bounded context viewport. |
| **Manual Verification Loops** | Frequent: Model called `npm test` repeatedly without editing files. | **Completely Cured.** Verify-on-Write eliminated manual test execution turns. | **Launchpad Flaw.** Solved by WTF's Verify-on-Write. |
| **Distribution Polarization** | High: Extreme confidence spikes on single tokens. | **Persistent.** Softmax logits polarized to $>0.95$ on `inspect` or `verify`, $0.0\%$ on `modify`. | **Rocket Flaw.** Next-token logit scraping over discrete tokens in an autoregressive LM is intrinsically miscalibrated. |
| **Stagnation / Thrashing Blindness**| High: Model repeated failed edits 8 times without stopping. | **Persistent in JUG.** JUG re-emitted $p(\text{inspect}) = 0.9525$ across 8 stagnant turns. (Only cured externally when WTF's boundary detector stepped in). | **Rocket Flaw.** A stateless candidate-scoring head cannot track progress or detect stagnation. |

---

## 8. Jev Gate Classification

According to the pre-registered decision rules:
- *If JUG-v2 provides useful residual value: REAL JEV TEST = JUSTIFIED*
- *If JUG-v2 remains limited specifically by calibration/decision architecture: REAL JEV TEST = STRONGLY JUSTIFIED*
- *If deterministic WTF makes JUG redundant: REAL JEV TEST = DEFER*
- *If evidence suggests bounded decision intelligence itself adds no value: REAL JEV TEST = NOT JUSTIFIED UNDER CURRENT TASK DOMAIN*

### Gate Verdict: **DEFER**
**Rationale:**
WTF's deterministic substrate (Regime 0) already accomplishes what JUG was intended to do: it eliminates redundant verification calls, extracts coordinates, bounds context, and detects stagnation. When those deterministic responsibilities are compiled away, the remaining bottleneck in local code repair is **code synthesis capability (Regime 2)**, not coarse operational routing between `inspect` and `modify`. 

Testing proprietary non-autoregressive decision engines (such as TypeSafe Jev) inside local single-task repair loops would test an optimization for a problem that WTF has already solved deterministically. Jev testing should only be reconsidered if WTF encounters multi-candidate routing problems (e.g., dynamic portfolio selection across 20+ specialized agents) where the candidate space cannot be bounded by deterministic rules.

---

## Final Phase 8.J1 Summary Block

```markdown
PHASE 8.J0: FROZEN
PHASE 8.J1: COMPLETE

PAIRED TRIALS:
10

RESIDUAL JUG DECISIONS:
1. Turn-1 viewport bypass on confident inspect
2. Terminal finish bypass on verified clean test execution
3. Bounded operational prompt escalation (modify vs inspect)

WTF-ONLY PASSES:
4/10

WTF+JUG PASSES:
4/10

FAIL→PASS:
0

PASS→FAIL:
0

WTF-ONLY GENERATIVE TURNS:
61

WTF+JUG GENERATIVE TURNS:
61

WTF-ONLY GENERATIVE TOKENS:
371634

WTF+JUG GENERATIVE TOKENS:
299531

JUG DECISION CALLS:
61

JUG DECISION OVERHEAD:
7293 tokens | 53.6s wall time

TOTAL INTELLIGENCE EXPENDITURE:
Control: 371,634 tokens (3,379.1s) vs Treatment: 306,824 total tokens (3,031.1s) [-17.4% net tokens, -10.3% wall time]

ENTROPY COLLAPSE:
NOT OBSERVED (Mean entropy H = 0.267 nats, no 25/25/25/25 collapse)

FALSE FINISH PRESSURE:
NOT OBSERVED (0/61 turns emitted false finish; completely cured by WTF verification contracts)

DECISION CALIBRATION:
POLARIZED BIMODAL ATTRACTOR (100% of choices polarized to inspect [55.7%] or verify [44.3%]; modify received 0.0%)

CAPABILITY EFFECT:
ZERO LIFT (4/10 vs 4/10, delta = 0.0%)

EFFICIENCY EFFECT:
MARGINAL COMPUTATIONAL SUBSTITUTION (-19.4% generative tokens via Turn-1 deterministic viewport injection)

REGIME 1 EMPIRICAL UTILITY:
NOT SUPPORTED UNDER LOCAL TASK REPAIR

HISTORICAL JUG FAILURE EXPLAINED BY WTF:
PARTIAL (WTF cured false finish pressure, context bloat, and manual verification tax; but JUG's intrinsic logit polarization and stagnation blindness remain unfixable by launchpad alone)

JUG DECISION MECHANISM:
REDUNDANT (Deterministic compilation renders discrete operational decision layers unnecessary in single-agent repair loops)

REAL JEV TEST:
DEFER

NEXT CAUSAL QUESTION:
Does bounded decision intelligence demonstrate utility when selecting among discrete generated patch candidates, or is decision intelligence strictly redundant when deterministic verification is cheap?
```
