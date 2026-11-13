# Data-driven rigid joint scene (experimental)

The example `scene.json` describes a **dual-actuator five-bar linkage** using five rigid bodies, five revolute joints, two prescribed motor motions and two explicit assembly seeds. The generic runtime `scene-core.mjs` feeds this graph into the canonical **SE(2) rigid-pose numerical solver**. Neither the renderer nor the runtime contains a five-bar-specific position formula. The same scene model also supports other bounded rigid-joint configurations, subject to successful numerical closure.

**Run local checks:** `node --test mechanism-studio/rigid-scene/*.test.mjs`.

**Compile:** `node mechanism-studio/rigid-scene/compile-scene.mjs mechanism-studio/rigid-scene/scene.json /tmp/dual-drive-linkage-study-004`. This refuses existing outputs and unreviewed script fields.

The pinned Teardown build/capture CI consumes that new folder, checks real Chromium screenshots, live branch switching, replay identity and 720p24 H.264/AAC film, then publishes a hash-verified preview. The independent generic solver and data-only source register are included in the bundle.

Not universal CAD, not force or collision simulation, not proof of global assembly-branch enumeration. Static seed poses require careful design and can fail on other graphs or close to singularities. The example dimensions are illustrative, and linked sources were not independently retrieved. Hardware GPU and OS sandbox remain unverified. All packages retain `releaseReady=false`.
