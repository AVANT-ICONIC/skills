# Original four-bar crank-rocker (MM-003)

This is Mechanism Studio's third original machine family, created from an independently derived planar RRRR linkage and a **source-backed but not independently source-verified** brief.

- Source request: `../../requests/four-bar-study.json`.
- Canonical graph / branch solver: `../../scripts/mechanism-graph.mjs` and `../../scripts/fourbar-solver.mjs`.
- Local display: `stage.js` provides four procedural 3D rods, shafts, bearings, an engineering board and camera; `main.js` binds graph poses to the chart and original camera director.
- Actual controls: pause, RPM, ±15° step, **open/crossed assembly branch**, orbit, zoom, X-ray and separated assembly view.
- Source and tolerance details: [four-bar position and branch analysis](../../docs/four-bar-branch-analysis.md).
- CI capture: shared pinned Teardown runtime, real Chromium and FFmpeg, original synthesized foley. The brief's sample film target is 1280×720 at 24 fps for eight seconds.
- Physics limitations: no branch change-point traversal, no rigid-body interference, no forces/friction/material strength, no manufacturing certification or real hardware GPU benchmark.

**Branch changes are viewer choices**, not a model claim that the linkage can switch assembly states without disassembly. Sample dimensions are illustrative, not measured. All outputs stay previews with `releaseReady=false`.

~~~bash
node --test mechanism-studio/tests/fourbar-solver.test.mjs

node mechanism-studio/scripts/compile-request.mjs \
  --request mechanism-studio/requests/four-bar-study.json \
  --out /tmp/four-bar-crank-rocker-study-003
~~~

This folder is a reviewed recipe for the canonical compiler, not an alternative rendering engine.
