# Mechanism Studio: implementation tasks and proof gates

Status: **IMPLEMENTATION UNDER REVIEW — partial receipts exist in separate, unmerged PRs; no full MVP release gate has passed.**

### Evidence checkpoint (2026-11-03)

- [PR #18: pinned upstream compatibility](https://github.com/AVANT-ICONIC/skills/pull/18): GitHub CI verified four built V8/Cessna HTML examples, browser seeking and controls, two short H.264 clips, lock hash and numerical pinion invariant. Integrated hardware GPU and OS-level sandbox are NOT_EVALUATED.
- [PR #19: public portable skill and example packaging](https://github.com/AVANT-ICONIC/skills/pull/19): CI verified two preview packages with viewer/video/evidence and SHA-256 receipts. A generalized reference-to-model generator, explicit dependency doctor, and production film are not yet implemented.
- [PR #20: original Geneva indexer](https://github.com/AVANT-ICONIC/skills/pull/20): 7 pure kinematic tests, 10 real browser/video smoke checks, a source-grounded original 3D viewer and an 18-frame H.264 sample. The output is packaged with a verified source and license/evidence manifest. Physical locking cam, full production visual QA, mobile GPU, and sandbox gates remain open.
- [PR #21: structured machine briefs and full-HD film](https://github.com/AVANT-ICONIC/skills/pull/21): CI verified two reviewed machine recipes from source-registered input, including an original parameterized slider-crank, non-default variant verification, live WebGL controls, repeatable seeks and a **1920×1080, 30fps, eight-second H.264/AAC film**. Audio mix measured −23.4 LUFS; 10/10 package hashes passed. A specific Full HD layout/legibility gate and visual inspection repaired title/mechanism overlap. **Bounded recipe generation is not universal reference/image-to-machine inference**, and the source URLs are not independently fetched by the compiler. ReleaseReady remains false while physical GPU, host isolation and engineering-validation gates are open.
- The checkboxes below are **full milestone acceptance tasks**, not a count of draft source commits. Keep a task unchecked until all its specified acceptance evidence is available and reviewed, even if substantial partial work exists.
Specification: [proposal](proposal.md), [requirements](requirements.md), [design](design.md).
Task ordering is intentionally narrow. Every milestone is a separate reviewable change; follow existing AVANT-ICONIC skills rules and keep all executable implementation outside the specification PR.

## Stage 0: upstream compatibility and provenance benchmark

- [ ] **T0.1** Pin the candidate upstream SHA from design.md and calculate the SHA-256 of the upstream package-lock.json. Verify MIT notices and audit dependency/package scripts and any external sound assets. Never resolve the moving default branch implicitly. Covers R2, R9.
- [ ] **T0.2** In an isolated, credential-free workspace, perform explicitly authorized reproducible install of the pinned dependencies and Playwright browser. Record environment/runtime versions. No automatic network access in later read-only doctor. Covers R2, R10.
- [ ] **T0.3** Build V8 and Cessna live/film examples from the upstream tree. Open the actual HTML; exercise a control, orbit, camera and cutaway; capture stills and an MP4. Save logs and hashes. Covers R5, R6.
- [ ] **T0.4** Probe window.SIM.render(t) and window.seek(t) behavior, randomized frame order, state/readout visibility, output determinism and whether full-frame capture works without patches. Identify exactly which capabilities would require a versioned shim. Covers R4, R6.
- [ ] **T0.5** Independently check at least one upstream model numerical invariant (Cessna nominal 201 mm for 32-tooth module-4 pinion => 201.06 mm computed); note rounding and source uncertainty. Covers R3.
- [ ] **T0.6** Run offline/isolated browser probe with no external requests and test local asset paths with bundled and external model variants. Record whether file:// works or local read-only server is necessary. Covers R7, R9.
- [ ] **T0.7** Benchmark representative hardware including an integrated GPU; report actual render/capture latency, sizes and bottlenecks. Do not claim universal 60 fps. Covers R11.

**Stage 0 gate:** an inspectable report on real builds and captured frames with recorded hashes, pinned environment, compatibility caveats and explicit go/no-go recommendation. If upstream is incompatible, stop before authoring a misleading operational skill, and revise this design first. A branch/PR is not merged by this gate.

## Stage 1: portable skill, single adapter, package tooling

- [ ] **T1.1** Write concise portable mechanism-studio/SKILL.md with activation, reference/assumption rules, prerequisites, safe execution and outputs; avoid Claude-only mandatory commands. Update root README skill index when implementation is ready. Covers R1.
- [ ] **T1.2** Define one immutable upstream.lock.json with checked full commit SHA, expected lock digest, license details and adapter version; add read-only doctor and explicitly invoked prepare. Covers R2, R10.
- [ ] **T1.3** Implement input normalization and validation for request schema v1; reject unsafe paths, unsupported controls, duplicate IDs, nonfinite quantities and ungrounded factual claims. Covers R3, R4, R9.
- [ ] **T1.4** Implement the **single** teardown adapter: external machine folder, build invocation, captured browser seek contract, capability probing and typed compatibility errors. No generic plugin registry, second 3D engine or automatic upstream patching. Covers R4, R6.
- [ ] **T1.5** Define package-v1 and evidence-v1 schemas with validators; stage the complete directory, compute file SHA-256 digests, write notices and publish only verified output. Preserve last-good package on failure. Covers R7, R8, R10.
- [ ] **T1.6** Implement sandboxed browser validation/render, controlled loopback asset hosting, blocked remote requests, scoped asset roots, deny popups and outbound requests, and OS/process isolation where available. If robust isolation is unavailable, declare the unsafe path unsupported. Covers R9.
- [ ] **T1.7** Implement video capture to declared integer timebase and inspect with ffprobe/decoded frame sheet. Sound remains optional for first slice, but any enabled sound must pass timeline/rights checks. Covers R6, R8.
- [ ] **T1.8** Produce a complete package from one pinned upstream example: live viewer, MP4, preview, evidence, sources and notices. Verify in copied offline directory. Covers R1–R10.
- [ ] **T1.9** Test positive and malicious fixtures: hash mismatch, missing asset, traversal, symlink escape, unsupported version, lost network, unavailable runtime, input NaN, corrupted output, repeated regeneration and failed atomic publish. Covers R7, R9, R10.

**Stage 1 gate:** end-to-end package with every mandatory acceptance gate recorded PASS (or explicitly fail with no release). Two agent environments are reviewed for skill portability; at least one non-Claude execution where available. Upstream source is still unmodified and external.

## Stage 2: reference-grounded original generation

- [ ] **T2.1** Select a mechanically constrained original reference (watch escapement is preferred, but licensed references and feasibility determine final selection). Separate source input rights from redistributable output rights. Covers R3.
- [ ] **T2.2** Create a pure geometry/kinematics evaluator with real unit declarations, multiple controls if needed, parameter constraints and independently checked end positions. Use model-derived gauges and charts, not decorative values. Covers R3, R4.
- [ ] **T2.3** Build functional interaction: camera/orbit, zoom, model control, isolate/cutaway, responsive labels and keyboard operation, plus touch and reduced-motion behavior when advertised. Covers R5.
- [ ] **T2.4** Define a deterministic tour/capture schedule by integer frames; produce video and evidence using the same model; record visual observations of stills, transitions and final decoded video. Covers R6, R8.
- [ ] **T2.5** Exercise unsupported-resource handling, offline copied package, lower performance tiers and reproducibility checks after a changed parameter. Covers R7, R9, R11.

**Stage 2 gate:** evidence proves a genuinely new machine, not just a rebadged upstream example; no unverified physics is described as verified. This is the standalone MVP completion gate.

## Stage 3: consumer proposals and optional interoperability

**Separate repos, separate approved changes. Do not include these in the first skill PR.**

- [ ] **T3.1 Motion OS:** review draft [PR #6](https://github.com/AVANT-ICONIC/motion-os/pull/6), verify existing Chromium/Director contracts, test package MP4 plus metadata as a passive scene, and measure need for a live seek adapter. No duplicate renderer.
- [ ] **T3.2 ICONICUT:** review draft [PR #2](https://github.com/AVANT-ICONIC/iconicut/pull/2), prove existing media/agent import, trim and export before proposing any new manifest discriminator or Rust changes.
- [ ] **T3.3** Only if demanded by tested workflows, write separate parameterized render-island specs with supported capability flags and baked fallback.

**Stage 3 gate:** no change to existing editor rendering or preview/export refactors without independently reviewed implementation PRs.

## Stage 4: maintain/fork/extract decision

- [ ] **T4.1** Track upstream changes against the pinned SHA and replay the compatibility suite on candidate updates.
- [ ] **T4.2** Measure recurring patches, release friction, interoperability and resource constraints. Compare thin adapter maintenance with independent engine ownership.
- [ ] **T4.3** Choose maintain external pin, fork with preserved attribution, or extract a separately released engine based on evidence. No advance commitment to a new repository.

## Minimum test scenarios

| ID | Scenario / expected result | Gate |
| --- | --- | --- |
| A01 | Full pinned Cessna build and decoded film | R2/R6 |
| A02 | Full pinned V8 build and offline live viewer | R2/R5 |
| A03 | One newly generated, source-grounded mechanism | R3/R4 |
| A04 | Seek frames 500, 0, 120, 500 with identical model controls yields equal model/readouts | R4 |
| A05 | Same-machine screenshot comparison in fixed browser/GPU profile within documented tolerance | R6 |
| A06 | MP4 count, timebase, dimensions and codec match manifest using ffprobe | R6 |
| A07 | Copy package to new path and use fully offline; no third-party asset call | R7 |
| A08 | Tampered file, traversal and unsupported schema are rejected | R7/R9 |
| A09 | Attempt outgoing network/popups and local filesystem escape; requests blocked/logged | R9 |
| A10 | Low-resource and missing dependency produce typed diagnostics, not false success | R9/R10 |
| A11 | Inspection of contact sheets, decoded video and UI interactions recorded for latest hashes | R8 |
| A12 | Forced failed second build leaves last valid package intact | R10 |
| A13 | Upstream revision bump requires lock change and compatibility rerun | R2 |
| A14 | Numeric pose/readout agreement and independent invariant check | R3 |
| A15 | Cross-device frame rate and resource use recorded without unsupported performance claims | R11 |

## Explicit stop/replan triggers

- Upstream build changes require mutating upstream source substantially.
- Untrusted generated JavaScript cannot be executed within a sufficiently isolated environment.
- Generated pages expose no usable deterministic seek interface.
- No credible source exists for a requested physically realistic effect.
- Output package cannot satisfy offline playback / licensed asset distribution.
- A consumer requires changing Motion OS/ICONICUT production internals before the standalone MVP is validated.

If triggered, preserve evidence, update the single canonical design and request the narrowest necessary scope decision. Do not solve a failing test by lowering the acceptance criteria or marking not-evaluated checks as passed.

## Completion receipt

For each task: include code revision, command and tool versions, result, artifacts inspected, logs/contact sheets, issue IDs, last verified artifact hashes, and remaining limitations. An unchecked item is not implemented. An implementation without actual inspected outputs is not complete.
