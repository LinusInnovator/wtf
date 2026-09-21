# Observation Record: Large Diff Pressure & Attention Surface Density

**Date**: September 2026  
**Context**: Omnicap dogfooding and automated agent code refactoring / generation.  
**Status**: RESEARCH PRESSURE / OPEN PROBLEM

---

## 1. Observed Incident

In the Omnicap dogfood run, the change footprint reported in the receipt was:
```markdown
WTF-RECEIPT: v0.1 | base:415db84 | PARTIAL (0/1) | ATTENTION (12) | OBSERVED (+38355/-442, 225f)
```

225 files changed with +38,355 lines added and -442 lines deleted.

---

## 2. Product and Research Pressure

This massive change footprint reveals a fundamental tension in WTF's mission:

1. **Information Density vs. Token Exhaustion**:
   - An agent or human cannot read a 38,000-line diff.
   - Simply printing the top 8 files ([`src/formatters/agent.ts:90-97`](file:///Users/linus/Projects/WTF/src/formatters/agent.ts#L90-L97)) truncates 217 files with `... and 217 more files`, hiding potentially critical changes in mechanical obscurity.

2. **Categorical Filtering vs. Semantic Speculation**:
   - Today, WTF relies on simple static categories: `isMechanical` checks (e.g. lockfiles, license files) and specific regex detectors (`auth`, `db`, `deps`, `env`, `tests`, `hygiene`, `workflows`).
   - When a large architectural change occurs (e.g., vendor checkins, ML asset checkins, widespread code generation), regex heuristics either:
     - Generate dozens of low-value `ATTENTION` warnings, causing warning fatigue.
     - Or miss critical behavioral modifications that don't match pre-baked keywords.

---

## 3. The Core Open Question

> [!IMPORTANT]
> **Can WTF identify the small review surface that deserves human/agent attention without crossing the boundary from deterministic evidence into semantic speculation?**

- If WTF uses heuristics to rank "important" files, it introduces probabilistic bias and false certainty into an evidence engine.
- If WTF only reports raw line counts and truncated paths, it abdicates its compression goal on large real-world diffs.

This pressure remains an active research question. Solving it requires rigorous deterministic structural analysis (e.g. symbol graph impact, dependency boundary crossings, explicit interface changes) rather than ad-hoc heuristics.
