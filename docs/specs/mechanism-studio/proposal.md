# Mechanism Studio: product proposal

Status: **SPECIFICATION ONLY — NOT IMPLEMENTED**
Date: 2026-11-02
Target: AVANT-ICONIC/skills
Parent index: [README.md](README.md)

## Problem and opportunity

Mechanically correct-looking 3D explainers are expensive to author and easy to misrepresent when independent animation tracks drive models, instruments and charts. The public, MIT-licensed [elvarofficial/teardown](https://github.com/elvarofficial/teardown) demonstrates an agent-oriented workflow with mechanism-specific geometry, model-driven gauges, live controls, cutaways, frame-addressable rendering and sound. Its builder and capture tooling are useful upstream components, not a stable cross-product interface.

AVANT-ICONIC needs one **portable agent skill** which turns a grounded machine brief into three independently useful and jointly consistent deliverables: an interactive offline-capable viewer, an encoded video, and inspectable evidence. The skill should remain usable by agents outside Motion OS or ICONICUT, while producing artifacts both tools can later consume.

## Decisions locked by owner

- **Distribution:** public skill in AVANT-ICONIC/skills, portable Agent Skills format.
- **First deliverable:** interactive HTML viewer + video + evidence package in a single versioned directory.
- **Runtime:** pinned upstream teardown checkout with a thin AVANT-owned adapter; no fork, vendor copy, standalone engine repository, replacement Three.js runtime, or second full film renderer at MVP.
- **Repository:** canonical portable behavior resides here. ChatGPT-specific routing may link to it from gpt-webui-skills; it must not become a second implementation.
- **Change boundary:** write and review this specification before implementation. Keep existing motion-os and iconicut draft PRs as downstream proposals; do not merge or alter their application code here.

## Audience and jobs

1. An agent or creator requests a comprehensible mechanism demonstration, with references and allowed assumptions.
2. A reviewer needs to distinguish physically sourced behavior from illustrative approximations.
3. A presenter publishes a self-contained educational viewer and film from one model.
4. Later, Motion OS can use the video and metadata to compose a directed film, and ICONICUT can edit imported clips.

## MVP definition

A successful MVP can reproduce one of the original teardown examples under a pinned revision, and generate one new reference-grounded mechanism with the following delivered together:

- Interactive viewer with orbit/zoom, meaningful model control(s), component isolation/cutaway, synced readouts, keyboard/touch fallback, and idle tour only when supported.
- Deterministically captured MP4 at declared resolution, fps and duration. A soundtrack is optional for the first vertical slice; any included music/sounds must retain rights and timing evidence.
- A versioned manifest, source provenance, numeric validation and test receipts, visual inspection contact sheet, media hashes and license notices. Unverified measurements must be labeled.
- Offline use after installation/build: no remote request is necessary to explore or play the result. For multi-file bundles, a local loopback asset server may be necessary instead of file:// because browsers restrict local asset loading.

The original machine must not rely on manually independent keyframes for its geometry and gauges. State may have multiple inputs; it must have one authoritative, inspectable model.

## Explicit non-goals

- No new full simulation engine, generic provider marketplace, plugin registry, physics solver, fluid dynamics or FEA.
- No claim that physically plausible visuals are certified engineering simulations.
- No autonomous publication/deployment or third-party URL fetching without permission.
- No guaranteed sub-1 MB HTML for models requiring external files; preserve fast metadata and preview images while measuring actual payload size.
- No direct requirement to edit 3D meshes inside ICONICUT.
- No requirement that Motion OS or ICONICUT be installed to use the skill.
- No copying upstream code into the public repo as a shortcut.
- No modified production source, skills, tools or CI in this specification PR.

## Ownership and dependencies

**AVANT-ICONIC/skills:** agent guidance, evidence standards, proposed portable package format, dependency doctor, thin adapter and future tests.
**Upstream teardown:** mechanism builders, Three.js scene runtime and existing capture methods, pinned for repeatability.
**Motion OS:** downstream style, editorial pacing, sound, film rendering and QA when integration is separately implemented: [draft PR #6](https://github.com/AVANT-ICONIC/motion-os/pull/6).
**ICONICUT:** downstream media editing and export, preserving Rust architecture and its V5 manifest: [draft PR #2](https://github.com/AVANT-ICONIC/iconicut/pull/2).

## Success and failure conditions

Success is proven by actual generated package bytes, a working offline viewer, decoded video inspection, deterministic state checks, source-backed numerical comparisons and a second-machine generation receipt. A successfully written SKILL.md or a claimed GPU benchmark is insufficient.

Fail if missing assets, unsupported browsers, numeric inconsistency, unsafe network access, unlicensed third-party media, or a brittle upstream dependency cause output to be reported as complete. Fail explicitly and preserve partial evidence instead.

## Launch boundary

This document, [requirements](requirements.md), [design](design.md), and [tasks](tasks.md) are a **proposal for later implementation**. They do not indicate an installed skill or an executable adapter. The first implementation change must begin with the pinned upstream compatibility benchmark and follow the project review workflow.
