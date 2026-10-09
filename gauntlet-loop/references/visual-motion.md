# Visual, reference and motion verification

Load when the artifact is an image, illustration, logo, typography layout, UI, animation, video, game visual, slide, report or rendered document. Combine with interaction checks for real apps/games.

## Reference lock

Before editing, establish:
- what specific supplied reference(s) represent and which parts are authoritative;
- exact output and reference resolutions, scale, DPR, aspect, color profile, transparency and fonts when known;
- fixed/variable elements, desired behavior and unverified unknowns;
- user-required fidelity (literal recreation versus inspired variation).

Do not accept a freshly invented design as a substitute for the actual supplied reference. Lock relevant comparable conditions: viewport, browser zoom, scale factor, typography loading, animation timestamp, state and visibility. Inspect reference and output directly.

## Render, inspect, measure

1. Use real target renderer where possible, not speculative HTML/CSS interpretation. Open the screenshot or equivalent output and actually inspect pixels.
2. Compare side by side at matched framing. Review macro-composition (large masses, silhouette, primary subject, layout) **before** micro spacing, color and polish. Numeric pixel differences are only useful when alignments/sizes are controlled; a raw mean error can mislead when anti-aliasing or content differs. Capture both visual judgment and quantitative evidence where available.
3. Inspect spacing, weight, typography, baseline, wrapping, radii, light/material response, proportion, borders, layers, shadows and sharpness. Check at native resolution and intended rendered size. Avoid quality claims based on a tiny or rescaled preview.
4. For web/mobile, capture the real final page at representative narrow and wide viewports. Check overflow, zoom, clipping, scroll, legibility, resize and focus states. **Do not equate scrollWidth <= innerWidth with a usable layout:** a container using `overflow: hidden` may silently clip the entire sidebar or action region without creating horizontal scrolling. Check critical element bounding rectangles against their clipping ancestors, actual screenshot pixels, reachability and interaction. Do not use CSS only injected into a screenshot to conceal production defects.
5. For logos and typography, preserve user-locked glyph/geometry; if task only asks to change a subpart, ensure the unedited parts stayed stable.
6. For raster/vector exports, check actual dimensions, transparency, clipping, unwanted halos, resolution and preservation of source detail, not just nominal output filename.

## Temporal inspection

A static-good frame is insufficient for a moving artifact. **An especially useful negative control is an animation whose first frame matches the reference exactly while its speed differs**. Where the browser supports the Web Animations API, pause both animations and sample their actual rendered states at *matched absolute elapsed times* (for example 0, 250, 500 ms), not matched percentages of differently sized cycles. Sample real screenshots, open them, and compare; `getComputedStyle`/animation metadata alone does not prove pixel fidelity. Inspect:
- opening/loop start, quarter, midpoint, three-quarter, loop seam, and notable transitions; sample more densely for fast motion or changes;
- deformation pattern, speed, easing, acceleration, synchronization, direction, periodicity and continuity;
- state-dependent behavior (idle/working/busy, hover, animation enablement), and whether variations actually differ;
- visible artifacts, frame drops, element popping, lighting or shape discontinuities.

Compare genuine motion evidence to a motion reference whenever one exists. Contact sheets give temporal coverage but may miss subtle optical flow; inspect actual playback when essential and available. If only screenshots are available, mark motion fidelity NOT_RUN.

## Critic roles

For substantial reference replication, use separate specialist lenses if host supports them:
- silhouette/composition and major geometry;
- typography/spacing/density;
- color, materials, lighting and visual fidelity;
- motion/state transitions where applicable;
- **one generalist without a preassigned lens**, seeking global mismatches that narrow critics miss.

Each critic must cite observations with location/measurement/timestamp and suspected cause. The builder may reject a critic suggestion when it would break the actual brief; record why. Never count multiple prompts to one continuous builder context as independent agents.

## Minimal verification record

~~~text
reference   path/revision/time
candidate   revision/path
conditions  viewport/DPR/scale/time/state
observed    genuine opened screenshot/frame/time-series
defect      what differs and where; major/critical/minor
cause       working hypothesis
change      files/props/geometry altered
recheck     new opened output and relevant regressions
~~~

**Critical failures:** no real output inspected, wrong core silhouette/layout, motion entirely unlike motion reference, source locked details destroyed, fake capture-only changes, clipped UI or broken interaction when required. After meaningful corrections, repeat until the bar passes or checkpoint honestly as non-PASS.
