# Mechanism Graph v1

**Status:** Experimental, reviewed machine graph. Graph-driven solvers: inline slider-crank and signed dual-branch four-bar. The four-slot Geneva drive emits a topology graph but still uses its separately audited analytic solver. Neither is a force solver, arbitrary CAD tool or third-party source verifier.

## Purpose

The old structure was a recipe-specific model driving renderer geometry. Graph v1 moves the next reusable boundary **before** the 3D scene:

~~~text
sourced request (validated)
       ↓
typed bodies + joints + numerical constraints (machine graph)
       ↓
approved planar solver → absolute-time body poses + residuals
       ↓
existing Three.js visualizer + synchronized readouts + film director
       ↓
audited HTML/MP4/evidence package
~~~

No user-provided program, arbitrary expression, network-sourced source code or reflected JavaScript is executed from the graph.

## Contract

`schema = avant.mechanism-graph/1` describes a 2D XY mechanism with dimensions in **millimetres**. Fields:

| Field | Meaning |
| --- | --- |
| `bodies` | Identified rigid bodies and roles; no mesh data or shaders |
| `joints` | Revolute anchors, prismatic guide, or explicitly limited ideal intermittent pin-slot relationship |
| `drive` | Uniform motor rotation, positive RPM and driving joint ID |
| `constraints` | Link length, slider axis, allowed travel, or idealized intermittent indexing |
| `solver` | Approved, pinned analytic solver identifier, never custom executable code |
| `parameters` | Finite dimensional quantities with exact units and input correspondence |
| `provenance` | References **linked**, not retrieved or scientifically verified; no dimensional certification |

For slider-crank, four bodies and four joints are constructed: stationary frame ↔ crank revolute axis ↔ connecting-rod revolute pin ↔ piston wrist pin ↔ frame-mounted prismatic guide. The link lengths are stored at the actual joint anchors, not hidden in UI animation code.

The approved `inline-slider-crank-positive-root/1` solver derives crank pin, connecting rod angle, piston translation, velocity and per-constraint numerical residuals from those anchors. Its body poses drive **the existing** Three.js assembly and chart.

The Geneva graph records two revolute supports, the intermittent drive-pin/slot relationship, exact quarter-turn index and ideal dwell. The graph explicitly declares solver `geneva-four-slot-ideal-deferred/1`; its graph solver returns `GRAPH_SOLVER_NOT_IMPLEMENTED`. The existing independently audited Geneva mathematical model remains the production source of motion. Physical locking cam, friction, forces and clearance under load remain excluded.

## Four-bar graph extension

The reviewed `four-bar` request adds a separate **RRRR four-revolute closed-loop topology**. The canonical `fourbar-solver.mjs` evaluates the two signed circle intersections (open and crossed) from actual crank, coupler, rocker and ground dimensions, with no frame-history dependency. It rejects full-turn previews that cannot remain closed throughout a revolution. Outside approved full-turn profiles, the diagnostic solver still distinguishes unreachable, singular and ambiguous poses.

The four-bar's actual 3D body poses, readouts and cinematic film use the graph-driven solver. The mathematical proof samples both branches for 2,882 positions, with independent rod-length closure and pose consistency checks. Output branch selection does not simulate physically switching a linkage between assembled states.

For the derivation and provenance, see [the four-bar study](four-bar-branch-analysis.md). External technical sources remain reference links, not automatically downloaded proofs.

## Generated files and trust

The brief compiler writes three additional assets:

- `mechanism-graph.json`: versioned, inspectable data-only topology.
- `machine-graph.mjs`: serialization of that same checked graph as a deterministic, locally bundled module. It contains no user-provided expressions.
- `mechanism-graph.mjs`: an unchanged copy of the **one canonical** solver in `scripts/mechanism-graph.mjs`.

All three must match the compiler's normalized request and trusted source before model import. `audit-model.mjs` checks module hashes, config hashes and graph hashes, then independently validates geometry over 1,441 poses. The film package preserves `evidence/mechanism-graph.json` alongside the mathematical proof and hashes all **twelve** package assets.

The graph is not self-certifying. A malicious third party who can change both code and evidence outside the reviewed repository is not covered by package SHA-256 alone. Do not treat this as a digital signature or OS-level sandbox.

## Tests

~~~bash
node --test mechanism-studio/tests/mechanism-graph.test.mjs
node --test mechanism-studio/tests/compile-request.test.mjs
node --test mechanism-studio/tests/audit-model.test.mjs
node --test mechanism-studio/examples/slider-crank/model.test.mjs
~~~

After tests, use the existing source-backed GitHub CI for immutable Teardown builds, Chromium controls, deterministic 1080p30 slider-crank or 720p24 four-bar film, decoded-image review and full package verification. A passing mathematical test does not substitute for rendering.

## Generic point-constraint audit core (experimental)

[Planar Constraint Core v1](planar-constraint-core-v1.md) adds a **separate bounded numerical solver** for point-distance and axis-guide systems. Its equations are not keyed to mechanism families. Local tests cover slider-crank, two four-bar branches, a five-bar two-input linkage and two simultaneously free points.

The original analytic slider-crank/four-bar graph solvers **remain authoritative for the 3D viewer and film**. The new core independently reproduces their output positions from explicitly seeded point constraints at multiple absolute-time frames. The model audit records a separate measured residual and marks Geneva `NOT_EVALUATED`, because an intermittent pin-slot motion law is outside v1. The portable package refuses to claim independent numeric verification if that receipt is absent or forged.

This is **local numerical constraint solving, not global root enumeration**. Near singularities and badly seeded systems can remain `unresolved`. Exact collision dynamics, force transmission, external source-document attestation and physical fabrication remain out of scope.

## Rigid-body pose audit (experimental)

[Planar rigid-pose core v1](rigid-pose-core-v1.md) introduces a common SE(2) pose solver whose unknowns are rigid-body `(x,y,theta)` rather than independent anonymous points. Revolute and fixed-reference prismatic relationships are computed from local joint anchors. Both slider-crank and four-bar are cross-checked against this independent pose solver, including the two four-bar assembly branches. The film runtime is unchanged. Full all-branches enumeration, moving-guide joints and collision dynamics remain outside the supported contract.

## Next extension

The newly verified four-bar demonstrates a second **graph-driven solver topology**, including two explicit assembly branches and singularity diagnostics. The next extension is no longer another nominal recipe: investigate a shared closed-loop constraint evaluator with explicit branch enumeration, tolerance propagation and independently tested failure states. Do not call it general until it solves an unseen topology without introducing a new hardcoded solver or silently changing assembly branches.

Geneva, slider-crank and four-bar source URLs remain reference registers only. They **have not been independently fetched or semantically verified by this compiler**.
