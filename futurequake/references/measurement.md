# Futurequake Measurement Guide

Use this reference before collecting or interpreting quake evidence.

## Principle

Measure change **resistance**, not implementation size alone.

No single metric can represent architectural modifiability. Use a change fingerprint made from objective footprint plus evidence about locality, coupling, and workarounds.

## Deterministic footprint metrics

Capture where available:

| Metric | Meaning | Caution |
|---|---|---|
| Files touched | Breadth of edit surface | Generated/vendor files can distort it |
| Additions/deletions | Rough implementation magnitude | More lines are not automatically worse |
| Top-level areas touched | Cross-subsystem breadth | Directory structure may not equal architecture |
| Existing tests modified | Existing behavior/contracts disturbed | Some legitimate behavior changes require this |
| Test files added | New verification surface | Count says nothing about quality |
| Config files changed | Registration/config spread | Central config may be intentional |
| Schema/migration files changed | Persistence contract impact | Domain changes can legitimately require this |
| Dependencies added/removed | External coupling impact | One good dependency may reduce complexity |

The bundled `scripts/change-metrics.py` collects a portable subset from git.

## Architectural fingerprint fields

Record these explicitly for every scenario.

### Natural owner

Where should this behavior conceptually live if the architecture has a clear owner?

Examples:

- provider capability;
- authorization policy;
- queue abstraction;
- domain service;
- workflow/state machine.

### Escape radius

Which owners/subsystems outside the natural owner had to change?

List them. Do not merely say `high`.

### Contract pressure

Record contracts that required modification:

- public APIs;
- internal interfaces;
- event schemas;
- plugin protocols;
- database schemas;
- configuration formats.

Distinguish **extension** from **breaking/edit-in-place change**.

### Existing-test disturbance

Record why existing tests changed:

- expected behavior intentionally changed;
- brittle implementation coupling;
- fixtures duplicated architecture knowledge;
- test harness lacks an extension seam.

### Workarounds

List any implementation that exists mainly because the architecture lacked an appropriate route:

- conditionals on concrete provider/type;
- duplicate registration;
- bypassing an abstraction;
- reaching into global state;
- copy/pasting policy;
- special-case translation at an unrelated layer.

### Discovery burden

What distant repository knowledge was required to make the local concept work?

Evidence can include:

- hidden registration files;
- undocumented ordering assumptions;
- multiple sources of truth;
- implicit lifecycle hooks;
- runtime conventions not represented by interfaces/types/tests.

Do not convert token counts directly into architecture quality. Agent verbosity and runtime differ.

### Verification friction

Record architecture-caused obstacles to proving the change:

- impossible-to-isolate global state;
- tests requiring unrelated subsystems;
- inability to instantiate a component without production infrastructure;
- behavior only observable through large end-to-end setup.

Separate environment/setup failures from architecture-caused testability problems.

## Optional execution telemetry

If the runtime exposes reliable telemetry, record it as secondary evidence:

- elapsed active implementation time;
- tool calls;
- failed edit/test cycles;
- context resets;
- independent retries.

Never compare raw token/tool counts across different models or materially different runtimes as if they were architecture-only measurements.

## Qualitative resistance labels

Labels are summaries, not scores.

### Low resistance

The change stays near its natural owner, extends stable interfaces, requires little unrelated knowledge, and verifies locally.

### Moderate resistance

The change crosses a few justified boundaries or exposes some registration/test friction, but the architecture still provides a coherent route.

### High resistance

The change requires several unrelated edits, repeated contract modifications, duplicated policy, bypasses, or substantial distant knowledge.

### Structural fracture

Use sparingly. The scenario cannot be completed cleanly without changing a major architectural assumption or repeatedly crossing boundaries that should isolate the concept.

A structural-fracture label requires the confirmation rule from `SKILL.md`.

## Cross-scenario confidence

Use evidence tiers rather than fake precision.

### Strong

A similar resistance pattern appears in at least two independent scenarios and is supported by direct repository/diff evidence.

### Moderate

A clear problem appears in one scenario with strong direct evidence, or weakly across several scenarios.

### Tentative

The finding depends substantially on one agent's failed path, uncertain ownership, incomplete implementation, or noisy environment.

Tentative findings may guide another quake. They should not drive a major refactor alone.

## Compare mode

Compare like with like.

For each scenario, present both fingerprints and answer:

1. Did the change remain closer to its natural owner?
2. Were fewer unrelated areas changed?
3. Were fewer existing contracts disturbed?
4. Were fewer workarounds/special cases needed?
5. Was verification more local?
6. Did completion status improve or regress?

Do not declare a winner based on line count.

## Anti-metrics

Do not use these as standalone architecture scores:

- total lines changed;
- number of design patterns;
- file count;
- cyclomatic complexity of unrelated code;
- agent token usage;
- arbitrary weighted sums of everything above.

If a numeric composite is explicitly requested, show its formula and the raw evidence, and label it as a project-specific heuristic rather than a universal Futurequake score.
