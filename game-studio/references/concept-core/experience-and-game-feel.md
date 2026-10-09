# Game feel, aesthetic direction, motivation and narrative feedback

Presentation is the sensory evidence of mechanics, not a replacement for them. Design feedback so that a person can perceive *why a decision mattered* and feel motivated to change their next one.

## D03: Aesthetic direction framework

Choose a restrained palette, contrast, material response, sound motifs, camera movement and animation timing appropriate to key player verbs. Tie each sensory cue to a rule or state transition: resistance when dragging a heavy object, spectral highlights on an unsafe route, a distinctive low-frequency cue for depleted reserves. Do not promise photoreal visuals, cinematic cameras or licensed music without budget/authorization. A style reference is a constraint to verify visually when rendering is requested, not permission to clone another creator's art.

**Acceptance probe:** Describe what the player sees/hears when a risky choice succeeds, fails, or is invalid. If the cues are identical, the game lacks readable mechanical feedback despite attractive art.

## D04: Player experience modeler

Trace intended emotion to actual choices: suspense from irreversible commitment; delight from surprising but learnable interactions; mastery from recognizing a hidden rule and using a new strategy; relief from recovering a costly mistake. Map onboarding and mid-session rhythm to curiosity, certainty, pressure and recovery. Do not claim that producing a moodboard induces those feelings in real players.

**Falsifier:** A tester watches the effect but cannot explain what action caused it or why next action differs. The intended experience requires clearer feedback, rules or alternative outcomes, not a louder animation.

## D12: Narrative systems designer

Story may be authored, procedural, emergent or absent. Where relevant connect narrative beats to player-caused state: a district trusts the player after a costly rescue; a branching choice changes access to equipment; local memorials persist where repairs failed. Keep promises plausible: branching fiction with zero mechanical or emotional consequence is not a meaningful “choice.” Abstract puzzle games need not have characters or lore.

**Narrative agency test:** Take away story text and ask whether choices and their consequences remain understandable. Reintroduce only narrative content that enriches causal significance, reveals stakes or transforms future actions. Avoid cutscenes that hide the entire mechanic behind passive spectacle.

## D18: UI/UX and accessibility as game feel

Use consistent icon and interaction grammar, readable depth/color indicators and precise feedback for input errors. Include focus and alternative controls when platform-relevant, with explicit labeling of *planned* rather than *implemented* support. A successful control must produce legible changed state even with animation reduced and without relying on sound or color alone.

**Feedback matrix:** Action accepted → animate affected object + state counter + brief causal reason. Action illegal → unchanged world + visible unavailable cost + an accessible next alternative. Action high-risk → show stakes before commitment, not only after penalty. Test sensory timing at real frame rates when implemented; source CSS alone is insufficient proof.
