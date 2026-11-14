# Material and spatial interaction: believable relationships, not decorative skeuomorphism

Read when a brief calls for tactile, material, cinematic, glass, paper, ink, corkboard, whiteboard, canvas, spatial or mixed-reality-inspired interfaces. These are **conditional design options**, not the style of every UI. Product identity and reference constraints still decide what belongs.

## Model material as behavior

A material is more than a texture preset. Specify what it is attached to, what it obscures, how it responds to light/input, and how the user can manipulate it. Useful material families include glass, metal, paper, ink, soft polymer, luminous screen, whiteboard and pinboard. Never assume a board means cork; a whiteboard, wall, desk, window or infinite digital canvas may better communicate the work.

For each material-bearing object, record:

- **Role and metaphor:** why is this object physical here? What task relation does that imply?
- **Attachment:** floating, pinned, stacked, clipped, embedded, dragged, connected, or fixed to a shared surface?
- **Lighting:** an internally consistent direction and visual response; avoid contradictory shadows and highlight sources.
- **Motion:** mass, resistance, inertia, settling, snap, stretch, or no motion. Animated material must not falsely suggest a completed action.
- **Interaction:** pointer, touch and keyboard equivalents; focus, hit area, drag handle, escape, undo and recovery.
- **Cost:** blur, transparency, large composited layers and heavy motion are performance trade-offs, not free polish.

A paper note can retain its position on a whiteboard while its text stays crisp. An ink stroke can connect two objects without implying that the ink is itself a clickable button. Glass can communicate a floating control without covering the data it must operate on. Physical plausibility is a design constraint only where it clarifies interaction; digital interfaces may intentionally break physics for accessibility or efficiency.

## Spatial grammar

Distinguish **world coordinates** (content), **viewport coordinates** (what is visible), and **screen-fixed controls** (navigation, status, escape routes). A spatial interface needs decisions for zoom, pan, drag, selection, snap, grouping, z-order, occlusion, collision, viewport restore, remote cursors and collaboration conflicts as applicable.

Do not invent spatial interaction where a linear table would be faster. Use spatial placement when relationships, exploration, comparison, simultaneity or manipulation provide genuine value. Keep an alternative route to essential objects when they are offscreen, obscured, shrunk or inaccessible by gesture.

If multiple participants can move objects, make authorship, locks, pending moves, conflicts and undo understandable without reinterpreting chat messages as surface truth. Persist objects and layout separately from transient viewport position where appropriate.

## Material composition and performance

- Reserve strong visual material for meaningful hierarchy; avoid every nested region becoming a separate frosted card.
- Keep text contrast and interaction states legible on unpredictable backdrops. Do not rely on lighting alone for status.
- Ensure materials degrade gracefully when transparency, filters, motion or GPU acceleration are unavailable.
- Test real target device and data density. A beautiful still is not evidence of interaction frame rate or correct occlusion.
- Offer reduced-motion behavior that preserves spatial meaning and state transitions rather than merely removing every cue.

## Review probes

1. Disable textures and shaders. Do object relationships and active actions remain understandable?
2. Disable blur and exaggerated depth. Does hierarchy still work?
3. Move, zoom, resize and revisit the workspace. Are object positions, attachments and the user's place recoverable?
4. Simulate overlapping elements, long text, remote edits and interrupted drags.
5. Compare a static screen, a motion intermediate frame, and the returned/restored state. Record what actually ran versus what is proposed.

This is a design vocabulary, not a CSS engine, physics simulation mandate or verified accessibility certificate.
