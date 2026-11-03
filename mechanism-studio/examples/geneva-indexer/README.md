# Geneva Indexer: original Mechanism Studio vertical slice

**Status:** Experimental Stage 2. A source-grounded, original mechanism and live/film interface, not a manufacturing CAD model or engineering-certified simulation.

## What it demonstrates

A classical four-slot external Geneva indexing drive turns a constantly rotating input crank into four intermittent output stations. A drive pin enters a radial slot and advances the output wheel by 90° during the central 90° of each 360° input revolution; the idealized output dwells for the remaining 270° (75%). The input-driven output speed peaks at roughly 2.414× the input speed near mid-index and reaches zero at slot entry/exit.

This implementation is a **kinematic demonstrator only**. It **does not model the locking cam/disc, friction, contact forces, pin compliance, tolerance stack-up, dynamic impact, mechanical loads, wear, or manufacturing feasibility**. Output is held by an idealized constraint during dwell, not a physically modeled lock. The driver disc is a crank hub/arm, not the complete relieved locking plate. The 3D geometry is illustrative but follows the specified slot/pin path.

## Independent technical grounding

- Classical 4-slot Geneva geometry, r = 30 mm, C = r / sin(π/4) = 42.4264 mm, 90° engagement window and 75% dwell: [planex2d Geneva drive and locking disc](https://planex2d.org/docs/examples/geneva-drive.html).
- General design relationships for Geneva center distance, crank radius, slot width and clearance: [Wiley, Introduction to Mechanisms, Figure 1.15](https://catalogimages.wiley.com/images/db/pdf/9781119054337.excerpt.pdf).
- Wider mechanical context for intermittent movement: [Machines and Mechanisms, Geneva mechanism kinematics](https://thuvienso.tnut.edu.vn/bitstream/123456789/1646/1/19%20Machines%20and%20mechanisms%20-%20Applied%20kinematic%20analysis.pdf).

The source relationships informed independently written JavaScript; no source diagrams, images or models are redistributed. The exact pin-path kinematics are derived from the pin's polar angle relative to the driven wheel center. Source-supported geometry is distinguished from presentation-only dimensions and decorative materials.

## Model assumptions (millimetres)

| Quantity | Value | Classification |
| --- | --- | --- |
| Number of radial slots | 4 | Chosen design |
| Crank pin orbit radius | 30 mm | Chosen design based on documented classical example |
| Driven wheel/driver centre distance | 42.4264 mm | Derived: 30/sin(π/4) |
| Pin radius | 2.0 mm | Illustrative engineering choice |
| Slot half-width | 2.4 mm | Illustrative choice: 0.8 mm full diametral clearance |
| Slot inner-end centre | 9.5 mm | Chosen by collision constraint; test checks pin clearance at all engaged phases |
| Output disk outer radius | 34 mm | Illustrative, enough to contain the entry/exit pin path |
| Input speed | 12 RPM | Default demonstrator setting |
| Output indexing | Clockwise 90° per input revolution | Exact idealized kinematics |
| Dwell share | 75% of input revolution | Exact idealized kinematics |
| Locking reaction forces | Not modeled | Known limitation |

## Architecture

- `model.mjs`: pure model evaluator, no Three.js or frame-to-frame integration, shared by live and capture.
- `stage.js`: procedurally modeled board, slots, crank, pin and output wheel; reads absolute model state.
- `main.js`: interface and controls; `runSim` handles standalone live loop and deterministic `window.SIM.render(t)` capture at immutable pinned Teardown revision.
- `style.css`: responsive visual engineering console.
- `model.test.mjs`: independent numeric invariants, entry/exit continuity, pin/slot collinearity and arbitrary seek ordering.
- `smoke.mjs`: real browser + media evidence on the CI runner.

**One shared entrypoint:** Build `geneva-indexer/main.js` with Teardown's existing external-folder support. No copied upstream engine, no parallel simulation tracks, no modified upstream source.

## Build with prepared upstream

Use the existing immutable revision and lockfile from `mechanism-studio/upstream.lock.json`. Only after separately and explicitly preparing that trusted checkout and dependencies:

~~~bash
node --test mechanism-studio/examples/geneva-indexer/model.test.mjs

# From a prepared Teardown checkout, using an absolute path to this repo:
TEARDOWN_OUT=/tmp/mechanism-geneva \
  node sims/build.mjs /absolute/path/to/skills/mechanism-studio/examples/geneva-indexer

# The generated, fully bundled file is:
# /tmp/mechanism-geneva/dist/geneva-indexer.html
~~~

Open in a supported WebGL2-capable browser from a local file. The page has orbit, zoom, speed, pause, 15° stepping, top view, illustrative x-ray opacity and exploded part-spacing.

## Verification and known gaps

Seven pure model tests pass locally (Node.js 22). The first real CI build, interaction, screenshot, deterministic seek, offline and MP4 verification is pending; report it separately, not as already passed. CI software-GPU performance is not representative of integrated mobile devices.

The original mechanism is intended as the next development milestone after [package PR #19](https://github.com/AVANT-ICONIC/skills/pull/19), built over [Stage 0 benchmark PR #18](https://github.com/AVANT-ICONIC/skills/pull/18) under the [canonical specification PR #17](https://github.com/AVANT-ICONIC/skills/pull/17).

No production release, merge, or downstream Motion OS/ICONICUT application edits are part of this change.
