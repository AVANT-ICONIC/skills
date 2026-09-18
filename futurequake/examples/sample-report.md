# Example Futurequake Report

This example is illustrative. Names and numbers are fictional.

```text
FUTUREQUAKE
Repository: example/orchestrator
Mode: Standard
Ref: 7a31c2e
Scenarios executed: 5
```

## Executive result

**Strong fault line:** provider-specific behavior leaks into global orchestration state. Strong confidence: Q1, Q3, and Q5 independently required edits outside the provider boundary.

**Strong architecture strength:** output format extensions remained local to the exporter registry in Q2 and Q4.

No baseline failures invalidated the run.

## Quake set

| ID | Future requirement | Plausibility | Family | Outcome |
|---|---|---|---|---|
| Q1 | Add a provider with per-model quotas | likely | local extension | complete |
| Q2 | Add a machine-readable export format | plausible | local extension | complete |
| Q3 | Allow a provider to expose multiple worker pools | likely | workflow/interface evolution | complete |
| Q4 | Add streaming export | plausible | interface evolution | complete |
| Q5 | Apply provider-specific backoff without caller changes | adversarial-realistic | policy change | partial |

## Q1 - Provider with per-model quotas

**Natural owner:** provider capability layer

**Objective footprint**

- 11 files touched
- 5 architectural areas touched
- 3 existing tests modified
- provider interface changed
- global app-state schema changed

**Resistance evidence**

- quota semantics had to be duplicated in provider registry and queue scheduler;
- UI state imported a concrete provider type;
- existing provider abstraction exposed no capability metadata;
- verification required full scheduler setup rather than provider-local tests.

**Interpretation:** adding the provider was possible, but the advertised provider boundary did not contain provider behavior.

## Recurring fault line

### Provider capability leaks into orchestration state

Evidence: Q1, Q3, Q5  
Confidence: Strong

Each scenario began as a provider-local change but required edits to global state and queue orchestration. The repeated escape radius is stronger evidence than any one file-count result.

## Recommendation

Introduce one stable provider-capability contract consumed by orchestration, rather than teaching orchestration about concrete provider semantics.

Expected effect: Q1/Q3/Q5 should become provider-local plus registration changes.

Risk: do not generalize capabilities not supported by the observed scenarios.

## Cleanup

```text
Baseline unchanged: yes
Disposable worktrees removed: yes
Disposable local branches removed: yes
Remote quake branches created: none
Leftovers requiring manual cleanup: none
```
