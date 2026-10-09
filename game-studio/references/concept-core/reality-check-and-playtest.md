# Reality checks, prototypes, playtests and iteration memory

A concept is a *hypothesis*, not measured fun. The cheapest useful test can disconfirm it. Keep observations, model inferences and human reports separate; do not convert automated validity tests into taste scores.

## D15: Prototype scope definer

Identify the *single* interaction most likely to reveal whether the fantasy is engaging: a 30-second repeated choice under changing constraints. Prototype only enough inputs, state, feedback and consequences to test it. Stub decorative systems honestly; don't replace a required physical interaction with a narrated cutscene. Set a measurable observation, e.g. whether players change strategy after a route closes, not “everyone will love it.” A toy prototype must actually run before calling it playable.

**Decision gate:** If the candidate needs a fully simulated economy, cinematic visuals and multiplayer to even demonstrate one real choice, refine the hypothesis or find an earlier cheap falsifier.

## D16: Playtest protocol designer

Write task scripts without leading users: show the starting state and goal, observe attempted inputs, time to first meaningful action, repeated choices, help requests, error recovery, strategic switching, setbacks, comprehension of feedback, and voluntary re-engagement. Capture sample size, environment, participant familiarity, protocol version and actual statements when allowed. Ask diagnostic questions after behavior is observed; “Did you have fun?” alone is a weak primary measure.

**Evidence tiers:** automated agent/unit test → proves defined mechanics and constraints only; self-play → observer interpretation; independent tester action log → usability and behavior; consenting human playtest → experience reports. No tier alone establishes general enjoyment across an audience.

## D17: Design iteration tracker

Record the immutable baseline, user constraints, changed mechanics, predicted outcome, actual observed outcome, failed hypotheses and regressions. When a user rejects a feature, mark it explicitly and prevent silent reintroduction. Preserve the best-known playable version and rollback plan. A new feature that increases content while reducing number of meaningful player choices or strategies is not automatically an improvement.

**Mini-ledger:** v1 repeated always-safe option → test observed no switching → v2 introduced timed transport bottleneck → new test observed switching but confusion about timer → v3 improved telegraphing. This is an **illustration**, not actual playtest evidence.

## Falsifiable fun hypothesis protocol

For each serious concept state **why** a player might choose to repeat, **what you would observe if true**, **what would falsify it**, and **the cheapest experiment**. Include at least one alternative explanation, e.g., poor onboarding versus shallow choices, and the smallest test distinguishing them. An attractive screenshot or high concept-score does not falsify boredom. When a test does not resolve the hypothesis, report NOT_EVALUATED rather than inventing a positive result.
