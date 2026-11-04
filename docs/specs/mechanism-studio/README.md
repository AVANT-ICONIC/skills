# Mechanism Studio — canonical implementation specification

**Status: SPECIFICATION ONLY; no skill, CLI, package generator or adapter implemented by this PR.**

**Owner:** AVANT-ICONIC/skills (public Agent Skills collection)
**Date:** 2026-11-02
**Change:** plan and specify the first Mechanism Studio implementation without changing code or merging any PR.
**Intended future source:** AVANT-ICONIC/skills/mechanism-studio/ (not created by this planning PR).

## Locked decisions

| Decision | Selected |
| --- | --- |
| Distribution | Public portable skill in AVANT-ICONIC/skills |
| MVP output | Interactive offline-capable HTML + frame-rendered MP4 + inspectable evidence package |
| Runtime | Pinned [elvarofficial/teardown](https://github.com/elvarofficial/teardown) at candidate SHA a91262ac1109051e014662d42ecb0b7bc1f113b1, with a thin AVANT-owned adapter |
| Fork | No initial fork or vendor copy |
| Independent engine repo | No; require measured evidence before extraction |
| Integration | Motion OS / ICONICUT use future separate approved changes |
| Code status | No implementation and no merges |

The pinned SHA is a **candidate planning baseline**, not yet a successful build/test receipt. A future Stage 0 test validates or revises this exact lock candidate.

## Document ownership

1. [proposal.md](proposal.md): why, user outcome, product scope, ownership, non-goals.
2. [requirements.md](requirements.md): normative requirements R1–R12 with WHEN/THEN acceptance scenarios.
3. [design.md](design.md): future module architecture, upstream pin, state/seek contract, manifest, evidence, security and integration boundaries.
4. [tasks.md](tasks.md): staged implementation plan, gates T0–T4, scenarios A01–A15 and stop criteria.

These four files constitute the **single canonical specification** for Mechanism Studio. The two consumer PRs are cross-repo integration proposals, not duplicate copies of this specification:

- [Motion OS draft PR #6](https://github.com/AVANT-ICONIC/motion-os/pull/6)
- [ICONICUT draft PR #2](https://github.com/AVANT-ICONIC/iconicut/pull/2)

## Development handoff

The first implementation action after this spec is approved is **Stage 0**, a reproducible benchmark of the pinned upstream checkout and its runtime/capture behavior. Stage 1 creates the actual portable skill. Stage 2 validates a newly generated mechanism and completes the standalone MVP. Later integrations must be separately approved.

For specification-only review, check: locked decisions do not drift across documents; every MVP requirement has a matching future task and test; manifest/viewer/video/evidence are consistently named; upstream is not represented as executed; no production code was changed; and no PR was merged.

## Known unverified facts

- Build and frame-capture behavior at the candidate pinned commit have been inspected in source, **not executed**.
- Exact numeric performance budgets, installation reliability and network isolation capabilities require Stage 0 runtime evidence.
- Motion OS and ICONICUT integration remains future work; this spec does not claim that either can consume the proposed package format today.

This plan is frozen for review, not a declaration of an operational product.
