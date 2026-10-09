# Mechanic synthesis, formal rules and causal systems

Generate core play by designing state transitions, not adding genre labels to an image. The design needs a *player-visible cause* that influences what the player can do next.

## D07: Core loop designer

Define one complete loop as `observe state → choose among constrained actions → physically input → visible state change → new constraints/reward → observe again`. Name a typical interval (20–90 seconds), the 5-minute variation and a longer objective. If controls are abstract (“influence species”), go back and identify exact tap/drag/key targets. Run a written example with two consecutive cycles: what was learned or changed by the first so the second is not a mindless repeat?

**Example:** Drag one of three cargo beams onto the bridge to repair one gap; choosing heavy steel consumes the last transport slot, leaving the next gap reachable only by a risky alternate path. The next turn starts with a changed route graph, not the same puzzle with a higher number.

**Countercheck:** Test whether a player can name a different next action after the first cycle; if the state does not change their strategy, the loop may be decorative.

## D08: Rules formalizer

Write a compact state dictionary: resources, positions/ownership, active hazards, unlocked verbs, phase/time, success/failure. For each core input define precondition, cost, deterministic or stochastic transition, visible result and invalid-action feedback. Test boundaries: zero resource, full inventory, simultaneous events, undo/retry, impossible state, spam inputs and loss conditions. If rules can produce an unwinnable dead-end, decide whether that is intended and clearly telegraphed.

**Acceptance probe:** Simulate three choices on paper from a stated starting state; the resource totals and allowed next actions remain consistent. Do not hide contradictions behind “the engine handles it.”

## D09: Systems interaction mapper

Draw dependencies as directed effects: construction consumes materials → transport flow changes → scarcity moves → encounter positions shift → upgrade priorities change. Mark positive feedback, negative feedback, delays and thresholds. Test a perturbation: if one supply doubles, which player strategies become more valuable, and what counter-pressure restores interesting choices? Reject disconnected “evolution,” factions or weather systems that change flavor text but no decisions.

**Acceptance probe:** A second actor/creature/technology produces a causal effect across at least two interacting game systems. If adding it merely raises an output number without affecting choices, it is a decoration.

## D11: Game balance analyst (early heuristic)

For each important action list cost, reward, exposure to risk and conditions where it is a smart or poor choice. A dominant strategy exists if one action is never worse and sometimes better across feasible states. Repair by shifting timing, opportunity costs, counters, spatial demands or information availability, not by random nerfs alone. State what could still become dominant after real players optimize and how a test would detect it.

**Synthetic sanity case:** Heavy cargo is safest but slow and blocks a route; fragile cargo is fast but requires shelter. If heavy is cheaper, faster, safer and more useful in every state, the decision is fake; introduce context-dependent consequences.

## Mechanic divergence test

Three default directions must differ in central **agency**, not backdrop. Make a small comparison of each: primary verb, decision pressure, state affected, why the next minute changes. Distinct examples: spatial routing under scarcity, asymmetric cooperative information exchange, and timing-based risk commitment. If swapping the skin leaves the same repeated choice, regenerate a direction. Develop all three with equal conceptual integrity before showing them.
