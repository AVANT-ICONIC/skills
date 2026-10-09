---
name: geometric-design
description: Build and audit source-backed monochrome symbol geometry, proportional compositions, responsive UI token systems, and design grammar with deterministic offline Node tools. Use when geometric correctness, φ provenance or reversible vector suggestions matter; not for generic writing or decorating already-accepted designs.
compatibility: Portable Agent Skills; optional Node.js 22+ for bundled offline JavaScript. Free renderer/browser optional for genuine raster/DOM checks; no paid APIs or Gauntlet dependency.
---

# Geometric Design

## Workflow and activation

Inspect the request, original artifacts and allowed changes. If a locked design/reference exists, preserve it. Read [canonical geometry policy](references/geometry-policy.md), choose only the relevant specialist mode and preserve untouched input. The bundled CLI requires Node.js 22+ and creates **new output paths** only. For any visual result, actually render/open/inspect it; source mathematics is never proof of recognition, aesthetics or WCAG compliance.

| Mode | Offline command from this skill folder | Boundaries |
| --- | --- | --- |
| Black symbol construction | `node scripts/s2/cli.mjs construct INPUT.json --out NEW.svg --report NEW.json` | Bounded SVG subset, connected black region default; multipart requires explicit mode; white counters paint white rather than alpha transparency |
| Source validation | `node scripts/s2/cli.mjs validate INPUT.svg --report NEW.json` | Non-orthogonal Booleans, free-form path curves, effects and unsupported XML fail closed |
| Standalone audit | `node scripts/s4/cli.mjs audit INPUT.svg --report NEW.json` | Native or supported SVG source; declared relations differ from inferred φ hypotheses; screenshot pixels not vector provenance |
| Non-destructive proposed repair | `node scripts/s4/cli.mjs propose INPUT.json --shape ID --radius VALUE --rule RULE --reason REASON --base-sha SHA256 --out NEW.json --report NEW.json` | Baseline digest required; compare all hard constraints/topology and request approval before identity change |
| Nested composition | `node scripts/s5/cli.mjs compose BRIEF.json --out NEW.json` | Three distinct semantic region families; fixed reference disables arbitrary variation |
| UI tokens | `node scripts/s5/cli.mjs tokens BRIEF.json --out NEW.css --report NEW.json` | φ-derived provenance, bounded accessible overrides and container-query fallbacks |
| HTML preview | `node scripts/s5/cli.mjs preview BRIEF.json --out NEW.html` | Inspect real browser output; no screenshot assertions from generated HTML alone |
| Cross-domain grammar | `node scripts/s6/cli.mjs grammar INPUT.json --out NEW.json` | Explicit rules and unresolved soft deviations; no universal beauty scoring |

Start with [synthetic sample brief](examples/brief.json) or [grammar input](examples/grammar-input.json). Do not assume arbitrary real artwork fits the limited subset. A documented `gap-card` 20px layout vs φ-derived token difference is offered as an **unapplied, reversible CSS token exception** (`PENDING_OWNER_REVIEW`), not a silent S5 change.

## Evidence and operating discipline

Separate `SOURCE_CHECKED`, `RENDERED_OBSERVED`, `NOT_EVALUATED`, `INDETERMINATE`, and `UNSUPPORTED`. If no renderer, continue source checks and identify the blocked visual gate. For visual acceptance run actual 8/16/24/32/64/128px captures (logos) or responsive browser checks (UI), inspect pixels and regressions, then fix and recheck. Any optical correction remains a proposed variant until owner approval.

Only offline built-in Node modules are required; optional actual raster checking uses locally available free Inkscape. No credential searches, in-place brand edits, deployment, or hidden paid tools. The independent Gauntlet workflow is *not* a runtime requirement or modified by this skill.
