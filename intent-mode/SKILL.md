---
name: intent-mode
description: Reconstructs user intent from brain dumps, fuzzy requests, ambiguous goals, or solution-shaped prompts before planning, specification, or implementation.
---

# Intent Mode

Reconstruct the real objective before solving it.

This skill is for rich but messy input: brain dumps, half-formed ideas, contradictory constraints, premature solution choices, scattered examples, or requests where the literal prompt may not yet describe the real problem.

The goal is not to make prompts prettier. The goal is to reduce semantic drift.

## Use this skill when

- the user provides a long brain dump;
- the request is ambiguous or internally inconsistent;
- the user proposes a solution but the underlying outcome is still unclear;
- important constraints are implied rather than stated;
- previous attempts or examples carry material context;
- planning or specification would otherwise start from an unstable interpretation.

Do not use it merely because a request is short.

Do not implement product code while this skill is active.

## Operating model

```text
raw context
  ↓
reconstruct intent
  ↓
separate facts / inferences / unknowns / contradictions
  ↓
resolve only material gaps
  ↓
define observable success
  ↓
stress-test interpretation
  ↓
handoff
```

## 1. Reconstruct, do not summarize

A summary compresses what the user said.

Intent reconstruction identifies what the user is trying to achieve.

Build an explicit model of:

- **Objective** — the outcome that matters;
- **Motivation** — the friction, opportunity, or failure being addressed;
- **Actors** — who uses, operates, or is affected by the result;
- **Constraints** — conditions that must remain true;
- **Success criteria** — observable evidence of success;
- **Non-goals** — things intentionally outside the target;
- **Assumptions** — unverified beliefs filling missing context;
- **Contradictions** — statements that cannot all be satisfied simultaneously;
- **Open decisions** — choices requiring user judgment;
- **Proposed solution** — the current implementation idea, when one exists.

Do not silently promote an inference into a requirement.

When useful, distinguish:

```text
desired outcome ≠ current proposed solution
```

The proposed solution may still be correct. It simply must not hide the actual objective.

## 2. Inspect available evidence

If a repository, document set, issue, specification, or other project source is available, inspect the relevant evidence before asking the user factual questions.

Use:

```text
retrievable fact → inspect
preference / intent → ask
```

Do not perform broad repository archaeology when a focused inspection answers the uncertainty.

## 3. Resolve only material gaps

Ask only questions whose answers could materially change:

- scope;
- behavior;
- architecture;
- acceptance criteria;
- risk;
- cost or implementation strategy.

Do not interview for ceremonial completeness.

When multiple questions are necessary, prefer independent questions before dependent ones.

If enough evidence already exists, ask nothing.

## 4. Define the finish line

Translate the reconstructed objective into observable success criteria.

Prefer outcomes such as:

```text
WHEN <relevant condition>
THEN <observable result>
```

Avoid success criteria that merely restate implementation steps.

Bad:

```text
Add a scheduling database.
```

Better:

```text
Two users cannot successfully reserve the same slot.
```

## 5. Stress-test the interpretation

Before handoff, challenge the reconstructed intent.

Check:

- the strongest plausible alternative interpretation;
- the assumption with the largest downside if wrong;
- whether a stated constraint is actually a preference;
- whether the success criteria measure the desired outcome;
- whether a previous failed approach has leaked into the requirements;
- whether the proposed solution is unnecessarily constraining the problem.

Report only material weaknesses.

Do not invent disagreement for appearance's sake.

## 6. Produce an Intent Brief

The primary output is a compact, inspectable Intent Brief:

```markdown
# Intent Brief

## Objective

## Motivation

## Actors

## Constraints

## Success criteria

## Non-goals

## Assumptions

## Contradictions

## Open decisions

## Proposed solution
```

Omit empty sections when that improves clarity.

Do not create or modify repository files unless the user requested persistent project changes or the active workflow already designates a planning artifact as writable.

If persistence is requested, update the existing source of truth instead of creating a competing document.

## Handoff

Route the result based on remaining uncertainty.

- **Planning:** material product, scope, architecture, workflow, or tradeoff decisions remain.
- **Specification:** intent and important decisions are already settled.
- **Direct execution:** the task is small, clear, and does not need a separate planning/specification stage.

The next agent or skill must inherit the Intent Brief rather than reconstructing the original request from scratch.

## Completion criteria

Intent Mode is complete when:

- the underlying objective is explicit;
- the solution is separated from the outcome where relevant;
- constraints, non-goals, assumptions, and contradictions are visible;
- success criteria are observable;
- only genuinely material open decisions remain;
- downstream work can proceed without reinterpreting the user's original input.
