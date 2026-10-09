# AVANT-ICONIC Skills

A public collection of portable Agent Skills for coding agents.

The goal is not to publish another pile of prompts. Each skill should introduce a useful operating primitive, define when it should and should not run, produce inspectable evidence, and remain portable across agent runtimes that support the open `SKILL.md` format.

## Skills

### `intent-mode`

**Intent reconstruction before planning, specification, or implementation.**

Intent Mode turns brain dumps, ambiguous goals, hidden constraints, contradictions, and premature solution choices into an inspectable Intent Brief with observable success criteria. It asks only questions that can materially change the result.

See [`intent-mode/SKILL.md`](./intent-mode/SKILL.md).

### `gauntlet-loop`

**Evidence-driven QA for real artifacts, not just nice-looking source files.**

Gauntlet Loop captures the actual quality bar, probes available tools, inspects rendered/running output, challenges defects (with independent critics when genuinely available), revises, checks regressions and reports honest PASS or an actionable unfinished verdict. It applies artifact-specific verification to UIs, animation, games, code, data, research and documents, including browser/profile troubleshooting before declaring an environment blocked.

The skill installs independently and needs no paid accounts. Optional Python 3 evidence validation checks internal consistency of recorded PASS claims; the validator itself **cannot prove evidence is genuine**.

See [`gauntlet-loop/SKILL.md`](./gauntlet-loop/SKILL.md).

### `futurequake`

**Executable modifiability testing for real codebases.**

Futurequake does not estimate whether an architecture will tolerate future change. It generates realistic future change scenarios, implements them in disposable isolated worktrees, measures the resistance encountered, discards every experimental implementation, and reports the recurring architectural fault lines.

It can also run the exact same quake set against two refs to answer a sharper question:

> Did this refactor or pull request make future changes easier or harder?

See [`futurequake/SKILL.md`](./futurequake/SKILL.md).

### `game-studio`

**Portable game design, concept rescue, and explicitly requested production.**

Game Studio converts a playable fantasy into actual inputs, meaningful tradeoffs, systemic progression and falsifiable playtest hypotheses. Open-ended ideas get **three comparably complete, mechanically distinct concepts**; refining one idea doesn't restart a trio. Review and rescue are read-only by default; prototypes, builds and production require explicit write authority. Nine canonical concept-core references cover 22 mapped disciplines without forcing 22 separate questionnaires. An optional stdlib package tool produces a deterministic allowlisted SHA-256 snapshot for future adapters.

See [`game-studio/SKILL.md`](./game-studio/SKILL.md).

### `geometric-design`

**Source-backed geometry and visual QA (experimental alpha).**

Geometric Design covers monochrome symbol construction, nested layout regions, standalone geometry auditing, responsive UI tokens and design grammar. It ships a self-contained offline Node 22+ engine; a browser or renderer is optional and no paid service or API key is needed. Limits: a bounded SVG subset (no general curved Booleans or alpha-transparent counters) and no accessibility certification.

See [`geometric-design/SKILL.md`](./geometric-design/SKILL.md).

### `openspec-workflow`

**Native OpenSpec change routing from intent to verified implementation.**

OpenSpec Workflow uses a project's installed commands and schemas, explores uncertain changes, proposes clear changes, keeps implementation aligned with the current change, and verifies before archiving. It does not silently initialize OpenSpec or create competing shadow specifications.

See [`openspec-workflow/SKILL.md`](./openspec-workflow/SKILL.md).

### `seo-aiseo`

**Evidence-led SEO and AI-search optimization for real websites.**

SEO + AI SEO audits technical eligibility, search intent, content quality, information gain, entity clarity, local relevance, structured data, AI retrieval/citation visibility, conversion readiness, and measurement. It separates first-party platform guidance from observational research and experiments, and treats AI discovery as an extension of search rather than a separate collection of hacks.

See [`seo-aiseo/SKILL.md`](./seo-aiseo/SKILL.md).

### `visual-output`

**Portable visual presentation companion for agent responses.**

Visual Output makes substantial agent responses easier to scan using semantic status markers, progress bars, ASCII/Unicode structure, compact operator panels, diagrams, tables, and explicit ownership/evidence separation. It changes presentation only and never alters exact code, commands, specs, data, or other copy-paste artifacts.

Use it alongside another skill when richer presentation is useful:

```text
task skill       = what to do
visual-output    = how to present it
```

See [`visual-output/SKILL.md`](./visual-output/SKILL.md).

### `video-watch`

**Frame-aware video inspection with timestamped evidence.**

Video Watch combines actual visual frames, available captions and focused detail checks without depending on a particular agent UI. An optional local Python helper extracts hybrid frame samples and contact sheets with ffmpeg; native tools work too. Sampling limits and missing evidence remain explicit.

See [`video-watch/SKILL.md`](./video-watch/SKILL.md).

## Skill composition

Skills remain self-contained. Some skills can also act as optional **companions** that add cross-cutting behavior without changing another skill's domain rules.

```text
intent-mode  ─┐
futurequake  ─┼─ optional companion → visual-output
seo-aiseo    ─┘
```

Do not make task skills depend on a companion being installed. If a runtime supports loading multiple skills, explicitly load both. If it does not, the task skill must still work correctly on its own.

Shared cross-cutting behavior belongs in one companion skill rather than being copied into every task skill.

## Repository layout

```text
skills/
├── README.md
├── futurequake/        # Modifiability experiments; references, examples, metrics helper
├── game-studio/        # Game design; concept-core references and packaging helper
├── gauntlet-loop/      # Artifact QA; references and optional executable checks
├── geometric-design/   # Geometry audits and tokens; offline Node tools
├── intent-mode/        # Intent reconstruction
├── openspec-workflow/  # Native OpenSpec lifecycle routing
├── seo-aiseo/          # Search audits; references
├── video-watch/        # Video evidence; optional extraction helper and tests
└── visual-output/      # Presentation companion
```

Each skill is self-contained. The root stays deliberately small as the collection grows.

## Install

Agent Skills use a directory containing a `SKILL.md` file with YAML frontmatter. The format is portable by design.

### Clone the collection

```bash
git clone https://github.com/AVANT-ICONIC/skills.git
```

Then copy or symlink the skill folder into the skills directory used by your agent.

Common project-local locations include:

```text
Claude Code   .claude/skills/<skill-name>/
Codex         .agents/skills/<skill-name>/
OpenCode      .opencode/skills/<skill-name>/
```

OpenCode also discovers the portable `.agents/skills/` location. If your runtime provides a UI for importing skills, import the desired skill folder or its `SKILL.md` according to that runtime's instructions.

## Example prompts

### Intent Mode

```text
Reconstruct my intent from this brain dump before we plan anything.
```

```text
Run Intent Mode on this feature request. Separate the real outcome from my proposed implementation.
```

### Futurequake

```text
Run Futurequake on this repository before we commit to the architecture.
```

```text
Compare main against this PR with Futurequake. Use the same quake set on both refs.
```

### Game Studio

```text
Design three mechanically distinct nonviolent game concepts for a one-button handheld.
```

```text
Audit the player choices in this existing game without changing source, then propose three distinct rescue loops.
```

### OpenSpec Workflow

```text
Use the existing OpenSpec change for this feature; verify the implementation before archiving it.
```

### SEO + AI SEO

```text
Run a full SEO + AI SEO audit on this site and produce a prioritized implementation plan.
```

```text
Audit why competitors are being cited by AI search and this site is not.
```

```text
Optimize this service page for classic search, answer engines, and conversion without inventing claims.
```

### Visual Output

```text
Use visual-output alongside Futurequake and make the final report highly scannable.
```

```text
Run SEO + AI SEO with visual-output so blockers, evidence, and priorities are visually obvious.
```

## Design principles

- **Evidence over assertion.** Skills should produce inspectable evidence and distinguish facts from inference.
- **Scoped activation.** Each skill must say when it applies, when it does not, and what it is allowed to change.
- **Portable by default.** Avoid runtime-specific behavior unless the skill explicitly requires it.
- **Composable cross-cutting behavior.** Put shared presentation or workflow behavior in optional companion skills instead of duplicating it across task skills.
- **Progressive disclosure.** Keep the core operating law in `SKILL.md`; load detailed references, examples, or scripts only when needed.
- **No magic scores.** Prefer observable measurements and explicit tradeoffs over opaque composite ratings.
- **No hidden side effects.** Diagnostic skills should not silently mutate production work or external systems.
- **Current sources for changing domains.** When a skill depends on live platform behavior, it should re-check primary documentation instead of freezing folklore into the skill.

## Standard

The repository follows the open Agent Skills convention: each skill is a folder with a required `SKILL.md`, plus optional scripts and references loaded only when useful.

- Agent Skills: https://agentskills.io/
- Anthropic skill examples: https://github.com/anthropics/skills

## Status

The collection currently includes nine skills: `futurequake`, `game-studio`, `gauntlet-loop`, `geometric-design`, `intent-mode`, `openspec-workflow`, `seo-aiseo`, `video-watch`, and `visual-output`.

## Development

Futurequake includes a bundled metrics helper. Run its tests with:

```bash
python -m unittest discover -s futurequake/scripts -p 'test_*.py' -v
```

The metrics helper intentionally uses only the Python standard library and git.

## Contributing

Contributions are welcome when they remain portable, inspectable, and small. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT. See [LICENSE](./LICENSE).
