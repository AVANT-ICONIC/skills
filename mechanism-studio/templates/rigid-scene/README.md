# Canonical trusted rigid-scene template

**One implementation owner:** the five regular files in this directory:
`main.js`, `model.mjs`, `stage.js`, `style.css`, `scene-core.mjs`.

Both `avant.rigid-scene/1` fixtures, five-bar and prismatic crank-slider, compile **these identical renderer bytes**. Their geometries, branch seeds, source registers and study IDs are provided as separate validated data.

The prior `mechanism-studio/rigid-scene/{main.js,model.mjs,stage.js,style.css,scene-core.mjs}` paths remain **Git symlinks** pointing here. Do not edit them or add a second implementation. `scripts/trusted-rigid-template.mjs` requires canonical regular files and the exact symlink targets before compilation. `scene-core.mjs` imports the canonical rigid-pose solver through the development-only `rigid-pose-core.mjs` symlink; compiled outputs independently copy the pinned canonical script.

**Compatibility:** the old positional `compile-scene.mjs` CLI, `scripts/compile-study.mjs` dispatcher and `avant.rigid-scene-package/1` manifest stay unchanged. Generated renderer source bytes must match frozen PR #32, including the CSS, and both recorded films must pass actual CI before a release claim.

A symlink-aware Git checkout is required for local repository tests (Linux/macOS). The self-contained compiled HTML and packaged preview have **no dependency on these repository symlinks**. This is integrity checking, not a code signature, OS sandbox or mechanical certification.

See [phase-2 consolidation contract](../../docs/compiler-consolidation-phase2.md).
