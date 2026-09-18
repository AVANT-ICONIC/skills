# Futurequake Report Format

Use this structure for a completed run. Keep the final report compact enough to drive a decision, with detailed evidence available underneath each scenario when needed.

## Header

```text
FUTUREQUAKE
Repository: <repo>
Mode: Standard | Compare | Targeted
Ref(s): <exact commit/ref>
Run date: <date>
Scenarios executed: <n>
```

## 1. Executive result

State:

- the strongest recurring architectural strength;
- the strongest recurring fault line;
- confidence level for each;
- whether any result is invalidated by environment/baseline problems.

Do not begin with a numeric score.

## 2. Quake set

| ID | Future requirement | Plausibility | Pressure family | Outcome |
|---|---|---|---|---|
| Q1 | ... | likely | local extension | complete |

Include one sentence explaining why each scenario was selected.

## 3. Baseline health

Record:

- exact baseline commit(s);
- dirty/clean baseline state;
- build/test checks run;
- pre-existing failures;
- important environment constraints.

## 4. Per-scenario evidence

For every valid scenario:

```text
### Q<n> - <short title>

Requirement
<future requirement>

Outcome
complete | partial | blocked-structural | blocked-environment | invalid-scenario

Natural owner
<concept/module>

Objective footprint
- files touched:
- additions/deletions:
- architectural areas touched:
- existing tests modified:
- contracts changed:
- schema/config/dependency changes:

Resistance evidence
- unrelated areas forced into change:
- workarounds/special cases:
- hidden coupling discovered:
- verification friction:
- failed/reversed implementation paths, if meaningful:

Interpretation
<what this scenario says and does not say about the architecture>
```

## 5. Recurring fault lines

Group evidence across scenarios.

Example:

```text
FAULT LINE: Provider capability leaks into global app state
Evidence: Q1, Q3, Q5
Confidence: Strong
Observed pattern:
- ...
- ...
```

Do not create a fault line from one aesthetic preference.

## 6. Architectural strengths

Futurequake should also report what absorbed change well.

Example:

```text
STRENGTH: Export format extension boundary
Evidence: Q2, Q4
Both changes remained inside exporter + registration with no caller changes.
```

This prevents the method from becoming a defect generator with a volcano logo.

## 7. Recommendations

For each recommendation:

```text
Recommendation
<smallest architectural move>

Evidence
<Q IDs and observed pattern>

Expected effect
<which future changes should become more local>

Risk
<what could become more complex or over-generalized>
```

Do not automatically implement recommendations.

## 8. Compare mode delta

Only in Compare mode:

| Scenario | Ref A | Ref B | Evidence-backed delta |
|---|---|---|---|
| Q1 | high resistance | low resistance | B localizes provider change |

Then summarize only patterns repeated across comparable scenarios.

## 9. Excluded evidence

List:

- invalid scenarios;
- blocked-environment scenarios;
- pre-existing failures;
- telemetry that was unavailable or incomparable.

## 10. Cleanup

Explicitly confirm:

```text
Baseline unchanged: yes/no
Disposable worktrees removed: yes/no
Disposable local branches removed: yes/no
Remote quake branches created: none / <list>
Leftovers requiring manual cleanup: none / <list>
```
