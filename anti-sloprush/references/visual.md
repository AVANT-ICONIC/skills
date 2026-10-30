# Visual inspection, fidelity and polish

Use when the user requested imagery, editing, poster replacement, layout, UI visuals, rendered documents, animation, video or games.

## Before rendering
- Establish exactly which source image controls background/composition and which controls each subject/detail; avoid mixing image order. Name frozen parts, authorized edits and identity-sensitive details.
- Where relevant lock resolution/aspect, viewport, crop, time, light, scale, fonts, poses, exact copy, number/position of subjects, transparency and protected content.
- Set concrete fail conditions: wrong subjects/faces, altered tattoos, missing belts, wrong pose, cutout edges, duplicated limbs, changed brand elements, unreadable type.

## Real observation
- Inspect the actual **returned image** or rendered screenshot at intended/native viewing size. Use matched reference/output side-by-side (or explicitly inspect both); zoom/crop critical regions and edges.
- Check hierarchy and composition before lighting/polish; verify subject fidelity, count, preserved details, anatomy, typography, shadows, masks, artifacts, edge halos, clipping and visual cohesion.
- For UI capture real narrow/wide states and interactions; screenshots cannot prove click behavior. For motion inspect frames across time and if possible play the actual motion; one good still is insufficient.
- A successful image-generation invocation is NOT visual inspection. If the tool response hides the generated image, report NOT_EVALUATED and do not certify a final result.

## Repair choice
- Fix root cause using the smallest controllable edit. After repeated identity drift, stop full-frame regeneration and switch to reference-preserving composite/local edits if supported.
- Maintain best known candidate and compare each repair to the actual frozen source. A beautiful but unfaithful result fails.
- Reinspect changed and protected regions after EVERY edit, not merely the new highlight.
- Failing detail is not offset by attractive texture, lighting or poster polish.

For specialized visual and motion procedures load existing `gauntlet-loop`, `visual-gauntlet`, `video-watch` or similar skill when available. This is a completion gate, not an image-editing engine.
