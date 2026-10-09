# Rescue: reverse-engineer weak agency while preserving existing work

Use for existing games whose code, art, interface or world may be polished but repeated player actions do not produce meaningful choices. **Do not assume the game is bad because its owner says “boring”; treat that as a serious user report and diagnose mechanisms.** No private game project, identity, asset or benchmark content belongs in public examples.

## Evidence and inspection gate

When authorized and available, inspect in this order: project instructions/README and current repo state → input handlers and camera → state transitions/failure → gameplay loop, resources and upgrades → actual running interaction if available → existing art, UI, audio and reusable systems → existing tests/performance limits. Split a finding into **observed at runtime**, **verified in code**, **only documented**, **user report**, or **assumption**. Avoid invented source inspection. Never reset dirty working trees or produce a build just because the request asks for feedback.

## Diagnose the first weak decision (D00/D07/D11/D18)

1. List the first five physical actions players take and which state each action changes.
2. For each action, ask: Were there plausible alternatives? Could the player predict different consequences? Did the action impose opportunity cost or alter future strategy? Did feedback explain causality?
3. Run two consecutive short loops on paper or via actual game inputs. If identical input always dominates, isolate the first missing constraint. Differentiate input affordance problems from actual mechanical lack of choice.
4. Trace why upgrades and world feedback fail to change the game. Cosmetic unlocks alone cannot repair repeated empty clicking.
5. Identify what already works: assets, rendering, UI patterns, entities, maps, interactions, saves, multiplayer substrate, tests and input plumbing. Reuse when possible; do not propose a total rewrite by default.

## Three redesign directions with distinct agency

Unless owner asks for one, present three **equally complete** choices. Each includes: one-line appeal; conserved code/art/UI; new player verb and exact keyboard/controller/touch mapping; first minute and next action; short and long loop; scarce or time-limited decisions and failure; two strategies and why neither always dominates; changed progression/world reactions; smallest implementation surface and regression risk; **cheap disconfirming experiment**. Compare the mechanism itself: one might be routing under spatial constraints, another asymmetric cooperative signals, another timed bargaining under escalating threat. These are generic patterns, not prescribed solutions to any named game.

Do not add quests, currencies or enemies merely to increase feature count. A mechanic that reuses attractive scenes but makes the player *choose* differently may be better than a visual reboot. Trace each rescue direction to the existing architecture **only when actually inspected**; otherwise mark proposals as description-based guesses, with specific integration unknowns.

## D19: Living GDD author in rescue mode

For an owner-chosen direction **and an explicit SPEC request**, update the project's authoritative GDD/schema or produce a nonconflicting change proposal. Record: preserved behaviors, rejected ideas, new player-facing transitions, resource laws, UI feedback, acceptance tests, cut scope and migration concerns. If no such request exists, concept and critique are the deliverables; no 50-page GDD or repository changes.

## D21: Technical design bridge in rescue mode

Express architectural implications as **inspect-before-claim**: which input handler sends the action, which state stores the consequence, what renderer shows feedback, what saved values need migration, what tests detect regression, and what dependency would force an engine change. Label these as prospective if code isn't accessible. Do not promise support for a named engine or undocumented hook without confirming installed versions.

## Acceptance / anti-hallucination gate

A working screenshot/UI button proves only that it appears or responds; it doesn't prove a fun loop. The three options must differ in *what players choose and what states are changed*, not palette, story or marketing. Do not claim human enthusiasm without human play; a design remains a hypothesis until its cheapest falsifier is executed. Build nothing unless authorized. Preserve the original and all private source identifiers.
