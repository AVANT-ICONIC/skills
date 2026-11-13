# Mechanism Studio: safe compiler convergence proposal

**Status:** Phases 1 and 2 implemented as separately stacked draft changes; manifest migration remains a proposal. No output schema or release behavior was changed. Owners: `mechanism-studio/scripts/compile-request.mjs` (reviewed recipes) and `mechanism-studio/rigid-scene/compile-scene.mjs` (bounded generic SE(2) renderer).

## Verified foundation and reason to converge

The original compiler accepts three **named, reviewed** mechanism families (Geneva indexing, inline slider-crank, and four-bar). It serializes an approved graph, preserves a source register, and builds with a pinned Teardown checkout. The new rigid-scene compiler accepts **bounded rigid-body graphs**, not names: a two-actuator five-bar (5 revolute joints) and, in this PR, a single-actuator crank-slider (3 revolute + 1 prismatic), without adding any model formula, 3D renderer or animation source. The two compiled scenes must contain **byte-identical** `main.js`, `stage.js`, `model.mjs`, `style.css`, `scene-core.mjs` and `rigid-pose-core.mjs`; only their validated graph, source register and scene ID differ.

This establishes a shared render contract across topologies, not an arbitrary CAD system. Seeded local root solving can fail near singularities and does not prove global branch enumeration. No physical force, collisions, manufacturing tolerance or independent source-document verification.

## Recommended architecture

```text
                 source refs / claimed dimensions
                               |
                canonical source/provenance validator
                               |
           [reviewed recipe]   |   [bounded rigid-scene graph]
                      \        |         /
                         normalized IR
                             |
              trusted template / pinned renderer
                             |
               semantic geometry / pose audit
                             |
                  Teardown + browser + film
                             |
                one verifier / preview package
```

**One owner for each behavior:** source/rights normalization, schema rules, machine/scene graph compilation, renderer templates, frame-addressed film, package integrity. No generic per-mechanism copy of Three.js entrypoint, and no "legacy" and "new" parallel security gates after migration. Keep the analytic solver for Geneva; an intermittent pin-slot mode is *not* handled by the SE(2) revolute/prismatic solver.

### Proposed versioned intermediate representation

`avant.mechanism-study/2` (future only):

- `id`, `classification`, `description`, `references[]` with immutable source IDs and `contentChecked=false` until validated evidence exists;
- `dimensions` with `mm/rpm` and unambiguous measured/sourced/derived/assumed status plus reference claim IDs;
- `kinematics.kind = reviewed-recipe | rigid-scene`, an enumerated, fixed schema discriminator (never free-form `eval`/JS modules);
- `bodies[]` with fixed, prescribed-motor or free SE(2) pose, and explicit visual local anchors;
- `joints[]` with `revolute | prismatic`, fixed-reference/guide axis and validated dimensions;
- `branches` with explicit per-branch seeds and numeric predicates (`signed-area`, `axis-projection`), never hidden previous-frame tracking;
- `camera`, `film`, `provenance`, and gated experimental capabilities;
- `capabilityReport` declaring supported solve types, unresolved/singular behavior and NOT_EVALUATED physical gates.

**Do not let arbitrary JSON become executable code.** The compiler copies only reviewed modules with hash equality; the graph is pure data. Refuse unknown fields, duplicate identifiers, invalid coordinate bounds, unverified material rights, and unsupported physical joints. Running an untrusted build must still use an ephemeral OS-isolated process.

## Incremental migration with falsification gates

1. **Contract unification (nonbreaking, implemented in draft PR):** introduce a small shared `source-validation.mjs`, `compiler-io.mjs` and `portable-receipt.mjs`, with exact parity tests for all five currently compiled mechanisms/scenes. Retain the existing CLI frontends temporarily as shims. No change to filmed output bytes is permitted without an explicit review.
   See [phase-1 compiler compatibility contract](compiler-consolidation-phase1.md): shared HTTPS provenance gate, atomic compilation, canonical schema router and 15-compilation golden parity against frozen PR #32. No legacy output changes are accepted.
2. **One renderer template (phase 2, draft implementation):** move the current `rigid-scene` source to a canonical trusted template folder. Compile both data-only five-bar and prismatic slider through it; assert a single byte-identical JS/CSS template digest and separately verified data digests. Preserve analytic Geneva handling.
   See [phase-2 canonical template and byte-parity contract](compiler-consolidation-phase2.md). Legacy renderer paths are Git symlinks; source copies and package schemas remain untouched in compiled output.
3. **Canonical verifier:** join current `avant.mechanism-package/1` and `avant.rigid-scene-package/1` under a new version **only after** proof parity. Include source register, numeric-closure residuals, solver/branch status, requested movie, decoded frame hashes, visual joint-anchor tests, source and rights disclaimers, and `releaseReady=false`.
4. **Migration matrix:** run all original three family outputs plus both generic scenes on the same pinned Teardown revision, with a single dependency install, real Chromium (offline, no remote requests), deterministic seeking, control QA and decoded H.264/AAC films. Compare artifacts and performance against the last passing runs. Fail closed if a previously supported case regresses.
5. **Cutover by explicit acceptance:** retain rollback branches and old manifest readers until all five fixtures pass. Then remove duplicate compiler internals in a separate reviewed PR. No silent upcast of an older preview to a release-certified package.

## Acceptance and rollback

- **No new mechanism-specific pose code** for the second rigid-scene topology; both actual compiled templates hash identically.
- At least 145 fixed-time positions of each branch of both scenes close within the declared numerical tolerance, without previous-frame state.
- Invalid prismatic axes, detached visual bar endpoints and arbitrary scripts fail at validation before code execution.
- Both browser previews and 720p24 H.264/AAC encoded films pass; exported package hashes match independently after download.
- All source links remain `contentChecked=false`; no false claims of physical certification or global roots.
- If any visual or functional parity regression occurs, **do not cut over**. Keep the two verified existing compilers/manifest schemas until a later PR repairs it.

This proposal is the follow-up architectural contract, not implementation of the final migration. Adding another abstract layer without removing a duplicate owner would make the codebase worse, not more general.
