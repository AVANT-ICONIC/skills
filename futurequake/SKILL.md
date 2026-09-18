---
name: futurequake
description: Empirically test a real repository's architectural changeability by generating realistic future-change scenarios, implementing them in disposable isolated worktrees, measuring the resistance, deleting every experiment, and optionally comparing two refs with the same quake set. Use for architecture evaluation, refactors, extension-point design, modularity/evolvability questions, or checking whether a PR makes future changes harder. Do not use for ordinary feature implementation, code review, or speculation without a real repository.
compatibility: "Requires access to a git repository plus safe isolated worktrees or equivalent sandboxing. Python 3 is optional for the bundled metrics helper."
---

# Futurequake

Test tomorrow by changing the code today, then throw the change away.

Futurequake is **executable modifiability testing**. Do not infer that an architecture is easy to evolve because it looks clean. Create realistic bounded future changes, attempt real implementations in isolated disposable worktrees, measure what the current architecture forces the implementer to touch or work around, and remove all experimental code after evidence is captured.

## Core rule

```text
Do not estimate changeability when a disposable implementation experiment can measure it.
```

The experiment is the product of this skill. The fake feature is not.

## When to use

Use Futurequake when the user needs evidence about:

- whether an architecture is genuinely easy to extend;
- whether a proposed refactor improves modifiability;
- whether an extension point is real or decorative;
- where future product changes are likely to create cross-cutting edits;
- whether a pull request improves today's behavior while worsening tomorrow's change cost;
- which architectural boundary would remove repeated change friction;
- how a real repository reacts to plausible future requirements.

Do not use Futurequake for:

- ordinary implementation of a requested feature;
- ordinary code review or bug fixing;
- hypothetical greenfield architecture with no repository to exercise;
- security penetration testing;
- destructive chaos testing of production systems;
- benchmarking model intelligence.

If the user merely wants an architectural opinion, use a lighter architecture review. Futurequake is justified when empirical change experiments are worth the extra work.

## Non-negotiable safety invariants

1. **Never mutate the user's baseline worktree for an experiment.**
2. **Never push quake branches or experimental commits unless the user explicitly asks.** Local disposable branches/worktrees are the default.
3. **Never merge a quake implementation.** A quake is evidence, not a shortcut to shipping work.
4. **Never run destructive production operations, migrations against live data, deployments, or external side effects merely to complete a quake.** Stub, sandbox, or stop instead.
5. **Record the baseline ref and baseline working-tree state before experiments.** If the baseline has uncommitted work, protect it and do not use commands that can overwrite it. By default, quake the committed ref rather than pretending dirty local edits are part of that ref.
6. **Remove disposable worktrees/branches after evidence is captured.** If cleanup fails, report the exact leftovers.
7. **Do not silently refactor the architecture during a scenario.** That changes the thing being measured.
8. **Do not write the Futurequake report or experiment artifacts into the target repository unless the user explicitly wants persistent repo artifacts.** Chat/output artifacts are the default.

Read [`references/measurement.md`](./references/measurement.md) before the first full run. Read [`references/scenario-design.md`](./references/scenario-design.md) whenever generating or selecting a quake set. Use [`references/report-format.md`](./references/report-format.md) for final reporting.

## Modes

### Standard mode

Run one quake set against one exact repository ref.

Use it to identify recurring fault lines and estimate the repository's empirical resistance to likely evolution.

### Compare mode

Run **the identical quake set** independently against two exact refs, typically:

```text
main vs feature/refactor branch
before vs after architectural change
release A vs release B
```

Use the same scenario wording, acceptance conditions, implementation constraints, verification expectations, and attempt budget on both refs. Keep the executor/model/toolchain equivalent when practical. Prefer a fresh context for each `(scenario, ref)` run so knowledge from the first implementation does not coach the second.

Never generate easier scenarios for one side after seeing the other side's results. If execution conditions differ materially, disclose the limitation instead of presenting the comparison as controlled.

### Targeted mode

Constrain scenario generation to one architectural concern, such as:

- provider/plugin evolution;
- authorization policy;
- persistence backends;
- API versioning;
- offline behavior;
- observability;
- platform support;
- workflow/state-machine evolution.

Targeted mode still requires multiple distinct scenarios. It is not a disguised implementation of one requested feature.

## Phase 0: establish the experiment boundary

Before generating scenarios:

1. identify the repository and exact baseline ref/commit;
2. inspect repository instructions and contribution rules;
3. inspect working-tree cleanliness without changing it;
4. identify build/test/typecheck/lint commands from repository evidence;
5. identify relevant architecture docs, roadmap/specs, recent issues, extension points, and recent change history;
6. record environmental constraints that could invalidate experiments;
7. decide Standard, Compare, or Targeted mode;
8. freeze a fair attempt budget for the run when the runtime exposes one, or at minimum use the same stop conditions across scenarios and refs.

If the repository cannot be isolated safely, stop before mutation and report why. If the requested target exists only as dirty local edits, either test the committed ref or use a non-destructive snapshot mechanism that the user has authorized. Never stash, reset, commit, or otherwise rewrite the user's work merely to create a quake baseline.

Do not use hidden conversation memory as the source of truth when repository evidence exists.

## Phase 1: build the change model

Summarize only what is needed to generate realistic future pressure:

- major architectural boundaries;
- current extension mechanisms;
- areas with repeated product evolution;
- known roadmap direction;
- recently changed concepts;
- high-centrality shared modules or configuration surfaces;
- external integrations and replaceable infrastructure;
- important user-visible workflows.

Do not produce a generic repository tour.

The change model answers:

```text
What kinds of believable future requirements would force this architecture to reveal its true coupling?
```

## Phase 2: generate candidate future scenarios

Generate more candidates than will be executed. Use repository evidence first and generic evolutionary pressure second.

A strong candidate is:

- plausible for this product;
- behaviorally concrete;
- bounded enough to attempt;
- large enough to cross a meaningful architectural seam;
- independent from the other candidates;
- implementation-neutral;
- verifiable without production side effects.

Prefer a portfolio that includes different pressure shapes rather than five variants of the same extension.

Default candidate families are defined in [`references/scenario-design.md`](./references/scenario-design.md).

Reject scenarios that are:

- arbitrary rewrites or language/framework migrations with no product reason;
- impossible without an unresolved product decision;
- mostly visual polish;
- trivial one-file changes;
- giant multi-month epics;
- dependent on unavailable paid/external infrastructure;
- chosen specifically because the current architecture already supports them perfectly.

## Phase 3: select the quake set

Default to **5 scenarios**. Use 3 for a focused/expensive repository and up to 8 when experiments are cheap and the user wants deeper evidence.

A default five-scenario set should usually contain:

- 2 likely evolutionary changes grounded in repository/project evidence;
- 2 plausible cross-cutting or substitution changes;
- 1 adversarial-but-realistic change that stresses an assumption without becoming absurd.

For each selected scenario record:

```text
id
future requirement
why this future is plausible
observable acceptance conditions
important non-goals
expected architectural seam being exercised
invalidating external dependencies, if any
```

Do **not** record a predicted outcome such as "this will expose ProviderManager coupling." Predictions bias the implementation and interpretation.

Freeze the quake set before implementation starts.

In Compare mode, the frozen quake set is shared by both refs.

## Phase 4: calibrate the baseline

Before judging scenario failures:

1. run or inspect the strongest reasonable baseline verification;
2. record pre-existing failures;
3. confirm the repository can be built/tested sufficiently for the selected scenarios;
4. record relevant environment/tool versions when they can affect results.

A pre-existing broken test is not architectural resistance created by the quake.

## Phase 5: create isolated experiments

Create one isolated disposable worktree from the exact target ref per scenario. Use a unique local branch or detached worktree according to repository constraints.

Conceptually:

```bash
git worktree add <temp-path> -b futurequake/<run>/<scenario> <exact-ref>
```

Equivalent safe isolation is acceptable when git worktrees are unavailable.

Rules:

- one scenario per isolation boundary;
- no code sharing between scenarios;
- no cherry-picking a helpful fake implementation into another quake;
- start each scenario from the same exact ref in Standard mode;
- in Compare mode, start from the corresponding exact ref on each side;
- use fresh agent context for each implementation when the runtime permits it;
- preserve repository conventions and normal development constraints.

## Phase 6: attempt the future change

Implement the **smallest complete vertical slice** that satisfies the frozen scenario acceptance conditions.

While implementing:

- inspect before editing;
- do not deliberately choose the ugliest implementation to make the architecture look bad;
- do not proactively redesign the architecture to make the scenario easy;
- take the natural implementation route a competent maintainer would choose;
- allow small local refactors that are directly necessary for the change, but record them;
- record unexpected dependencies, duplicated logic, special cases, hidden ownership, contract breakage, and unrelated edits;
- keep the attempt bounded.

The purpose is to observe the current architecture's natural resistance, not to win against it at any cost.

### Attempt outcomes

Classify each scenario as one of:

- **complete** - acceptance conditions were met and verification is credible;
- **partial** - meaningful implementation exists but one or more acceptance conditions remain unmet;
- **blocked-structural** - completion appears to require disproportionate architectural change or an unresolved structural constraint;
- **blocked-environment** - tooling, credentials, external services, unavailable runtime, or baseline failures prevent a fair experiment;
- **invalid-scenario** - the scenario itself turned out not to be a valid modifiability probe.

Do not convert `blocked-environment` into evidence against the architecture.

Do not declare `blocked-structural` solely because one agent got confused. See the confirmation rule below.

## Phase 7: verify each experiment

Use the strongest reasonable evidence for the scenario:

- focused tests;
- type checking;
- lint/build;
- runtime checks;
- acceptance-scenario execution;
- diff inspection.

A quake that does not actually satisfy its acceptance conditions cannot be treated as a clean measurement of implementation cost.

If implementation is partial, measure the work performed but clearly separate completed evidence from projected remaining cost.

## Phase 8: collect the change fingerprint

Use the metrics in [`references/measurement.md`](./references/measurement.md).

At minimum capture:

### Objective footprint

- files touched;
- additions/deletions when meaningful;
- architectural areas/subsystems touched;
- existing tests modified;
- public/internal contracts changed;
- schemas/configuration/migrations changed;
- dependencies added or replaced.

### Resistance evidence

- unrelated owners/modules forced into the change;
- duplicated behavior or special cases introduced;
- bypasses/workarounds needed;
- unexpected coupling discovered;
- existing abstractions that failed to contain the change;
- repeated implementation reversals or failed approaches;
- verification friction caused by architecture rather than environment.

### Locality evidence

- where the change naturally belonged;
- how far it escaped that owner;
- whether one stable extension point absorbed most of the change;
- whether the implementer had to understand distant subsystems to make a local concept work.

If available, run:

```bash
python <futurequake-skill>/scripts/change-metrics.py --repo <quake-worktree> --base <baseline-ref>
```

The helper captures deterministic git-diff facts. It does not replace architectural interpretation.

## Confirmation rule for severe findings

Do not label a scenario a structural fracture merely because one execution failed.

For severe conclusions based substantially on agent difficulty rather than direct diff evidence, require at least one of:

- an independent second attempt from the same clean baseline;
- a second competent agent/context reaching the same structural blocker;
- direct repository evidence demonstrating that the required change necessarily crosses the claimed boundaries.

This prevents model failure from masquerading as architecture failure.

## Phase 9: interpret across scenarios

Look for **recurring resistance**, not isolated ugliness.

Strong findings usually have one or more of these shapes:

```text
different future changes repeatedly touch the same unrelated module
multiple scenarios bypass the same abstraction
one local concept requires knowledge of distant subsystems
contracts must be edited instead of extended
existing tests must be rewritten rather than extended
configuration/registration knowledge is duplicated across owners
one architectural decision expands the blast radius across otherwise unrelated futures
```

Treat a pattern seen in two or more independent scenarios as stronger evidence than a one-off result.

Do not recommend a generalized abstraction solely because one hypothetical future would benefit from it. Future-proofing can create its own architecture debt.

## Phase 10: Compare mode interpretation

For each scenario compare the two change fingerprints side by side.

Prefer evidence such as:

- fewer unrelated modules touched;
- stronger locality around the natural owner;
- fewer existing contracts edited;
- fewer special cases/workarounds;
- less test rewriting;
- a previously blocked scenario becoming straightforward;
- reduced repeated friction across several independent scenarios.

Raw line count alone is weak evidence. A clean explicit implementation may legitimately contain more lines than a brittle shortcut.

A ref should be described as an adaptability regression only when the same frozen scenarios show materially worse resistance evidence, not merely different code shape.

## Phase 11: recommend, do not refactor

The final recommendation should identify the **smallest architectural move justified by repeated experimental evidence**.

Good:

```text
Four of five scenarios forced provider-specific behavior through AppState and QueueService. A stable provider-capability boundary would localize those changes.
```

Bad:

```text
Create a universal abstraction layer because abstractions are good.
```

Futurequake does not automatically implement production architecture changes.

If the user wants to act on the finding, hand the evidence into their normal planning/spec/development workflow.

## Phase 12: destroy the experiments

After all evidence required from a quake has been saved:

1. remove the disposable worktree;
2. delete its disposable local branch if one was created;
3. confirm the original worktree/ref was not changed;
4. report any cleanup failure precisely.

Never delete user branches or uncommitted work while cleaning up.

## Reporting

Use [`references/report-format.md`](./references/report-format.md).

The report must include:

- exact refs tested;
- quake set and why each scenario was selected;
- baseline verification state;
- per-scenario outcome and change fingerprint;
- invalid/environment-blocked scenarios separated from architecture evidence;
- recurring fault lines;
- smallest evidence-backed architectural recommendations;
- in Compare mode, per-scenario before/after evidence;
- cleanup confirmation and any remaining disposable artifacts.

Do not collapse the result into one numeric architecture score by default.

## What Futurequake is not

Futurequake is related to scenario-based architecture analysis, modifiability analysis, evolutionary architecture, and stressor-driven architecture thinking. Those foundations matter; read [`references/foundations.md`](./references/foundations.md) when explaining the method or publishing results.

The distinguishing operating primitive is this:

```text
scenario -> isolated real implementation -> measured change fingerprint -> discard implementation
```

The value comes from making future change pressure executable against the actual repository.
