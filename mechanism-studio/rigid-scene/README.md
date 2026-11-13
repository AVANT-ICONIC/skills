# Data-driven rigid joint scene (experimental)

The example `scene.json` describes a **dual-actuator five-bar linkage** using five rigid bodies, five revolute joints, two prescribed motor motions and two explicit assembly seeds. The generic runtime `scene-core.mjs` feeds this graph into the canonical **SE(2) rigid-pose numerical solver**. Neither the renderer nor the runtime contains a five-bar-specific position formula. The same scene model also supports other bounded rigid-joint configurations, subject to successful numerical closure.

**Run local checks:** `node --test mechanism-studio/rigid-scene/*.test.mjs`.

**Compile:** `node mechanism-studio/rigid-scene/compile-scene.mjs mechanism-studio/rigid-scene/scene.json /tmp/dual-drive-linkage-study-004`. This refuses existing outputs and unreviewed script fields.

The pinned Teardown build/capture CI consumes that new folder, checks real Chromium screenshots, live branch switching, replay identity and 720p24 H.264/AAC film, then publishes a hash-verified preview. The independent generic solver and data-only source register are included in the bundle.

Not universal CAD, not force or collision simulation, not proof of global assembly-branch enumeration. Static seed poses require careful design and can fail on other graphs or close to singularities. The example dimensions are illustrative, and linked sources were not independently retrieved. Hardware GPU and OS sandbox remain unverified. All packages retain `releaseReady=false`.

## Second independent topology: prismatic crank-slider

`slider-rail.json` is a second reviewed data-only scene. It has **four bodies, one motor, three revolute joints, and one prismatic guide**, rather than the first sample's five bodies, two motors and five revolute joints. Its two constrained assembly branches are selected by the sign of the piston-to-crank pin displacement along the declared guide axis (not by five-bar signed-area). The generic `scene-core.mjs`, renderer (`stage.js`), UI (`main.js`) and solver source (`rigid-pose-core.mjs`) are byte-identical between both compiled outputs. No crank-slider-specific pose equation was added to the runtime.

`node --test mechanism-studio/rigid-scene/*.test.mjs` verifies both graphs, 145 phases per branch against an independent analytic kinematic relation, invalid/malicious schema fields, reproducible arbitrary seeking and compile-source identity. The prismatic guide is drawn by the generic joint renderer, not as a new scene-specific 3D file.

See [the compiler consolidation proposal](../docs/rigid-scene-compiler-consolidation.md) before attempting to merge the two currently separate compiler frontends. **No physical loads, collisions, external-source verification, or hardware GPU certification.**

### Optional scene-owned framing

The generic renderer accepts bounded `world.boardHeightMm` and `world.cameraDistanceFactor` fields. Both affect presentation only; they cannot change kinematic equations or branch selection. The slider uses a shallow mounting bed while the five-bar keeps its reviewed defaults. Invalid values are rejected before browser execution.

## Compiler consolidation phase 1

This old two-argument CLI is retained as a compatibility shim. The new [canonical study compiler](../docs/compiler-consolidation-phase1.md) accepts both source-backed machine requests and bounded rigid-body scenes, while preserving the old file bytes, runtime, and `avant.rigid-scene-package/1` manifest. The build still copies the exact reviewed renderer; all reference URLs are link-only and remain `contentChecked=false`.
