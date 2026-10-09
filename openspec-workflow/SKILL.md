---
name: openspec-workflow
description: Routes non-trivial coding changes through OpenSpec's native change lifecycle. Use when a project already uses OpenSpec and the user asks for a feature, behavioral bug fix, refactor, migration, architecture change, or says to spec it, use OpenSpec, plan the change, or implement an OpenSpec change.
---

# OpenSpec Workflow

Use OpenSpec as the change workflow, not as a Markdown export step after planning is already finished.

The purpose of this skill is routing and policy. It does **not** replace or fork OpenSpec's official skills, commands, schemas, or generated instructions.

## Core rule

For a project that already uses OpenSpec:

```text
non-trivial code change
        ↓
understand the change in OpenSpec
        ↓
agree on the change before code outruns it
        ↓
implement from the change
        ↓
verify against the change
        ↓
archive when complete
```

OpenSpec is iterative, not a rigid waterfall. Artifacts may be revised when evidence changes. The important boundary is that implementation must not silently invent a different product contract than the current change describes.

## Activate this skill when

Use this workflow for a coherent code change that has meaningful behavior, scope, architecture, compatibility, migration, acceptance, or cross-module implications, including:

- new capabilities and features;
- behavioral bug fixes where the correct behavior must be defined;
- non-trivial refactors;
- migrations and breaking changes;
- architecture or interface changes;
- work that will be delegated across fresh-context agents;
- any change where ambiguity before implementation would be expensive.

Also activate when the user explicitly asks to use OpenSpec, spec a change, or continue an existing OpenSpec change.

Do not force OpenSpec onto a truly mechanical edit with no meaningful behavioral or architectural choice, such as an obvious typo or equivalent one-line correction.

When uncertain, prefer OpenSpec if the work can change observable behavior or requires more than a purely mechanical edit.

## Do not initialize OpenSpec silently

First inspect the project.

If it already has an OpenSpec root, config, store declaration, generated skills, or established OpenSpec conventions, use them.

If the project does not use OpenSpec, do not create an `openspec/` root merely because this skill auto-selected. Initialize or adopt OpenSpec only when the user explicitly requests that setup or the surrounding workflow has already authorized it.

## Use the native OpenSpec workflow

Inspect the project's current OpenSpec configuration and the official OpenSpec skills or commands available in that environment. Prefer those native instructions over hard-coded assumptions in this skill.

Current OpenSpec is schema-driven. Do not assume every project uses the same literal artifact files.

Conceptually, the common spec-driven flow is:

```text
explore, when needed
        ↓
proposal → specs → design → tasks
        ↓
apply
        ↓
verify, when available / appropriate
        ↓
archive
```

The familiar artifacts mean:

- **proposal** — why the change exists, scope, non-goals, impact;
- **specs** — observable requirements and scenarios;
- **design** — implementation approach, interfaces, constraints, tradeoffs;
- **tasks** — implementation slices derived from the agreed design.

Do not reimplement official OpenSpec skill bodies here. Route to them.

## Choose the entry point from uncertainty

### Fuzzy or consequential request

Use OpenSpec Explore, or the environment's equivalent native explore workflow, when material questions remain about desired behavior, scope, architecture, compatibility, or acceptance.

Explore is thinking, repository inspection, and clarification. It is not implementation.

### Clear request

Use OpenSpec Propose, or the equivalent native proposal workflow, when the intended behavior and material decisions are already clear enough to define the change.

A proposal step may still ask focused questions when ambiguity would materially alter the result.

### Existing change

If a relevant OpenSpec change already exists, update or continue that change. Do not create a duplicate change merely because a new chat or agent started.

## Planning boundary

Creating or revising a change is planning work.

Do not edit product code in the same operation that is still establishing the change contract. Finish the planning artifacts, surface material unresolved decisions, and let the human or authorized workflow agree that implementation may proceed.

Once implementation begins, the canonical OpenSpec change is the source of truth for that unit of work.

## Implementation boundary

Implement through the project's native OpenSpec apply workflow when available.

During implementation:

- work from the current change rather than from vague chat memory;
- implement coherent vertical behavior, not disconnected scaffolding;
- keep tasks and evidence aligned with actual progress;
- do not create helper scripts to repair helper scripts when a direct product-code change is available;
- do not broaden scope merely because adjacent cleanup is tempting.

If implementation discovers a new technical fact that preserves intended behavior, update the design coherently.

If it discovers a material change to behavior, scope, compatibility, acceptance criteria, or user-visible contract, update the OpenSpec change before continuing. Do not let code silently become the new specification.

## One coherent change, not one giant project dump

OpenSpec changes are incremental units of work.

Do not respond to a greenfield project by producing one enormous frozen specification for the entire imagined product unless the user explicitly wants that scope.

Prefer a small current truth plus focused changes that can be proposed, implemented, verified, archived, and then followed by the next change.

For brownfield projects, inspect existing behavior and specify only the capabilities the current change actually touches. Do not attempt to document the entire application before useful work can begin.

## Avoid competing truth stores

Do not create parallel `PLAN.md`, `SPEC.md`, handoff documents, or duplicated requirement ledgers when the OpenSpec change already carries that information.

Other project systems may remain authoritative for things OpenSpec does not own, such as issue identity, release gates, approvals, evidence, or deployment policy. Record those boundaries rather than copying their truth into OpenSpec.

## Verification and archive

Before claiming implementation complete:

- compare the result against the change's observable requirements and scenarios;
- run the strongest available tests, type checks, builds, linting, runtime checks, or project-specific gates;
- use the native OpenSpec verify workflow when the installed profile provides it;
- record unavailable verification honestly.

Archive only after the implementation is genuinely complete and the project's required acceptance or quality gates are satisfied.

Archiving is not a substitute for verification.

## Handoff

When another agent continues, point it at the exact existing OpenSpec change and current implementation state.

The next agent must continue that change instead of restarting discovery, generating a replacement spec, or reinterpreting settled decisions from chat history.

## Completion

A successful OpenSpec workflow leaves:

- one clearly identified change;
- a coherent current contract;
- implementation that matches it;
- verification evidence;
- no duplicate shadow spec;
- an archived change when the project is actually finished with that unit of work.
