---
name: game-studio
description: Portable, mechanics-first game design and optional production. Use for game ideas, concept refinement, gameplay audits or rescue, and explicitly requested game specification, prototypes, implementation, playtests or QA. Concept-only requests never authorize code changes.
---

# Game Studio

Design something a person can **play**, not just admire. This is a standalone portable Agent Skill; no particular AI vendor, engine, web UI, OS, paid service, external critic, or companion skill is required. Load the relevant references when the current task demands them. Presentation tools are optional and never change the game-design contract.

## Authority first: select a mode without sneaking into production

| Intent | Mode | Default authority | Result |
| --- | --- | --- | --- |
| Open game ideas, unspecified count | **FRESH_THREE** | Read and reason; no project writes | Three equally developed **mechanically distinct** playable directions |
| One idea or an explicit count | **DEEP_SINGLE** (or requested count) | No writes | Complete chosen concept(s), not a default trio |
| “Continue/improve this idea” | **REFINE_EXISTING** | Preserve prior decisions, no writes | Improved same idea and change rationale |
| “Critique/compare my game” | **REVIEW** | Read only if authorized | Observed versus inferred weaknesses, actions to test |
| “This finished game is pretty but boring” | **RESCUE** | Read-only inspection when authorized | Root-cause choice audit + three substantive redesigns unless user requests otherwise |
| Approved design spec or GDD | **SPEC** | Write only if explicitly authorized | Traceable rules, acceptance cases, project-native spec |
| Prototype/build game | **PROTOTYPE**, **BUILD** | Explicit write authority and scoped workspace | Executable vertical interaction loop and observed tests |
| Player testing/repair/quality | **PLAYTEST**, **ITERATE**, **QA** | Instrument/change only as authorized | Evidence of inputs, behavior, fixes and regressions |
| Packaging/deployment/live operations | **PRODUCTION** | Explicit release/infra authorization | Verifiable build/release readiness, no unsolicited publication |

Do not force a questionnaire or GDD for ideation. “What do you think about games?” is ordinary discussion, not a mandatory three-concept artifact. A repository being checked out is **not** permission to mutate it. Before changing anything, identify repo instructions, current working tree, branch, authority and acceptance criteria. Never reset or discard uncommitted work. Significant scope pivots require owner approval; safe technical choices within the request do not.

## Creative core: a complete causal chain before a catchy description

Read the relevant curated [concept-core modules](./references/concept-core/) independently; start with [framing](./references/concept-core/framing.md), [mechanics](./references/concept-core/mechanism-synthesis.md) and [player interaction](./references/concept-core/player-interaction.md). The full canonical allowlist and 22-discipline coverage live in [coverage](./references/concept-core/coverage.json). Each module has operational procedures and explicit counterchecks, not just subject labels.

For **every** serious concept, solve these connections internally before writing:

```text
fantasy + camera + platform
  ↓ actual button / stick / touch / drag + target
observable change in game state + immediate feedback
  ↓ constrained decision / opposing consequences / risk
repeatable 20–90s loop → evolving 5-minute play
  ↓ changing option space, world and player capacity
long aim, setbacks, mastery, accessible entry
  ↓ cheapest experiment that could REFUTE the fun hypothesis
```

The one-line hook must promise **what the player does** and why it is compelling, with no unimplemented claims. A new entity, ability or upgrade must alter real decisions or systemic consequences, not exist only as lore/skins. No always-best button. Reconcile rules, resources, first-minute controls, feedback, progression and appeal together. If a desired feature does not affect the loop or a pillar, cut or justify it as an experiment.

### Concept acceptance contract: per direction

- **Pitch + player fantasy**: one truthful striking sentence; target platform, player view and desired experience.
- **Control diagram in words**: device, exact input (`tap`, `drag`, `WASD`, `Space`, controller, etc.), target, resulting state and screen/audio cue. Do not say “strategically manage” instead of telling the player what to press.
- **First 60 seconds**: scene at launch → first action → feedback → first real alternative with stakes → next action. The player could enact these steps without inventing missing UI.
- **Immediate loop**: what repeats in a short session, what is learned, what pressure changes, what can fail, and why the next cycle differs.
- **Constrained agency**: at least two plausible strategies with non-cosmetic costs, risks and conditions where either wins; how resources/world respond.
- **Growth**: an unlock changes player verbs, opportunities, constraints, opponent/world reactions or choices. Separate early, medium and long loops.
- **Reality check**: primary fun hypothesis; minimal playable experiment, observable failure signal, major feasibility dependency and uncertainty. Fun is not proven by coherent prose.

For **FRESH_THREE**, develop *three independently viable and comparably complete* concepts along this contract; match completeness, not exact word counts. Write a short differentiation check explaining how the actual verbs, pressures and decisions differ, not merely different themes. If two could exchange their backgrounds without changing decisions, rework at least one. Never nominate a favourite as empirically best without evidence. User-requested count/single-focus overrides the default.

For **REFINE_EXISTING**, change only the requested idea, preserve user constraints and rejected directions, and explain the actual impact on first-minute actions and loops. For **REVIEW**, inspect evidence and label code/documented aspiration/runtime behavior/user reports separately; don't claim testing you didn't run. For **RESCUE**, load [rescue](./references/concept-core/existing-game-rescue.md) and audit repeated decisions before inventing features; produce three mechanically different repairs plus reuse and falsifier. A description-only rescue must be labeled description-only.

### Research is adaptive, not an excuse to clone

Form an independent mechanic hypothesis before optional competitor research. For substantial concepts/reviews, investigate directly relevant mechanics and actual player/community experience *if current accessible research tools exist*. Cite factual external claims, separate mechanic overlap from art/theme resemblance and use comparisons to challenge an idea, not replace it with copies. For tiny requests or unavailable tools, answer creatively with explicit consequential uncertainty; no fabricated citations or pretend live searches. See [pitch / market](./references/concept-core/pitch-market-and-scope.md).

## Opt-in lifecycle (not automatic)

- **SPEC:** Follow the project's existing format/schema, including real OpenSpec if installed; express canonical state transitions, interfaces, accessible controls, failure cases and traceable tests. Don't create competing shadow specs. See [design bridge](./references/production/implementation-bridge.md).
- **PROTOTYPE / BUILD:** With explicit authorization, inspect runtime and preserve existing work. Implement the *smallest vertical playable decision loop* in an isolated safe branch/worktree if practical; prefer actual installed engine over rewriting it. Run and observe input, state changes and recovery. Consult [prototype](./references/production/game-prototyping.md).
- **PLAYTEST / ITERATE:** Separate human play, automated inputs, agent playthrough and developer prediction. Watch learning, variation and alternative choices. Revise against evidence; preserve best version and regression-test. See [testing](./references/production/testing-and-release.md).
- **QA / PRODUCTION:** Use an available portable `gauntlet-loop`0 only if it is installed and appropriate; otherwise apply equivalent actual code → check artifact → fix → check → polish → check, repeat. Check runtime, packaging, performance and release permissions separately. A passing script or attractive capture does not demonstrate fun or a functioning release. Never publish, deploy, buy, or ask for credentials implicitly.

Tool capability varies across coding agents. If no browser/engine/emulator is available, code review is not rendered/gameplay proof: record **NOT_EVALUATED** and a reproducible local follow-up, not PASS. No OS or paid APIs are architectural requirements.

## Evidence and scope of claims

For significant work record: task mode, reference/user constraints, checked repo revision and access, observed gameplay inputs/results, candidate version, defects, attempted repairs, validated tests, privacy and evidence provenance (SELF_REVIEW / actual human player / independent reviewer / NOT_RUN). If an evaluation fixture influenced development, classify it DEV, never untouched holdout. Prioritize meaningful game behavior over file volume or keyword compliance. This skill itself is *not* proof a design is fun or that a given agent has run a playable prototype.

**Boundaries:** user ideas, project details, code, screenshots and proprietary game IP remain private unless explicitly authorized. No changes to unrelated repositories or unapproved production assets. Public documentation and bundled references must stay generic and appropriately licensed. `game-studio` is self-contained even when a WebUI companion is unavailable.
