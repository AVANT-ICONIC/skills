# Mechanism Studio: compiler consolidation, phase 2

**Status:** reviewed source relocation, stacked on draft phase 1. Five generated studies and both package formats retain their original contracts. No merges, no production applications changed.

## Single source of truth

`mechanism-studio/templates/rigid-scene/` is now the only editable implementation of the generic renderer and its SE(2) scene evaluator. The old paths under `rigid-scene/` are Git symlinks, not duplicated source files. `scripts/trusted-rigid-template.mjs` is the canonical owner of the allowed file list and checks source type, exact facade targets, and resolution before copying. A missing, edited or redirected facade fails closed.

The canonical `scripts/rigid-pose-core.mjs` remains independent. Its repository-side template import is a development-only symlink; the generated package still includes the exact original standalone solver and film director.

`rigid-scene/compile-scene.mjs` retains its two-positional-argument CLI, JavaScript API, data model, atomic staging and return receipt. It copies the canonical template instead of a parallel copy in `rigid-scene/`. The already-shared schema dispatcher `scripts/compile-study.mjs` and three named reviewed-recipe backends remain unchanged.

## Strict frozen compatibility contract

Frozen baseline: PR #32 commit `e952c699fe0f83ceb9b127a469db7bcb8930d667`.

| Family | Input | Output format |
| --- | --- | --- |
| Geneva indexer | `requests/geneva-four-slot-study.json` | `avant.mechanism-package/1` |
| Inline slider-crank | `requests/slider-crank-study.json` | `avant.mechanism-package/1` |
| Four-bar crank-rocker | `requests/four-bar-study.json` | `avant.mechanism-package/1` |
| Five-bar dual-drive | `rigid-scene/scene.json` | `avant.rigid-scene-package/1` |
| Prismatic crank-slider | `rigid-scene/slider-rail.json` | `avant.rigid-scene-package/1` |

The existing `compatibility/compiler-parity.mjs` compiles each fixture three times: frozen legacy, new legacy and shared dispatcher. It compares **every generated filename and byte**, including UI, stylesheet, machine data, source register and README. It also checks that reviewed-recipe runtime, numeric auditing, package reader and film code remain unchanged.

**Allowed source-only exception:** the rigid-scene package verifier must read the new canonical regular files because its existing `lstat` check intentionally refuses symlink inputs. `compatibility/phase2-golden-package.mjs` requires the entire verifier source to match the frozen PR #32 verifier after **exactly two permitted textual substitutions:** one import and one trusted-source lookup. Any other change, including manifest schema, file list, physical disclaimer or release gate, fails the compatibility check.

The two generated rigid scenes must contain **byte-identical** `main.js`, `model.mjs`, `stage.js`, `style.css` and `scene-core.mjs`. No new machine-specific renderer or solver has been introduced. The four-bar and other reviewed recipe renderers are deliberately not transplanted into this template: that would change verified visual output and is a separate migration.

## Gates and actual execution

Run cheap tests before installing Teardown:

```bash
node --test mechanism-studio/compatibility/phase1.test.mjs
node --test mechanism-studio/compatibility/phase2-template.test.mjs
node --test mechanism-studio/rigid-scene/*.test.mjs
node mechanism-studio/compatibility/compiler-parity.mjs --baseline-dir /path/to/PR32
```

The existing dedicated rigid-scene CI checks out the frozen PR #32 tree, runs the five-fixture byte gate, then installs immutable Teardown/browser/FFmpeg **once** and captures both generic films in one job. The reviewed-recipe generation job is not broadened by this source move. Current-revision screenshots, frame-seek identity, branch switching, prismatic-rail animation, full 720p24 H.264/AAC film decoding and both packages' eleven source-asset hashes remain required.

**Rollback:** restore the prior `rigid-scene` regular source files and original copier from phase-1 branch, without altering any persisted preview package or data. Do not migrate `avant.mechanism-package/1` or `avant.rigid-scene-package/1` at this stage.

## Honest limitations

This relocation establishes one trusted renderer owner and compatibility. It does **not** establish universal CAD, independent source-document rights, physical loads, 3D collision avoidance, global branch completeness, production hardware GPU performance, signed output, or OS-level sandbox isolation. `releaseReady=false` remains mandatory. Do not merge while any frozen golden, browser or video gate fails.

**Phase 3** may propose a canonical proof/package reader with explicit schema migration, only in a separate reviewed change and only after this parity milestone remains green.
