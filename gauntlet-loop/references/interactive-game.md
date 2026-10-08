# Interactive software and gameplay verification

A running app with clickable controls is not necessarily usable or interesting. A passing simulation test does not show how a person experiences the interaction.

## Input → change → consequence trace

For each important user path, write one row:
| State/goal | exact input | immediate feedback | state change | alternative/tradeoff | consequence after repetition |

Actually exercise the input on the real app or an authorized representative runtime. Check pointer coordinates, DOM focus, keyboard, touch/controller if supported, disabled states, validation/error states, saves and responsive layout. Do not infer interactive success from button handlers alone.

For UI interactions, inspect representative states: default, hover/focus, click, loading, disabled, success, error, persistence/reload and navigation where relevant. Test with real application CSS/state rather than harness-only substitutes. Where accessibility is in scope, check keyboard path, focus visibility, labels and reduced-motion behavior.

## Canvas, WebGL and browser fidelity

A page successfully loading HTML **does not prove** a Canvas/WebGL scene rendered. The browser must support the actual GPU/canvas path (or a faithful software renderer with equivalent evidence), and screenshots must contain the genuine scene. Prefer project-proven browser harnesses over unverified generic alternatives. A DOM-only HTTP client, parsing browser or static HTML screenshot cannot satisfy WebGL visual or pointer-hitbox requirements.

Probe:
- renderer initialization and meaningful nonblank pixels;
- genuine game runtime state and animated frame progression;
- input hit testing on visible entities at matched coordinates;
- overlay/modal states, persistence and performance on target equipment if feasible;
- separate gameplay simulation invariants and observed player interaction.

## Game loop and agency

Inspect the *actual player task*, not whether all menu buttons can open. Ask:
- In first 60 seconds, what exactly does the player click, press, drag, tap or control?
- What differs between choice A and B?
- What situation can go wrong, and what can the player learn or do differently?
- What do they change in the world, not merely the UI?
- When the loop repeats for 5–15 minutes, do new problems/strategies/contexts emerge?
- Is there a dominant always-optimal action, a resource faucet with no relevant sink, or scripted idle watching mistaken for player agency?
- Does progression expand decisions, or just shorten timers/increase numbers?

A beautiful life-sim management display with workers operating on their own may still lack consequential decisions. Record weak links as design hypotheses; do not assume adding currencies, combat, content count or microtask buttons cures boredom.

## Kinds of evidence

- **Automated tests:** can show invariant conservation, deterministic state transitions, absence of runtime errors and save/reload correctness. They cannot prove fun.
- **Agent-operated playthrough:** can show input comprehensibility, achievable loops and bottlenecks if real interactions were executed, but should not claim human emotional response.
- **Human playtests:** can support enjoyment, motivation and perceived agency claims. Observe actual behavior and compare iterations.
- **Designer opinion:** useful hypotheses, not observed player behavior.

When appropriate, measure hesitation, rejected or repeated choices, restart desire, failure recovery, strategy switching, completion and drop-off. Keep definitions and sample size visible.

## Existing-game rescue audit

For a polished but boring existing game, first protect the existing version and inspect working implementation/assets. Map precise existing input choices and effects. Diagnose whether the missing value is stakes, counterplay, changing constraints, legible feedback, varied modes of interaction, economic tradeoffs, short-term goal, conflict of priorities or emergent interdependence. Then consider three **mechanically distinct** rescue directions with clear controls, first minute, core/repeat loop, consequences, growth, game-world impact, realistic reuse/change cost and a smallest test.

Avoid designing three skins of one solution. Do not edit a private game simply to perform a speculative benchmark without authorization.

## Pass conditions

A verifiable gameplay/interaction PASS needs every **critical** stated input/feedback/state/goal requirement exercised, test environment identified and integrated UI state genuinely inspected. If user asks for a *fun* verdict and no human trial exists, functional checks may PASS while human enjoyment remains **NOT_EVALUATED**.
