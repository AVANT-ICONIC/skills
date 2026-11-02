# Mechanism Studio (experimental Stage 1)

A **public, portable** Agent Skill for source-grounded, model-driven mechanical explainers.

Current executable functionality: verify and package **already generated** Teardown V8 and Cessna example artifacts into standalone compatibility previews: HTML, MP4, poster, hash-verified evidence and upstream notice. It is **not yet** an autonomous machine generator.

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

The implementation plan lives in [PR #17](https://github.com/AVANT-ICONIC/skills/pull/17). Downstream consumer design is tracked separately in [Motion OS #6](https://github.com/AVANT-ICONIC/motion-os/pull/6) and [ICONICUT #2](https://github.com/AVANT-ICONIC/iconicut/pull/2). Next, a safe generated-machine adapter and one new source-grounded mechanism need to be built and verified before the actual standalone MVP is complete.
