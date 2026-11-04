# Mechanism Studio (experimental Stage 2, reviewed recipe generator)

A **public, portable** Agent Skill for source-grounded, model-driven mechanical explainers.

Current executable functionality: package vetted Teardown V8/Cessna upstream examples, render the independent Geneva four-slot reference, and **compile structured source-backed briefs for two reviewed mechanism families: Geneva and slider-crank**. The slider-crank has a tested **1080p30 eight-second H.264/AAC film** with original synthesized mechanical foley, a live interactive HTML viewer, and a versioned hash-verified evidence package. It remains bounded and does not generate arbitrary mechanisms from images or natural-language descriptions.

## Setup and prerequisites

- Node.js 22+, Git, FFmpeg/FFprobe, and supported Chromium/WebGL for upstream generation.
- An explicitly prepared checkout of [elvarofficial/teardown](https://github.com/elvarofficial/teardown) at the full commit in [upstream.lock.json](upstream.lock.json). That upstream project's Three.js, esbuild and Playwright dependencies are installed separately, with appropriate safeguards.
- No implicit network installations from these commands. Artifact verification only needs Node.js.

Never run unreviewed generated JavaScript on a privileged workstation; the benchmark operates on inspected, pinned upstream examples only.

## Commands

~~~bash
node --test mechanism-studio/tests/*.test.mjs
node mechanism-studio/scripts/package-example.mjs --help
node mechanism-studio/scripts/package-example.mjs --upstream /path/to/pinned/teardown --run /path/to/stage0-output --machine v8 --out /path/to/new/v8-preview
node mechanism-studio/scripts/verify.mjs /path/to/new/v8-preview
~~~

The Stage 0 output contains report.json, machine-film.mp4, machine-live-1.png and upstream-dist/dist/machine-live.html, where machine is v8 or cessna. Generate it using the checked-in [benchmark](../.github/benchmarks/mechanism-studio/README.md) on an explicitly prepared, isolated host.

## Original four-slot Geneva reference machine

See [the original Geneva source, geometry, tests and honest limitations](examples/geneva-indexer/README.md). The packaged original is **not** a manufacturing-ready mechanism: it models exact idealized 90° indexing and dwell but not physical locking-cam forces. The first CI-tested film is 18 frames at 6 fps, H.264, 640×360.

~~~bash
node --test mechanism-studio/examples/geneva-indexer/model.test.mjs
# Build from the explicitly prepared Teardown checkout:
TEARDOWN_OUT=/tmp/geneva-out node sims/build.mjs /absolute/path/to/skills/mechanism-studio/examples/geneva-indexer
# After the original Geneva smoke test has passed:
node mechanism-studio/examples/geneva-indexer/package.mjs /path/to/pinned/teardown /tmp/geneva-out /path/to/new/geneva-preview
node mechanism-studio/scripts/verify.mjs /path/to/new/geneva-preview
~~~

[Original Geneva CI workflow](../.github/workflows/mechanism-studio-geneva.yml) generates real browser frames, interactions, video and a portable original-preview package.

## Package format

~~~text
v8-preview/
  manifest.json
  viewer/index.html
  video/film.mp4
  preview/poster.png
  evidence/benchmark.json
  LICENSES/teardown-MIT.txt
  NOTICE
~~~

The manifest records timebase, entrypoints, upstream immutable revision, source lock SHA-256 and byte+SHA-256 for six distributed artifacts. The verification CLI checks recorded files, rejects symlink files, missing assets, malicious paths, mismatched digests and unknown schema versions. It never overwrites an existing package.

**Preview limitations:** short low-fps capture, software GPU, borrowed upstream mechanisms, no independent hardware benchmark, incomplete process sandbox proof and attribution audit. releaseReady=false always.

The implementation plan lives in [PR #17](https://github.com/AVANT-ICONIC/skills/pull/17). Downstream consumer design is tracked separately in [Motion OS #6](https://github.com/AVANT-ICONIC/motion-os/pull/6) and [ICONICUT #2](https://github.com/AVANT-ICONIC/iconicut/pull/2). The bounded source-brief generator and full-duration Full HD film are implemented and CI-tested; remaining MVP gates include arbitrary reference interpretation (including real-image analysis), independent engineering/source verification, hardware/mobile GPU performance, complete licensing review, and host-level sandbox isolation.


## Graph-driven motion

[Mechanism Graph v1](docs/declarative-machine-graph.md) is the first portable, explicit **body–joint–constraint contract**. It supports reviewed planar bodies, revolute and prismatic joints, and a closed-form positive-root slider-crank solver. The graph computes crank, rod and piston body poses from actual joint anchors, and the existing 3D scene renders those states. The companion Geneva representation intentionally declares an **unimplemented graph solver**, retaining the independently verified original motion code.

The compiler outputs inspectable graph JSON, an executable but data-only graph module and the pinned canonical solver; the auditor hashes all of them and recomputes their constraints. The generated film package includes the graph in its evidence bundle (**12 individually hashed files**). Graph v1 is not untrusted script execution, arbitrary source interpretation or a physics/material-load certification.

## Model-claim evidence gate

A source URL is not proof. Before running compiled mechanism code, [`scripts/audit-model.mjs`](scripts/audit-model.mjs) hash-checks reviewed templates and numeric config, then verifies analytic closure, geometry and motion invariants for both families. Source documents remain explicitly **NOT_EVALUATED**, and assumed dimensions are not relabeled as measurements.

See [model-claim traceability](docs/model-claim-traceability.md). Portable generated packages now include `evidence/model-audit.json`, with **12** individually hashed assets including the machine graph, and reject missing/forged claim receipts.

## Two reviewed families and Full HD film

Refer to [the structured request guide](requests/README.md) and the included machine briefs. Inputs require linked technical references and explicitly labeled dimension assumptions. Unknown types are rejected. The compiler only emits reviewed source templates and numeric configuration; it **does not fetch linked sources or execute untrusted user scripts**.

~~~bash
node mechanism-studio/scripts/compile-request.mjs --list
node mechanism-studio/scripts/compile-request.mjs \
  --request mechanism-studio/requests/slider-crank-study.json \
  --out /tmp/slider-crank-study-002
~~~

The generated directory is then built by the separately prepared pinned Teardown builder. The [full generation + film workflow](../.github/workflows/mechanism-studio-generation.yml) runs model, security, browser, offline playback, video, original foley and package integrity checks in ephemeral CI.

The Full HD example uses **1920×1080 at 30 fps for eight seconds (240 frames)**, H.264 video plus 48 kHz AAC original designed sound, verified with FFprobe and decoded-frame samples. The reusable generated-study package holds **viewer HTML, final MP4, poster, contact sheet, request, technical source register, model source, real test receipts, notices and hashes**. Its `releaseReady` flag remains false until the separate hardware, sandbox, source-audit and release review gates pass.
