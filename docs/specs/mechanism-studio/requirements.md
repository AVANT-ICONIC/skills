# Mechanism Studio: observable requirements and acceptance scenarios

Status: **SPECIFICATION ONLY — NOT IMPLEMENTED**
Canonical scope: [proposal.md](proposal.md)
Design reference: [design.md](design.md)

Notation: **MUST** = MVP acceptance gate; **SHOULD** = desirable after hard gates; **LATER** = excluded from the first deliverable. Every requirement has falsifiable cases.

## R1. Portable public Agent Skill (MUST)

The future mechanism-studio/SKILL.md MUST be discoverable using the ordinary portable Agent Skills folder convention and MUST describe triggering, prerequisites, safe execution, failure modes and outputs without assuming a particular LLM provider, IDE, connected account, Motion OS or ICONICUT.

- WHEN a compatible agent loads the skill without a configured runtime, THEN it reports setup prerequisites instead of claiming to build a model.
- WHEN only a non-Claude coding agent is available, THEN the process remains documented and executable using the same adapter CLI; no Claude-only slash command is a hard dependency.
- WHEN a request is unrelated to mechanical/structural model visualization, THEN the skill does not eagerly activate.

## R2. Explicit upstream supply-chain pin (MUST)

The future implementation MUST include one versioned upstream lock specifying repository, immutable full commit SHA, expected lockfile digest, chosen adapter compatibility version, license and tested platform matrix. Candidate planning revision: elvarofficial/teardown@a91262ac1109051e014662d42ecb0b7bc1f113b1. This candidate is not yet build-verified.

- WHEN a checkout differs from the lock, THEN doctor/runner refuses or requires an explicit reviewed update; never silently uses latest.
- WHEN the package lock differs or an untrusted package script is introduced, THEN validation flags a supply-chain difference before installation.
- WHEN runtime is absent, THEN help and doctor work without installing packages automatically.
- WHEN offline, THEN a previously prepared pinned checkout remains usable.

## R3. Reference-grounded model and provenance (MUST)

A machine request MUST provide at least one concrete geometric/mechanical reference or be explicitly labeled conceptual/illustrative. Every numeric input and displayed readout MUST be assigned a provenance class: measured, sourced specification, derived, assumed or illustrative, with units and evidence references. Unknown numbers cannot silently become facts.

- WHEN a source shows geometry but no dimension, THEN the input is recorded as assumed or estimated and not presented as measured.
- WHEN the model uses a physical formula, THEN at least one independent numerical check tests an invariant or known edge pose.
- WHEN a concept has no source geometry, THEN the output advertises conceptual status, not physically validated engineering.
- WHEN a chart and a mechanism show the same quantity, THEN both values derive from the authoritative model state, not separate animation curves.

## R4. Authoritative multi-input state (MUST)

A mechanism may have one or several controls, but all geometry, readouts and recorded output MUST use a single authoritative, testable pose/state evaluation. The MVP adapter may expose an ordered snapshot of controls and a frame index; uncontrolled wall-clock or random state cannot change a deterministic render.

- WHEN frame N is requested after frame M versus directly after startup, THEN the evaluated state/readouts are equal for identical inputs.
- WHEN speed, camera, isolate or cutaway state changes, THEN unsupported capabilities are rejected or reported as unsupported instead of ignored.
- WHEN the model includes integration, particles or variable-rate state, THEN its output must be seekable using closed form, deterministic precomputation, or a declared reproducible lookup strategy.

## R5. Interactive viewer (MUST)

The package MUST contain a responsive, offline-capable 3D viewer with an identifiable mechanism, orbit or defined camera controls, zoom or equivalent framing, at least one functional model control, cutaway or component isolation, synced numeric readout, and accessible keyboard/pointer interactions. Touch behavior MUST be tested when touch support is claimed. Auto-tour is SHOULD if it is not already supported by the generated page.

- WHEN a viewer is opened without internet after assets are installed, THEN it works with no external requests.
- WHEN an external asset or WebGL is unavailable, THEN the UI provides a meaningful fallback/error instead of an empty scene.
- WHEN the page transitions between views, THEN it does not silently change mechanism state or double-integrate time.
- WHEN reduced motion is requested, THEN nonessential automatic camera movement should be reducible/disabled.

## R6. Frame-addressable video (MUST)

The generated video MUST declare a rational frame rate, integer frame count, dimensions, deterministic control/script schedule and encoder settings; all rendering is addressed by frame index. Video and viewer MUST use the same mechanism definition. MP4/H.264 with yuv420p is the initial interoperability target; report actual decoder/codec details using ffprobe.

- WHEN generating the same frame at the same pinned environment and controls in different seek orders, THEN model/readouts are bitwise equal and image output is identical or within a declared pixel tolerance (cross-GPU bitwise equality is not assumed).
- WHEN exporting an N-frame clip, THEN decoded duration and frame count match the declared timebase (subject to documented container metadata rounding).
- WHEN the video includes sound, THEN SFX events use the declared timeline, with an audio timing check and rights evidence.
- WHEN a renderer cannot produce a video, THEN do not report the package as complete even if HTML exists.

## R7. Versioned package manifest and portable paths (MUST)

The output package MUST contain a schema-versioned manifest and hash-verified relative assets for HTML, MP4, preview, evidence and notices. All entries are relative, non-traversing paths. No remote URL or absolute host path may be necessary for playback. Unknown major schema versions fail closed.

- WHEN any declared artifact is missing or its hash is wrong, THEN package verification fails.
- WHEN a manifest uses ../, an absolute path, a symlink escaping the package, or malformed identifiers, THEN validation rejects it.
- WHEN the viewer needs an asset server for browser safety, THEN a supplied local loopback-only runner is documented; no external service is required.
- WHEN a package is copied to another machine with supported browser/runtime, THEN it can be used offline without the original creator's skill installation.

## R8. Inspectable evidence package (MUST)

Evidence MUST include source references, parameter assumptions, independent numeric checks, runtime/version fingerprint, command results, visual review images at tour beats and sampled transitions, capability checks, license/credit inventory, package integrity hashes and clearly marked unavailable evaluations. Evidence MUST distinguish PASS, FAIL, NOT_EVALUATED, and KNOWN_LIMITATION for individual gates.

- WHEN visual frames have not actually been opened/inspected, THEN visual QA is NOT_EVALUATED, not PASS.
- WHEN the reviewer modifies a machine, THEN affected evidence is invalidated and regenerated for the new artifact hashes.
- WHEN a physically illustrative pressure formula is used, THEN a diagram may pass synchronization while physics validation remains KNOWN_LIMITATION.
- WHEN an asset contains copyrighted reference imagery not licensed for redistribution, THEN it is not packed into the public deliverable without rights.

## R9. Security and privacy (MUST)

Generated JavaScript, external models and third-party dependencies are untrusted. The runner MUST execute browser content in an isolated, credential-free profile with controlled package-root asset access and a default-deny external network policy during validation/render. Must not disable web security to make file:// work. Installation and fetching require explicit action.

- WHEN the page attempts requests to the internet, localhost services outside its assigned loopback origin, or local files outside its package, THEN the request is blocked and logged.
- WHEN a generated page opens popups, requests downloads or navigates off-origin, THEN execution blocks or flags the attempt.
- WHEN processing excessive RAM, CPU, GPU or time, THEN a configurable bounded executor terminates with a typed failure and retains logs.
- WHEN upstream requires insecure execution to render, THEN the benchmark fails; do not bypass the protection silently.

## R10. Failure-handling and portability (MUST)

Doctor, build and verify commands MUST offer machine-readable diagnostics, stable nonzero failures and human-readable guidance. Node 20+ and compatible browser/encoder toolchain are candidate prerequisites, subject to upstream verification.

- WHEN Chromium, ffmpeg or Python sound utilities are unavailable, THEN diagnostics name the missing component and which outputs remain possible.
- WHEN the package cannot satisfy mandatory HTML, MP4 and evidence gates, THEN no success marker is written.
- WHEN an existing valid package is superseded by a failed build, THEN preserve the last verified output and write new artifacts atomically to a staging directory.

## R11. Performance and size (SHOULD; measure, don't invent)

Benchmark setup/warm-up, interactive frame rate, frame capture throughput, memory, decoded frames, HTML size and total package size on at least one integrated-GPU profile and one representative main development machine. Use measured percentile distributions and record driver/browser/GPU.

- WHEN a slower device misses the target frame budget, THEN progressively reduce costly effects, pixel density, shadows and overlay redraws without changing model state.
- No blanket 60 fps or <1 MB guarantee without measured support.

## R12. Downstream interoperability (LATER; separate PRs)

MVP MUST be usable standalone. Motion OS and ICONICUT adapters are future integration work, not hidden dependencies. Existing published proposals establish consumers' ownership:

- [Motion OS PR #6](https://github.com/AVANT-ICONIC/motion-os/pull/6): consume simulation scenes/metadata; own film craft.
- [ICONICUT PR #2](https://github.com/AVANT-ICONIC/iconicut/pull/2): initially import MP4 and optional sidecar, then consider edit-as-parameterized-render-island after evidence.
- An imported MP4 is editorially trim-able but is not native editable 3D geometry.
- Future integrations MUST not mutate the simulation package's provenance or silently lose timebase metadata.

## Release evidence matrix (required future receipts)

| Gate | Minimal proof |
| --- | --- |
| Skill portability | Two agent-runtime instruction/CLI reviews; one executed non-Claude path where available |
| Upstream pin | SHA + lock digest + vendor license + reproducible checkout |
| Baseline | Existing Cessna and V8 build/render checks |
| Originality | A new mechanism generated from references, not just one copied sample |
| Interaction | Orbit, zoom, controls, cutaway, offline, keyboard and declared touch checks |
| Numeric integrity | Independent analytic check and readout/pose agreement |
| Video | ffprobe receipt, inspected decoded frames, frame count/timebase |
| Determinism | Nonsequential seek test with state and visual comparison |
| Security | Default-deny external network probes, traversal rejection, resource-bound test |
| Package | Manifest/schema/asset-hash test, portable reopen on another folder/device where supported |
| Final QA | Latest-artifact contact sheet and explicit PASS/FAIL/NOT_EVALUATED ledger |

Do not count planned acceptance tests as executed results.
