---
name: ui-design
description: "Design and critique product interfaces around user decisions, information hierarchy, comparison, filters, feedback, recovery, mobile composition and meaningful visual personality. Use for websites, apps, dashboards and interaction redesigns. Not a replacement for brand strategy, geometry tooling, implementation architecture or release QA."
compatibility: "Portable Agent Skills Markdown. No required tools, accounts, paid services or dependencies. Actual rendering and interaction checks require an available browser, device or renderer."
---

# UI Design

Design the decision, not just the screen. A useful interface lowers the effort of finding facts, comparing alternatives, remembering context, predicting an action and recovering when it fails. A short screen can create a long task. A dense screen can be easy to scan when its structure matches the task.

This is conditional design judgment, not a universal style, an automated score or proof of usability. The [decision cases](references/decision-cases.md) provide source examples, counterexamples and practical tests. [Source notes](references/sources.md) distinguish source teaching from application guidance and bound the evidence.

## Activate within the brief

Use for a new interface, a critique, a redesign, a difficult interaction or a visual quality pass. First identify whether the requested output is analysis, a concept, a prototype or an authorized implementation. Critique does not authorize editing. A prototype does not authorize deployment. Preserve accepted identity, reference-locked layouts and explicit creative ambition unless a change is requested.

A cinematic, animated 3D website is a valid brief. Do not replace it with generic minimal cards because utility interfaces often benefit from restraint. Conversely, a cinematic opening cannot excuse a broken form. Judge art direction and task reliability separately, then make them work together.

## Respect existing owners

Inspect the project's current design files, components, content, interaction patterns and applicable guidance before introducing another system.

- `geometric-design`, when present, owns geometric construction, declared proportional relationships and its responsive token tooling. Do not duplicate that engine or treat a ratio as proof of beauty.
- `architecture-guard`, when present, owns implementation reuse, semantic tokens, shared primitives and domain boundaries. Describe the needed behavior here; implement it through existing owners.
- `visual-output`, when present, shapes the presentation of a response, not the product interface.
- Colour and logo judgment skills, when available, own palette and identity decisions. Do not silently import an unmerged branch or replace an accepted mark.
- Existing QA workflows own build, regression and release gates. This skill supplies design questions and observation targets, not a second certification system.

These companions are optional. If absent, follow the project's established conventions rather than installing dependencies or manufacturing a new design system.

## 1. Frame the current decision

Write down the audience, situation, current question, next action and consequence. Separate searching from browsing, first use from repeat use, and comparing from committing. A vacation search starts with destination, dates and travelers; its listing surface has a different job from its booking confirmation.

For each screen or scroll scene, name:

1. What question it answers.
2. Which facts answer that question.
3. Which action follows, and what changes after it.
4. What must remain available if the action fails.

Use actual authorized content. Treat placeholders as a layout stress test, not evidence of customers, inventory, results or product capabilities. If a load-bearing fact is missing, keep the affected promise unresolved while continuing layout work that does not depend on it.

## 2. Structure information before styling it

Group by meaning and decision. Give related information a shared edge, proximity or enclosure. Choose a table for comparison across repeated attributes, a timeline for sequence, a chart for trend and an editorial composition for a narrative. A card is one grouping device, not the default answer.

Keep the content fixed when comparing layouts. A better photograph or stronger copy must not disguise a weaker structure. More visible information is justified when it prevents memory work, repeated page opening or uncertainty. Do not remove labels merely to make a screenshot cleaner.

Create a first read, second read and path to detail. Emphasis is relative: when the headline is already strong, reduce competing metadata, controls or decoration before increasing it again. Use size, weight, lightness, line height, position and space together. Check the entire composition at its intended viewing size, not only a zoomed component.

## 3. Give surfaces and personality a purpose

Use depth to explain relationships among background, content, controls and temporary overlays. Keep implied light direction coherent. When everything is raised, nothing has priority. Test selected and focus states without relying on a shadow, hue or bevel alone.

For an expressive website, choose a subject, visual language and motion behavior specific to the brief. Keep a clear reading zone. A recurring subject may transform across scenes to explain an idea; each transformation needs a reason beyond demonstrating an effect. Remove the decorative layer temporarily: the task should remain understandable. Restore it: it should contribute identity, explanation or emotion rather than interchangeable noise.

Spacing scales, limited accents and small type sets can reduce accidental variation. They are aids, not laws. Optical correction, script, content and accessibility can justify exceptions. Never derive theme accessibility from a simple lightness inversion.

## Integrated visual direction pass

Functional correctness is a floor, not the visual ambition. A readable screen can still be anonymous, flat, badly balanced or visually weak. Do not call a design strong because its controls work, its boxes align or it avoids overflow. Use colour, typography, tonal depth, layout, imagery and motion as one composition, not disconnected checkboxes.

Before adding detail, state a visual thesis: what should this specific product feel like, what recognizable subject or visual tension carries that feeling, and what must the viewer notice first? Translate vague words into visible decisions. For example, "precise and calm" might become a restrained palette, sharply aligned labels, deliberate open space and controlled motion; a playful editorial brief may need a very different rhythm. Those are proposed directions, not universal psychological effects. Reject a metaphor that could be swapped into unrelated brands without changing the message.

Work through one representative composition in this order, revisiting earlier choices when they conflict:

1. **Layout and reading rhythm.** Choose the major masses, focal position, negative space and path through the content. Decide where density helps comparison and where a pause helps the story. Establish a relationship between subject, headline, supporting copy and action. Equal cards and centered headings are options, not a default system. Check the silhouette of the whole page and the transitions between sections, not just component alignment.
2. **Typography as voice and structure.** Choose a type character that fits the audience and subject, then define a small set of distinct roles: display, heading, body, label and data where needed. Tune weight, size, line length, line height and optical spacing at actual viewing size. A type scale is not a substitute for a well-set headline. Long words, numerals and translated copy must survive. Do not reduce supporting text into unreadability to manufacture hierarchy.
3. **Palette roles in context.** Assign the field/background, surfaces, primary text, secondary text, identity colour, attention accent and functional states. Decide whether the brand should fit or contrast its visual category rather than importing a fashionable palette. A saturated scene can still have hierarchy; a neutral scene can still feel rich. Look at colour alongside the chosen type, imagery and material, not as isolated swatches. Use the colour-judgment owner when available for deeper palette reasoning.
4. **Tonal depth and material.** Build a deliberate light-to-dark relationship among planes, controls and overlays. Use edges, highlights, shadows, texture and translucency only where they clarify the material or hierarchy. A coloured shadow may belong in one scene and look dirty in another. A gradient must have a compositional job, not merely fill a blank background. Inspect both a quiet region and a high-contrast region so the result does not become uniformly flat or uniformly loud.
5. **Specific imagery and motion.** Choose framing, crop, scale, lighting and transitions that belong to the visual thesis. A 3D object is not a concept by itself. Explain why this subject, why this material, why this movement and why it changes at this point. The static composition must earn attention before motion decorates it; motion must then strengthen the story or interaction rather than hide a weak still.
6. **Coherence and challenge.** Review these choices together. Does the type belong with the palette? Does the lighting agree with the surfaces? Does the page rhythm support the message? Is the primary action identifiable without flattening the composition? Compare alternatives with identical content and intended viewport. If every choice is individually plausible but the whole feels generic, change the direction, not just the border radius.

Build and inspect a representative hero or key screen plus one deeper state before spreading the style everywhere. For a visual redesign, show actual composed alternatives when exploration is requested, not a list of adjectives. For a locked reference, preserve its identity instead of manufacturing variety. Do not substitute a three-option ceremony for a clear chosen direction.

Run two separate critiques: **task quality** (understanding, decisions, states, access) and **visual quality** (specificity, balance, type, palette, tonal richness, imagery and rhythm). Neither compensates for the other. State what still feels weak and revise it. If the result misses the brief's visual bar, do not present it as finished merely because the mechanical checks pass.

## 4. Design the whole state sequence

List the meaningful states before polishing the happy case: initial, loading, empty, partially available, success, pending, failure, retry, undo, exhausted allowance and return visit, where relevant. Distinguish a first-use empty list from a search with zero matches.

For each action, make the result legible near its cause, retain useful input and expose a real next step. A brief toast cannot be the only record of an important failed save. Across entry points, counts, dates, terminology and recovery behavior must agree.

Specificity requires truth. A real used/total allowance and refresh date can be more helpful than a generic limit notice. A fabricated date is worse. A progress indicator must correspond to actual activity. A reminder, cancellation promise or support route must exist operationally. An animation can reinforce accepted, pending or failed; it must not pretend that pending means complete.

## 5. Keep choices and their consequences together

Filters help people negotiate trade-offs. Preserve enough result context to explain how changing budget, quantity or requirements affects the choice. Use exact-versus-minimum semantics deliberately. A count, histogram or estimate is useful only when its data, units, scope and freshness are supported.

A sheet can preserve context; a full page can provide room for complex constraints. Neither is inherently superior. Include zero matches, delayed updates and a way back. A stale count must not describe a newer filter state.

At commitment, expose the consequential facts: actual total, duration, timing and applicable conditions. Never invent discounts, testimonials, scarcity, precise ETAs or reassuring promises to make a concept look credible. Report unverified source conversion claims as claims, not expected uplift.

## 6. Recompose for mobile and different input

Do not shrink the desktop composition. Choose reading order, reachable actions, navigation and the useful part of imagery or a 3D subject for the smaller viewport. Avoid nesting away the available width. Select scrolling behavior deliberately and preserve position when returning.

Test long text, large text, keyboard opening, safe areas and draft survival after closing a sheet. Hover, long press, gestures and motion need discoverable alternatives when they carry important behavior. A wheel may suit an approximate occasional choice; typing may better serve precise repeated values. Test the real task and units rather than choosing by fashion.

Provide reduced-motion behavior that preserves meaning. Judge actual transitions, including reversal and resize, when the brief depends on motion. A still cannot establish easing, focus return, frame rate or interaction continuity.

## 7. Verify the decision, not the checklist

Start with the highest-risk uncertainty. Observe actual pixels and interactions when available. If they are unavailable, continue source/design analysis and state which visual or behavioral checks remain unverified.

Useful probes:

- Find a needed fact without reconstructing an undifferentiated row.
- Compare identical content in two structures.
- Remove shadows and decorative motion; check grouping and state clarity.
- Substitute long translated text, zero, negative and very large values, missing images and unknown dates.
- Interrupt a save, retry, repeat a tap and revisit in a new session.
- Check keyboard, touch, focus return, zoom and reduced motion.
- Reverse a scroll scene, resize mid-transition and inspect the in-between composition.
- Trace each displayed promise to an actual capability or current evidence.

Record what was observed, on which revision and under which conditions. Separate a design rationale, a source example, a proposed test, an executed check and an actual user result. Passing a static checklist does not prove a memorable composition or a usable product. Use measured outcomes only when the measurement actually exists.

## Handoff

Return the design or critique appropriate to the request, with a short explanation of the decision it serves, the main trade-off, the actual before/after evidence and remaining gaps. For visual work show the rendered result, including a meaningful intermediate state if motion matters. Do not hand over only an art-direction essay when the request is to show a design.

Keep a compact decision record: intent; chosen structure; alternatives rejected and why; interaction states; responsive behavior; evidence checked; unresolved risks. Do not invent percentage scores or claim full accessibility, conversion uplift or production readiness from these heuristics.
