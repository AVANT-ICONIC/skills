# Surface grammar: structural nesting is not visual nesting

This is a design-judgment reference for interfaces, not a required component library, a CSS replacement, or a mandatory aesthetic. Read when the interface contains repeated cards, panels, subpanels, dashboards, complex navigation, layered material UI, or ad hoc generated components.

## Give every element a visual role

Distinguish semantic/structural ownership from visual treatment. A DOM tree, React tree, widget tree, or accessibility tree may have many levels without drawing as many boxes.

| Role | What it communicates | Default appearance |
| --- | --- | --- |
| Layout | Grid, alignment, spacing, responsiveness, and ordering | Transparent, no border, no shadow |
| Region | Related meaning, heading, scope, or landmark | Usually grouped by proximity, alignment, or typography |
| Surface | A genuine plane, sheet, panel, material, or work area | Deliberate fill/edge/depth appropriate to its material |
| Control | Something actionable or editable | Discernible affordance and focus/disabled/pending states |
| Overlay | A temporary layer above an existing scene | Clear layer hierarchy, dismissal, focus/return behavior |
| Connector | Relationship across items (line, link, shared baseline, grouping) | As little visual chrome as expresses the relation |
| Ornament | Brand character or explanatory decoration | Cannot silently become an interactive or authority surface |

A generic `Box` or `Container` must not imply a painted card. In a design system that permits it, prefer transparent layout primitives by default and opt-in, explicitly named surface/material variants. Components may combine roles only when that combination is semantically intentional. Do not force every project to adopt these exact component names.

## Enclosure justification test

Before adding a frame, border, background, glow, shadow, glass blur, or inset around an existing group, answer:

1. What *new* distinction does this enclosure create (ownership, interaction, state, depth, physical separation, temporary focus)?
2. Could proximity, a heading, a column boundary, typography, a connector, or one shared parent surface convey the distinction more clearly?
3. Does the child compete with the parent by repeating its radius, border and fill without adding meaning?
4. Does padding compound across nested levels and steal usable space, especially on mobile?
5. Does the resulting composition still have a clear first read and a clear active action?

Do not impose a rigid maximum nesting count. A modal above a canvas and an inset field inside a physical control can legitimately need multiple planes. Instead, demand a distinct visual job for each visible boundary. If removing a child card's fill, border and shadow changes no task-relevant interpretation, remove that chrome while preserving the semantic grouping.

## Common failures and corrections

- **Stack of identical cards**: outer page card → section card → item card → button card. Keep one intentional work surface; use transparent layout, headings and rows inside it.
- **False hierarchy**: all panels share the same elevation. Give the active layer more signal; let passive groups remain quiet.
- **Card as a substitute for relationship**: related items in separate cards require repeated scanning. Try a common baseline, table, connected graph or shared field.
- **Material everywhere**: blurring every surface turns depth into noise and can cost readability/performance. Use distinctive material only when role demands it.
- **Flattening everything**: the opposite error. Separate destructive actions, editable wells, floating controls or transient overlays when their interaction needs a real boundary.

## Adaptive layout and agent-generated UI

When a layout is composed automatically, keep presentation metadata independent of execution authority. A component may request `layout`, `region`, `surface`, `control`, `overlay` or `connector` intent; an authorized renderer chooses the actual tokens and allowable nesting. An inferred background is not evidence of tool permission. Unknown visual roles should be rendered safely or refused, not interpreted as arbitrary code.

Make header actions, button placement, typography hierarchy, density and material choices configurable where the product permits. Avoid encoding one showcase header as the only shape of a reusable primitive. Preserve the project's accessibility semantics and adopted components.

## Practical visual check

Capture the full intended screen and a narrow viewport at the same content state. Mark *painted enclosures*, not DOM depth. For each, write its unique visual purpose. Compare a version with redundant interior chrome removed, keeping the same content and actions. Confirm focus, selection, hit targets, typography and grouping remain legible. If removing chrome harms comprehension, restore only the necessary distinction.

This reference extends the existing design rationale; it does not claim that a particular number of containers, surface types or layers has been empirically proved optimal.
