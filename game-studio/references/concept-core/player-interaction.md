# Player verb compiler: input, camera, feedback and first minute

The common failure is a visually striking idea whose player does nothing identifiable. Compile every described action into a device-specific input and visible reaction. Never make three concepts share generic “tap to collect, buy upgrades” behavior if the promised fantasies differ.

## D18: UI/UX systems designer

For mobile specify screen orientation, tap/long-press/swipe/drag/gesture targets, reachability and one-hand constraints if relevant. For keyboard specify keys (WASD/arrows/Space/E), mouse click/drag targets and focus states; for controller specify sticks/buttons/triggers. Choose camera (top-down, side view, first person, fixed isometric) to make hidden information and control precision credible. Show camera location and the object directly underneath the user's first input.

Document the response feedback: position, color/animation/audio, resource and rule change, invalid-action explanation and the next meaningful option. Provide a keyboard/touch/controller alternative only where feasible; label accessibility accommodations as planned rather than implemented. Anticipate small viewports, color-only indicators, focus order, readability, pointer size and motion reduction when relevant.

**Countercheck:** “Tap the world to evolve it” is invalid until the target selection, choice menu or immediate world state change is specified. If five taps open lore but do not affect risk, strategy or resources, interaction does not equal agency.

## D04: Player experience modeler (moment-level)

For each control segment identify expected emotion and its observable cause: curiosity from hidden route reveal, tension from two routes closing, satisfaction from successfully reading a pattern. Tie mastery to a discoverable rule and changing player behavior. Distinguish idle waiting (no choice) from deliberately charged anticipation (a decision is committed and its effect is approaching). When feedback obscures causality or a wrong action seems arbitrary, the intended emotion will not materialize.

**Countercheck:** A huge particle explosion following a meaningless tap does not prove excitement; measure whether the player anticipates, varies or explains a consequential choice.

## First-minute input trace

Give an enactable example, not a trailer script:

1. **00–05 seconds:** spawn view, player avatar/tool, obvious reachable control and short objective; identify camera and physical device.
2. **05–15:** player presses a specific button/taps a specific target; describe immediate motion, state counter and feedback.
3. **15–30:** present two viable alternatives with different costs/risks; explicitly say what happens for A and B. Do not preselect for the player.
4. **30–45:** show visible downstream change and why the first action changed the next state.
5. **45–60:** player commits again based on new information; reveal small success, setback or learning and a clear next short goal.

Repeat for each default concept. A reader should be able to answer: “Which finger/key, on what, why now, what changes, what do I do next?” If not, the concept is incomplete. A first-minute trace must flow into an actual 5-minute repeat loop, not end at an opening cutscene.

## Accessibility and onboarding falsifier

Test a fresh reader with only the first frame and mapped controls; have them predict a legal first input and next action. If confusion appears, first distinguish poor affordance/tutorial from missing incentive or shallow choice. A player who understands buttons but repeats the same always-best one suggests a mechanical problem, not merely interface polish.
