---
name: mechanism-studio
description: Create and validate source-grounded interactive 3D mechanical explainers, with deterministic films, synchronized readouts, and evidence-backed portable packages. Use for cutaways, moving linkages, engine and gearbox simulators, mechanical systems and explanations of how machines work.
compatibility: "Portable Agent Skills Markdown. Generation requires an explicitly prepared pinned Teardown checkout, Node.js, Playwright/Chromium, and FFmpeg. Skill installation does not install engine dependencies."
---

# Mechanism Studio

Model first, visuals second. One authoritative state must drive geometry, charts and readouts. Do not confuse synchronized graphics with verified engineering accuracy.

## Current status

Experimental Stage 2: the skill packages vetted V8/Cessna upstream examples, ships the independent four-slot Geneva demonstrator, **and compiles strictly validated source briefs into either Geneva or parameterized slider-crank scenes**. It renders a tested **1080p30 film with original synthetic mechanical audio**, and packages source provenance alongside viewer/film evidence. This is a bounded reviewed-recipe compiler, NOT arbitrary text/photo-to-CAD or a production-certified engineering tool. Refer to the [canonical specification](https://github.com/AVANT-ICONIC/skills/pull/17). Do not claim that a skill file alone implements 3D generation.

## Activation

Use for moving mechanical explainers, cutaways, interactive machines, simulations with measured/sourced inputs and synchronized gauges, and video plus HTML from one kinematic model. Skip image-only art requests, decorative 3D scenes and ordinary video edits.

## Hard rules

1. Source real-mechanism references first. Record input dimensions, units, derivations, estimates and illustration-only values. Never present assumed numbers as measured.
2. Keep physical state calculation conceptually separate from rendering. Derived geometry, readouts and film views should share one seekable model, even for multiple controls. Never manually keyframe separately synchronized measurements.
3. Use the immutable [upstream lock](upstream.lock.json). Do not fetch latest, vendor or fork the Teardown runtime automatically; an agent must prepare dependencies explicitly in an isolated workspace.
4. Generated JS and native dependencies are untrusted. A browser request filter is not an OS-level sandbox. Never execute unreviewed customer sources with privileged filesystem access, credentials or outbound access.
5. Inspect real screenshots, UI control behavior, film frames, model invariants, provenance, rights and decoded media before completing. Mark unexecuted gates NOT_EVALUATED.
6. All generated studies and compatibility outputs are **review previews** with mandatory releaseReady=false. Hardware GPU, certified mechanics and OS-level isolation remain unverified. No automatic deployment or publication.
7. Motion OS, ICONICUT, Blender, a Claude-specific command and paid providers are never mandatory for the standalone skill.

## Existing implementation: package a vetted example

The upstream has separate live runLive() and film window.SIM.render(t) paths. The Stage 0 CI benchmark under .github/benchmarks/mechanism-studio/ builds both V8 and Cessna pages, probes seek/interaction and creates short FFmpeg videos from the pinned tree.

After **explicitly preparing** the pinned Teardown checkout, its npm dependencies, Playwright/Chromium and FFmpeg, and after successfully running the existing benchmark:

~~~bash
node mechanism-studio/scripts/package-example.mjs \
  --upstream /path/to/pinned/teardown \
  --run /path/to/stage0-output \
  --machine v8 \
  --out /path/to/new/v8-preview

node mechanism-studio/scripts/verify.mjs /path/to/new/v8-preview
node --test mechanism-studio/tests/*.test.mjs
~~~

The package CLI validates source revision/lock, passes of mandatory upstream compatibility checks, actual video metadata, and every copied file digest. It writes a versioned manifest, offline viewer, MP4, poster, benchmark evidence and MIT license/NOTICE. It does not clone, install, render a new machine or overwrite an existing output.

## Original Geneva mechanism (implemented and CI-verified)

The original machine lives at [examples/geneva-indexer](examples/geneva-indexer/README.md). Its independent kinematic model, Three.js assembly and single shared live/capture entrypoint are source-backed. The 4-slot output advances 90° per driver revolution, with a 75% ideal dwell. **No physical locking cam or forces are modeled.**

Run model tests with:

~~~bash
node --test mechanism-studio/examples/geneva-indexer/model.test.mjs
~~~

Build via the **explicitly prepared, pinned upstream** external-folder builder; the example README provides the commands. [CI's Geneva workflow](../.github/workflows/mechanism-studio-geneva.yml) builds the actual HTML, captures 18 short preview film frames, exercises controls, checks pixel-level repeatability, and packages the original as an integrity-verified preview. The independent source and limitation report are in the package.

## Future implementation (not shipped)

Reference -> numerical/kinematic checks -> isolated generated machine folder -> pinned Teardown adapter -> interactive controls and film timeline -> reproducible capture -> inspect decoded frames and offline behavior -> full package with source/rights and evidence receipts. A new original mechanism and full production-quality video are still required for standalone MVP completion.

Read [runtime and package details](README.md) and the pending technical design in specification PR #17. When prerequisites or evidence are absent, fail explicitly rather than manufacturing success.


## Four-bar crank-rocker: third machine (experimental)

A third reviewed family now uses **four revolute joints**, the signed circle-intersection solution and a branch-selectable 3D scene. See [four-bar geometry and singularity analysis](docs/four-bar-branch-analysis.md) and [the reviewed example](examples/four-bar/README.md). Its closed-form graph solver returns `closed`, `unreachable`, `singular` or `ambiguous` instead of inventing a valid pose. The film compiler permits only full-revolution, non-toggle sample dimensions. The live viewer can choose either mathematical branch; this is **not** simulated physical reassembly.

The same source, pose, auditor, Chromium and H.264/AAC pipeline is used for all three families. The four-bar sample targets **1280×720 at 24 fps for eight seconds**; the full Chromium/render/film pipeline has passed for the four-bar preview, but certified mechanical physics, actual hardware GPU and OS-level sandbox isolation remain unverified. Every package stays releaseReady=false.

## Declarative machine graph (experimental)

[Mechanism Graph v1](docs/declarative-machine-graph.md) now expresses parts, revolute/prismatic joints, input motion and constraints as inspectable millimetre-based data. The slider-crank's **actual body poses** are solved from this approved graph and drive the existing interactive viewer and deterministic Full HD film. The Geneva graph describes reviewed topology but **does not yet replace** its established ideal solver.

The compiler emits `mechanism-graph.json`, `machine-graph.mjs` and an unchanged copy of the canonical graph interpreter. Audits reject modified joints, sources or config before browser execution. Film packages now include the inspectable graph and require a linked mathematical proof. This is still a bounded graph language, not arbitrary mechanical CAD or a general-purpose physics solver.

## Independent model-claim audit

Before running any generated JavaScript in the renderer, use the [model-claim traceability contract](docs/model-claim-traceability.md). The auditor validates immutable reviewed module hashes, recomputes the numeric configuration from the brief, and tests independent geometric invariants for each supported machine family.

~~~bash
node mechanism-studio/scripts/audit-model.mjs /tmp/slider-crank-study-002 /tmp/slider-crank-study-002/audit.json
~~~

A passed audit confirms **internal kinematic consistency only**. It does **not** mean the linked technical papers were fetched, the chosen dimensions were measured, or physical forces were certified. Generated film packages now require the audit evidence, with `releaseReady=false`.

## Structured generation workflow (reviewed recipes only)

Use [machine brief format and documented commands](requests/README.md). A source-backed JSON request must identify a supported mechanism family, verified-safe numeric units/ranges, provenance classes and technical reference URLs. **References are recorded, not automatically fetched or asserted true.** All guessed dimensions are labeled assumed or illustrative.

~~~bash
node mechanism-studio/scripts/compile-request.mjs --list
node mechanism-studio/scripts/compile-request.mjs \
  --request mechanism-studio/requests/slider-crank-study.json \
  --out /tmp/slider-crank-study-002
~~~

After preparing the immutable Teardown revision in an isolated environment, build the generated folder with its existing external-machine builder. The [generation CI](../.github/workflows/mechanism-studio-generation.yml) performs real Chromium/offline/control/seek checks, captures a full **1920×1080, 30 fps, eight-second** video, synthesizes original illustrative machine audio, and muxes AAC into H.264 MP4. Independent source and audio tests run before builds.

A successful, inspected generated run can be packaged by `scripts/package-generated.mjs` and verified using the **same canonical** `scripts/verify.mjs`. It includes interactive HTML, final MP4, poster, decoded-frame contact sheet, request/source register, model source, full runtime receipts, notices and per-file SHA-256 hashes.

**Honest limitations:** three reviewed mechanism families only; remote references not fetched or automatically validated; physical forces/locking/certification not supplied; hardware GPU/mobile and host-level sandbox not evaluated. Film quality gates test the real decoded output, but no guarantee for arbitrary machines.
