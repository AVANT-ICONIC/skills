# UI decision cases

These are original summaries of the public sources listed below, not transcripts. Source examples are teaching examples; proposed tests and cautions are application guidance. No reported business result is independently verified here. Read a case when its decision matches the task, not as a mandatory style checklist.

## 1. Emotional feedback, not engagement at any cost

Source: Tim Gabe, The Secret Behind Weirdly Addictive Apps.
https://youtu.be/Du2lkZ_cux8

The source compares Duolingo's expressive character reactions, Phantom's approachable wallet onboarding and Revolut's tactile cards and charts. The transferable idea is to make an action produce a legible response with an appropriate emotional tone. Confirmation can feel reassuring; progress can feel cumulative; a difficult process can feel less intimidating.

Use a small vocabulary tied to real states: accepted, pending, corrected, completed. A mascot expression or restrained motion can reinforce those states. A chart responding to a finger can strengthen the relationship between gesture and data, provided the value remains readable.

Do not turn this into "add a mascot" or "make people addicted." Repeated rewards can distract or pressure people. A playful financial interface must not make a risky transaction look harmless. The video's growth figures and claims about design causing growth are not causal evidence for a new product.

Practical test: after a save, ask whether the user can tell if the data is stored, still pending or failed. Remove the decorative motion and check that the answer remains available. Then evaluate whether the emotional layer helps rather than delays that answer.

## 2. Premium is the connective tissue between states

Source: Tim Gabe, The Psychology of Premium Apps.
https://youtu.be/8EAYZe6y3I8

The strongest example is a session limit that says what was used and when it refreshes: "2 out of 2," the billing period, and an exact refresh date. A generic limit message on two different screens makes the person reconstruct the rules. Another example is a microphone test that ends with "too short" and no useful next step. A visually polished happy path cannot compensate for that dead end.

Design the flow across time, not as separate screenshots. A return visit, exhausted allowance, failed payment, interrupted connection and retry need compatible language and state ownership. A successful retry should not create a duplicate charge or lose the user's original work.

Do not infer a payment failure's cause from appearance alone. "Check your balance" is only appropriate when the actual failure supports it. Do not turn the service-recovery discussion into a reason to tolerate avoidable failures. The studies and growth figures mentioned in the source remain presenter claims here.

Practical test: interrupt the main flow, reload, return through a different entry point and retry. Record what persisted, what changed, whether the user knows what happened, and whether the next action is safe.

## 3. Fundamentals are a language, not fixed numbers

Source: Kole Jain, Every UI/UX Concept Explained in Under 10 Minutes.
https://youtu.be/EcbgbKtOELY

Containers, selected states, muted controls and hover feedback communicate what an interface affords. Hierarchy uses relative size, position and color. A primary value and a secondary timestamp should not compete merely because both came from the same data object. Repeated structures benefit from stable alignment and responsive grids.

The source explicitly says that a 12-column grid and exact 8-pixel gaps are guidelines rather than laws. Four-point spacing can simplify a system because values divide cleanly, but the meaning of the grouping is more important than obedience to the number. Dense dashboards and expressive landing pages need different type ranges.

Treat numerical recipes for tracking, line height, icon size or padding as starting points. A claim that dark mode has no shadows is too broad; shadows can exist, though tonal layers may carry more of the separation. Semantic color must have a non-color cue, and color associations are not universal.

Practical test: list every button and input state, including keyboard focus, loading, error and disabled behavior. Check grouping without borders, and test actual content at the smallest supported viewport.

## 4. Alignment is a scanning system

Source: Kole Jain, The secret behind weirdly perfect UI designs.
https://youtu.be/neE6wOuBIP8

The receipt example uses left-aligned descriptions and right-aligned prices to create two stable scanning edges. The checklist example then shows why alignment alone is insufficient: a full-width wall of similarly presented content remains hard to use. Grouping by due date and using recognizable people references adds differentiation.

A card is one way to provide edges, not a requirement for every group. A column boundary and repeated row positions can do the same work without nested rounded containers. Emphasis is relative to neighbors. If every default chip is bright, a changed value has no visual signal left to use.

Do not hide useful actions solely to make a card look tidy. Avatars help only when people recognize them; unfamiliar people still need names. Icons and diagrams replace text only when their meaning is clear. Unfamiliar destructive actions still need labels or accessible explanation.

Practical test: ask someone to find an overdue task, a specific person's task and a changed setting. Compare the same content before and after grouping. Do not claim faster scanning until it has actually been observed.

## 5. Depth should explain the stack

Source: Sajid, The Easy Way to Fix Boring UIs.
https://youtu.be/wcZ6jSlZqDc

The video builds separation through related tonal layers, an upper highlight and lower shadow. In the examples, the selected radio option, dropdowns and billing controls become easier to distinguish from their surfaces. The light-theme dashboard example also shows that raising every section creates competition, so some regions are deliberately lowered again.

Use depth as a coherent relationship: background, content surface, interactive control and temporary overlay. A selected control can be raised, while an input well or progress track can be inset. The implied light direction should agree across highlights, shadows and gradients.

This does not justify adding four cards around every control. The same nested layers can consume mobile width or weaken contrast. Equal HSL increments are not equal perceptual distances, and simply inverting lightness does not guarantee an accessible light theme. The source's "normal/high/ultra" performance comparison is an analogy, not a measured browser benchmark.

Practical test: check selected state with shadows disabled, then in both themes. Verify text contrast, focus and pressed state independently. If the function becomes ambiguous without a bevel, the bevel is carrying too much meaning.

## 6. Less interface is not always less work

Source: Sajid, The Biggest Lie in UI Design.
https://youtu.be/OCgt_ESKHk4

The invoice example distinguishes the amount, customer and due date rather than presenting equal-weight text. The flight-card sequence groups airline/passenger identity, route, seat/reference and boarding/status into different information pockets. The amount of underlying information need not fall for the card to become easier to read.

Search snippets and breadcrumbs can prevent repeated page opening. An empty invoice list needs a useful starting action. A bank sync needs honest activity context rather than a silent wait. These additions make the decision easier even though the screen contains more.

Keep unfamiliar labels when removing them would create ambiguity. Airport codes are not equally recognizable to all travelers. Progress must come from actual activity; do not fabricate a transaction count or completion percentage. Decorative gradients are optional and do not establish comprehension.

Practical test: compare whether someone can identify the route, boarding time and seat without reconstructing a row of labels. Then test unfamiliar locations and screen-reader names. Add information only when it answers a real question.

## 7. Personality needs composition and context

Source: Kole Jain, 4 UI Design Hacks to KILL boring designs.
https://youtu.be/SfX43uIubj4

The source distinguishes surrounding context from clutter. Invoicing imagery, coins or purposeful illustrations can help explain what a page is about before the text is read. They work when the main message retains a clear reading zone. Motion can reflect the subject: a balloon flies, a small star rotates, and a progress-related word becomes a progress graphic.

The general lesson is to give the interface a deliberate visual and verbal personality. Natural language and well-made secondary moments can matter as much as the opening. That includes an error page with a clear route back, not a blank apology.

Do not turn this into a recipe for floating doodles, parallax or a wordmark reveal. A different subject needs a different composition. Essential copy should remain available with reduced motion, and animation must not move the target while someone tries to act. An error game must not trap the user or conceal recovery.

Practical test: remove motion and check that the content still explains the product. Then ask whether the authored imagery says anything specific about this product rather than merely looking fashionable.

## 8. Begin with intent, then choose the form

Source: Kole Jain, How to think like a GENIUS UI/UX designer.
https://youtu.be/HE4rLEQpiXY

The vacation-rental example starts with destination, traveler count and dates because the immediate intent is to search. Browsing is a separate intent that calls for listings and filters. Content selection follows that task: price, location and rating may matter more on the scanning surface than a full description.

Test real content before assuming the layout works. Long destinations, bright listing photographs and image-backed save controls expose problems hidden by ideal placeholders. Progressive disclosure can preserve room without sending a person away from the task.

The source's caution about unnecessary 3D is not a universal ban on expressive websites. If the brief explicitly calls for an authored 3D story, that is part of the task. Likewise, "load more" versus infinite scroll depends on browsing goals, footer access, position restoration and accessibility. Truncation must not erase facts needed to choose.

Practical test: write the user's current question above each section. If no content or action in the section helps answer it, justify its role. Test search-first and browse-first journeys separately.

## 9. Typography is relational

Source: Sajid, The 80% of UI Design - Typography.
https://youtu.be/9-oefwZ6Z74

Removing type styles from a familiar interface destroys selected-state cues and the relationship between title, thumbnail and metadata. The useful lesson is that hierarchy comes from relationships among weight, lightness, line height, position and proximity, not a large number of font sizes.

When the important text is already at high contrast, lower surrounding emphasis rather than endlessly increasing size. Use semantic document structure while allowing different visual treatments for different contexts. Test dynamic numbers and the whole screen, not a zoomed-in component alone.

The video's 14/16-pixel starting point, HSL lightness recipes and "100 minus lightness" theme conversion are not universal accessibility rules. HSL lightness is not contrast. A line box is not a reliable substitute for all layout spacing across fonts and scripts. Tight tracking can damage readability in another language or typeface.

Practical test: inspect the full screen with long translated text, large dynamic values, browser zoom and user font scaling. Verify hierarchy and contrast after theme changes, not only token arithmetic.

## 10. Conversion advice must stay truthful

Source: uxpeak, Top 3 UX/UI Redesigns That Make You Design Like a Pro.
https://youtu.be/zr37ibqXl1U

The useful patterns are concrete: explain a trial with its actual billing timeline; compare ride options on a consistent surface; show the booking total, trip length and applicable cancellation terms. These can reduce uncertainty that a generic CTA leaves unresolved. Showing actual product contents can answer "what am I getting?" better than unrelated decoration.

Do not import the video's claimed A/B winners as established experiment results. No sample size, assignment method or underlying result dataset was verified here. A promise to remind before charging must exist operationally. A fixed fare is appropriate only if the fare is actually fixed. A crossed-out reference price, "cheaper" badge, host award or cancellation promise needs current evidence.

Precise false information is worse than an honest range. A mortgage or travel price must retain fees, conditions and assumptions. Better conversion is not permission to obscure the obligation behind a "start" button.

Practical test: trace every reassuring claim to product behavior or a current source. Ask a user what they will pay, when and how they can cancel before the final commitment. Treat a wrong answer as a design failure.

## 11. Filters help people negotiate trade-offs

Source: uxpeak, The INSANE Gap Between Average and World-Class UI/UX Design.
https://youtu.be/U7jTCgIWS4w

The food-list example separates browsing appetite from fast comparison. A large photo can help one task, while a compact list helps another. Important filters should not disappear simply to fit more results above the fold. Text outside a photo survives unpredictable uploads better than text whose readability depends on every image.

The property-filter example is stronger than a general "use sheets" rule. Bedrooms, bathrooms and budget affect each other. A single comparison surface, exact "3+" semantics, real result counts, optional exact values and a market histogram can reveal those relationships. A budget calculator can translate monthly comfort and deposit into an estimated shopping range, but only with visible assumptions.

Do not fabricate counts, personalized "best match" labels, inventory distributions or affordability. Estimated finance outputs are not guarantees and need relevant costs and assumptions. More information can itself become noise. The source's junior-to-staff labels describe its examples, not a validated professional ranking.

Practical test: change budget and minimum bedrooms while preserving the result context. Include zero matches, delayed counts, stale inventory and an exact-versus-minimum setting. Check that all displayed numbers describe the same current filter state.

## 12. Adapt to use, without becoming unpredictable

Source: uxpeak, Top 5 Advanced UX/UI Design Tips and Tricks - Part 3.
https://youtu.be/Xzh8xjimmp8

New, returning and experienced fitness users need different help. A useful progression replaces repeated onboarding with today's task and later with relevant history, not simply more widgets. Search can offer recent queries and useful suggestions without blocking direct typing. Post-purchase screens should prioritize current stage, destination, expected timing and a real help route.

The category example warns against unrelated stock photos and unreadable overlays. A consistent visual language can make alternatives easier to scan. Numeric entry also depends on precision and frequency: typing may beat a wheel for repeatedly entering a specific food weight.

Do not infer health expertise from engagement or silently remove essential navigation. Search history and personal recommendations need suitable privacy controls. An "on the way" status or courier contact must be real and current. One-time height or weight entry can still require precise accessible input; frequency alone does not decide the component.

Practical test: compare first use, return after a month and frequent use. Make the same core task findable in all three. Test input with a precise outlier, different units and keyboard access.

## 13. Mobile requires recomposition

Source: Kole Jain, Everything you need to know about Mobile App UI's in 8 minutes.
https://youtu.be/Gfsd8NNuD9g

A desktop sidebar and multi-column dashboard cannot simply shrink. Mobile needs a chosen task, readable type, reachable controls and a navigation model that fits its content. A section normally chooses a clear scrolling direction. Avoid nested containers that consume the width before the content starts.

A contextual bottom sheet can select a template without discarding the note being edited. Editing can replace global navigation with local actions. First-use emptiness differs from zero search results: the first needs a starting action, while the second needs query context, useful alternatives and a way out.

The video's target-size and font-size numbers are recommendations, not independently checked standards here. Gestures and long press need discoverable alternatives. "One screen, one thing" is a useful pressure toward focus, not a ban on a necessary comparison. A sheet that covers its trigger or traps focus can be worse than a full page.

Practical test: exercise the keyboard, back navigation, safe areas, long labels and large text. Close a sheet without losing the draft or scroll position. Verify the primary action remains reachable when the keyboard is open.

## 14. Polish should reveal the product

Source: uxpeak, Top 5 UX/UI Design Tips and Tricks - Part 1.
https://youtu.be/8pMUkEbAM7g

The metric-card sequence makes values more prominent than labels. The shadow comparisons soften harsh edges and relate the shadow to a colored environment. The book-preview sequence later shows actual interior pages rather than only a cover.

The transferable pattern is to rank information before styling it, then use consistent visual treatment to expose that rank. Product imagery is strongest when it helps someone understand what they will receive. A real interior, workflow or output can provide evidence that a polished mockup cannot.

Do not adopt the source's reported 22% and 48% conversions as a promise. The experiment design and dataset are not verified. Tinted shadows are optional, and visual harmony must not replace contrast or state clarity. A product preview must represent actual available contents, not a fabricated benefit.

Practical test: show the component without labels and ask what stands out first, then restore labels and check meaning. Compare a factual product preview with a decorative cover on comprehension, not only preference.

## 15. A seven-part visual audit

Source: Griffin Wooldridge, How to Make AI-Generated UI Look Expensive (7 Fixes).
https://youtu.be/eQ74n4huAcA

The seven audit questions concern focal point, spacing, type hierarchy, restrained color, real content, consistent small details and action-related motion. This is a useful ordered cleanup pass. It prevents a common failure where badges, statistics, feature cards and equal CTAs all compete with the page's real purpose.

Motion has a source and destination: a menu emerges from its trigger; a sheet follows the gesture; notifications retain a coherent stack. Real names and product-specific features can improve credibility, but only if the content is actually authorized and true.

This video's strict 8-pixel scale and limited-accent framing conflict with the fundamentals source's warning that grids are guidelines. Keep consistency, not a rigid universal number. An expressive editorial page may need a different hierarchy. Do not use "real customer quote" as permission to invent one or to disclose private customer data. Numerical alignment must not erase optical or script-specific adjustments.

Practical test: change one audit dimension at a time while preserving the task and content. Recheck the result at full size; do not assume seven checked boxes guarantee a good composition.

## 16. Orchestrate the invisible interface

Source: Kole Jain, The 3 dashboard UI flaws that give away you've NEVER built one.
https://youtu.be/Ksx9C2-3yMo

The three ideas are that data should drive form, secondary actions need deliberate disclosure, and hidden states are a substantial part of the product. Numeric columns can align by place value. Time-based activity may be easier to read as a timeline than a table. A share popover, copy confirmation, tooltip or comment marker is part of the design even when absent from the opening screenshot.

Choose a table for comparison across shared attributes, a timeline for sequence, or a chart for a trend. Use color to communicate a meaningful state rather than sprinkling it over every category. Sequence onboarding around actual actions instead of dumping an entire manual into the first modal.

Hover-only removal and tooltips do not work for every input method. Destructive or critical actions may need to stay explicit. Truncating text to improve table density must preserve access to the full value. Charts still need units, time range and uncertainty. Role-based visibility must not become security by visual hiding.

Practical test: enumerate every hidden menu and state, then exercise keyboard, touch, escape, focus return, confirmation and failure. A complete screenshot is not a complete dashboard.
