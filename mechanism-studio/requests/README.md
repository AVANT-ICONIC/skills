# Structured machine briefs (experimental)

The reviewed recipe compiler converts a **source-backed, strictly typed JSON brief** to a local Teardown-compatible machine source folder. This is a bounded, reproducible generator, **not** universal CAD, text-to-3D, engineering analysis, or untrusted code execution.

## Supported families

| Mechanism | Configurable parameters | Underlying model |
| --- | --- | --- |
| `geneva-4` | Fixed demonstrator geometry | Independent four-slot intermittent-drive kinematics with idealized dwell (locking cam absent) |
| `slider-crank` | crankRadiusMm, rodLengthMm, inputRpm | Analytic in-line crank-slider geometry, piston position, rod angle and derivative speed |

Only reviewed, checked-in recipe modules are copied. Unknown machine types or unexpected fields fail explicitly. New mechanism families require their own model, geometry, tests, provenance and acceptance evidence.

## Source and number provenance

The request contains concrete links to technical references. **Compiler does not visit those URLs, verify their contents, import pictures or redistribute them.** Its output states `sourcesFetched=false`; physical correctness still requires independent reviewer checks. Every numeric parameter must declare units, a provenance class, an explanatory note, and matching source IDs if sourced, measured or derived. Assumed/example dimensions remain labeled assumptions.

For the slider-crank's analytic relationship, see [Planex2D slider-crank](https://planex2d.org/docs/examples/slider-crank.html) and [EngineeringKit kinematic equations](https://cpoli.github.io/engineeringkit/api/mechanical_engineering.html). The current reference geometry comes from these relations; the sample values (32 mm crank radius, 105 mm rod, 15 RPM) are illustrative.

## Build a source-backed machine

~~~bash
node --test mechanism-studio/tests/compile-request.test.mjs
node mechanism-studio/scripts/compile-request.mjs --list

node mechanism-studio/scripts/compile-request.mjs \
  --request mechanism-studio/requests/slider-crank-study.json \
  --out /tmp/slider-crank-study-002

# From the separately prepared, immutable Teardown checkout:
TEARDOWN_OUT=/tmp/my-films \
  node sims/build.mjs /tmp/slider-crank-study-002
~~~

The generated directory contains `main.js`, `model.mjs`, `stage.js`, the canonical console `style.css`, validated numeric-only `machine-config.mjs`, request and source-register JSON, and a generated README.

It is NOT yet signed, certified, safe to run with untrusted templates, or production-released. Do not execute generated JS with user credentials or privileged filesystem access. The CI runner is ephemeral, and browser network interception alone is **not** a complete security boundary.

## Graph representation

The validated compiler also produces `mechanism-graph.json` and `machine-graph.mjs`. These are derived from the typed brief and reviewed body/joint schema rather than copied from customer JavaScript. For the slider-crank, the model's actual pose and velocity now come from a canonical joint-constraint evaluator. See [the graph-v1 contract](../docs/declarative-machine-graph.md). The Geneva graph remains descriptive until its graph solver is validated.

## Video profiles and QA

Supported **16:9** film targets:
- 1280×720 at 24, 25 or 30 fps.
- 1920×1080 at 24, 25 or 30 fps.

Duration is an integer from 6 to 30 seconds. The current CI exercises **1920×1080, 30 fps, eight seconds** (240 frames), with a fixed seekable mechanical model, CRF 18 H.264, original synthesized mono 48kHz foley muxed to AAC, and separate decoded-film samples. Sound is a designed illustration, not a measured engine recording or existing copyrighted music.

**No video, contact sheet or package is claimed verified unless its exact latest GitHub CI run passed**. A source folder compiles through immutable Teardown, then the playback probe checks actual WebGL snapshots, controls, repeat-frame hashes, codec/timebase, film variation, decoded frames and AAC audio. The packaging step preserves the viewer, final MP4, source register, model source, poster/contact sheet, NOTICE and individual SHA-256 digests. Packages carry `releaseReady=false` until missing hardware, full physical QA and sandbox gates are resolved.

## Independent CLI verification

~~~bash
node --test mechanism-studio/tests/compile-request.test.mjs \
  mechanism-studio/tests/audio.test.mjs \
  mechanism-studio/tests/package-example.test.mjs
~~~

For an already successful real run, package and verify:

~~~bash
node mechanism-studio/scripts/package-generated.mjs \
  /path/to/pinned/teardown \
  /path/to/generated/machine \
  /path/to/evidence/machine \
  /path/to/build-root \
  /path/to/new-package

node mechanism-studio/scripts/verify.mjs /path/to/new-package
~~~

All commands fail closed on a missing immutable upstream pin, fake green test results, mismatched video metadata, duplicate output directory, corrupted copied assets or false engineering-certification claims.

## Boundaries

- One canonical source and package verifier in `mechanism-studio/scripts`.
- Scene templates and mathematical models remain in the corresponding `examples/` folder, not duplicated inside each consumer.
- Teardown stays external and immutable; a production film is a standalone artifact.
- Motion OS and ICONICUT can consume packages later via separately approved, unmerged proposals.
- Broader source ingestion, image interpretation, independent dimensions/physics audit, arbitrary mechanisms, physical GPU benchmarks and real OS sandbox isolation are NOT currently implemented.
