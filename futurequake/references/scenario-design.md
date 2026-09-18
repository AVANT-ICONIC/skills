# Futurequake Scenario Design

Use this reference when generating or selecting a quake set.

## Goal

A scenario is not a prediction contest. It is an instrument for applying believable change pressure to the current architecture.

The best scenarios are plausible enough that a maintainer could reasonably face them, but diverse enough to expose different forms of coupling.

## Evidence sources for plausibility

Prefer scenario seeds in this order:

1. explicit roadmap/spec/issue direction;
2. recurring recent feature changes;
3. existing extension points and provider interfaces;
4. TODOs or architecture notes describing expected evolution;
5. product/domain patterns strongly implied by current behavior;
6. generic software evolution pressures relevant to this system type.

Do not treat a random imaginative possibility as equal to a roadmap-backed future.

## Candidate families

### 1. Local extension

Add another member of an existing concept.

Examples:

- another provider/adapter;
- another export format;
- another notification channel;
- another payment method;
- another command/action type.

What it probes: whether the advertised extension boundary is real.

### 2. Policy change

Change a rule that should have one conceptual owner.

Examples:

- permission semantics;
- retry policy;
- rate limits;
- validation rules;
- pricing/entitlement behavior.

What it probes: whether policy is centralized or smeared across callers.

### 3. Infrastructure substitution

Replace or introduce an implementation behind an architectural boundary.

Examples:

- alternate persistence backend;
- queue implementation;
- cache provider;
- search backend;
- file/object storage provider.

What it probes: whether infrastructure boundaries are genuine.

### 4. Workflow evolution

Change a state machine or user-visible flow.

Examples:

- add approval state;
- support retry/resume;
- allow draft/publish;
- add cancellation/rollback;
- introduce partial completion.

What it probes: whether workflow state is explicit or encoded accidentally across UI/services/storage.

### 5. Cross-cutting capability

Introduce behavior that legitimately spans several areas.

Examples:

- audit trail;
- tenant isolation;
- feature flags;
- observability context;
- localization;
- offline behavior.

What it probes: whether cross-cutting concerns have coherent insertion points or require shotgun surgery.

### 6. Interface evolution

Change a contract while preserving compatibility expectations.

Examples:

- API versioning;
- optional/required field evolution;
- event schema evolution;
- backward-compatible plugin contract change.

What it probes: contract stability and adaptation boundaries.

### 7. Scale/concurrency pressure

Change operational assumptions without turning the run into a benchmark.

Examples:

- move from single-worker to multiple workers;
- process tasks concurrently;
- make operations idempotent;
- tolerate delayed/out-of-order events.

What it probes: hidden global state, ordering assumptions, and ownership.

### 8. Platform/integration expansion

Make one capability available through another platform or integration surface.

Examples:

- expose a desktop-only capability through API;
- add a second client platform;
- add a webhook/event consumer;
- introduce another identity provider.

What it probes: whether domain behavior is trapped inside one delivery layer.

## Scenario sizing

A useful quake should normally require more than one trivial edit but less than a broad product rewrite.

Good target:

```text
one coherent future requirement
one implementation attempt
one bounded acceptance surface
meaningful architectural seam
```

Too small:

```text
rename a button
add one enum value already supported end-to-end
change one CSS token
```

Too large:

```text
rewrite the entire app in another language
replace all infrastructure
build a new product line
```

## Quake-set diversity

Before freezing the set, build a quick overlap matrix.

If two scenarios exercise nearly the same files/concept for essentially the same reason, keep the stronger one and replace the other.

A good five-scenario set should normally span at least three candidate families.

## Likelihood labels

Use likelihood only to explain why a scenario belongs in the set:

- **likely** - directly supported by roadmap/issues/recent trajectory;
- **plausible** - consistent with product/domain evolution;
- **adversarial-realistic** - not currently planned, but credible and useful for stressing an architectural assumption.

Do not assign fake percentages.

## Acceptance conditions

Write acceptance conditions from observable behavior, not architecture wishes.

Good:

```text
WHEN a second queue backend is configured
THEN existing queue operations work through it without changing callers
```

Bad:

```text
THEN the architecture uses a clean strategy pattern
```

The latter predetermines the implementation and corrupts the experiment.

## Avoiding scenario bias

Do not reveal the architectural suspicion that motivated a scenario to the implementing agent when fresh-context execution is available.

Give the implementation agent:

- the future requirement;
- acceptance conditions;
- normal repository constraints;
- non-goals.

Keep the evaluator's hypothesis separate until after implementation evidence is collected.

## Invalid scenario triggers

Mark a scenario invalid rather than forcing it when:

- it requires a product decision the repository cannot answer;
- its value depends almost entirely on unavailable external infrastructure;
- it turns out already to be implemented;
- it does not meaningfully exercise architecture;
- the requirement is internally contradictory;
- implementation would require prohibited/destructive side effects.

Replace an invalid scenario only before implementation evidence from the remaining scenarios is interpreted. In Compare mode, replace it identically for both refs.
