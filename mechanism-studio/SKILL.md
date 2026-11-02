---
name: mechanism-studio
description: Create and validate source-grounded interactive 3D mechanical explainers, with deterministic films, synchronized readouts, and evidence-backed portable packages. Use for cutaways, moving linkages, engine and gearbox simulators, mechanical systems and explanations of how machines work.
compatibility: "Portable Agent Skills Markdown. Generation requires an explicitly prepared pinned Teardown checkout, Node.js, Playwright/Chromium, and FFmpeg. Skill installation does not install engine dependencies."
---

# Mechanism Studio

Model first, visuals second. One authoritative state must drive geometry, charts and readouts. Do not confuse synchronized graphics with verified engineering accuracy.

## Current status

Experimental Stage 1: **the provided CLI packages already-built, trusted upstream V8 and Cessna examples only**. It is NOT a general-purpose text-to-machine generator or a production-certified engineering tool. Refer to the [canonical specification](https://github.com/AVANT-ICONIC/skills/pull/17). Do not claim that a skill file alone implements 3D generation.

## Activation

Use for moving mechanical explainers, cutaways, interactive machines, simulations with measured/sourced inputs and synchronized gauges, and video plus HTML from one kinematic model. Skip image-only art requests, decorative 3D scenes and ordinary video edits.

## Hard rules

1. Source real-mechanism references first. Record input dimensions, units, derivations, estimates and illustration-only values. Never present assumed numbers as measured.
2. Keep physical state calculation conceptually separate from rendering. Derived geometry, readouts and film views should share one seekable model, even for multiple controls. Never manually keyframe separately synchronized measurements.
3. Use the immutable [upstream lock](upstream.lock.json). Do not fetch latest, vendor or fork the Teardown runtime automatically; an agent must prepare dependencies explicitly in an isolated workspace.
4. Generated JS and native dependencies are untrusted. A browser request filter is not an OS-level sandbox. Never execute unreviewed customer sources with privileged filesystem access, credentials or outbound access.
5. Inspect real screenshots, UI control behavior, film frames, model invariants, provenance, rights and decoded media before completing. Mark unexecuted gates NOT_EVALUATED.
6. Existing package outputs are **compatibility previews** and always declare releaseReady=false. No autonomous deployment or publication.
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

## Future implementation (not shipped)

Reference -> numerical/kinematic checks -> isolated generated machine folder -> pinned Teardown adapter -> interactive controls and film timeline -> reproducible capture -> inspect decoded frames and offline behavior -> full package with source/rights and evidence receipts. A new original mechanism and full production-quality video are still required for standalone MVP completion.

Read [runtime and package details](README.md) and the pending technical design in specification PR #17. When prerequisites or evidence are absent, fail explicitly rather than manufacturing success.
