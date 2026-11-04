# Mechanism Graph v1

**Status:** Experimental, reviewed machine graph. First graph-driven solver: inline slider-crank. The four-slot Geneva drive emits a topology graph but still uses its separately audited analytic solver. Neither is a force solver, arbitrary CAD tool or third-party source verifier.

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

After tests, use the existing source-backed GitHub CI for immutable Teardown builds, Chromium controls, deterministic 1080p30 film, decoded-image review and full package verification. A passing mathematical test does not substitute for rendering.

## Next extension

Only after verified geometry and runtime contracts, consider supporting another **topology**, such as a single-input four-bar linkage, through additional allowed joints and numerical constraint groups. Do not add a purported universal constraint solver without proving assembled body poses, branch selection, singularity handling and failure behavior. A third hardcoded model disguised as a new graph type would not advance the architecture.

References are unchanged from the reviewed slider-crank and Geneva source registers, which **have not been independently fetched by this compiler**.
