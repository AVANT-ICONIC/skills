# AVANT-ICONIC Skills

A public collection of portable Agent Skills for coding agents.

The goal is not to publish another pile of prompts. Each skill should introduce a useful operating primitive, define when it should and should not run, produce inspectable evidence, and remain portable across agent runtimes that support the open `SKILL.md` format.

## Skills

### `futurequake`

**Executable modifiability testing for real codebases.**

Futurequake does not estimate whether an architecture will tolerate future change. It generates realistic future change scenarios, implements them in disposable isolated worktrees, measures the resistance encountered, discards every experimental implementation, and reports the recurring architectural fault lines.

It can also run the exact same quake set against two refs to answer a sharper question:

> Did this refactor or pull request make future changes easier or harder?

See [`futurequake/SKILL.md`](./futurequake/SKILL.md).

## Repository layout

```text
skills/
├── README.md
└── futurequake/
    ├── SKILL.md
    ├── examples/
    ├── references/
    └── scripts/
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
Claude Code   .claude/skills/futurequake/
Codex         .agents/skills/futurequake/
OpenCode      .opencode/skills/futurequake/
```

OpenCode also discovers the portable `.agents/skills/` location. If your runtime provides a UI for importing skills, import the `futurequake` folder or its `SKILL.md` according to that runtime's instructions.

## Example prompts

```text
Run Futurequake on this repository before we commit to the architecture.
```

```text
Futurequake this refactor with five plausible future changes.
```

```text
Compare main against this PR with Futurequake. Use the same quake set on both refs.
```

```text
The provider layer keeps hurting us. Run a targeted Futurequake around provider evolution.
```

## Design principles

- **Evidence over aesthetics.** Architecture is tested through attempted change, not judged from diagrams alone.
- **Disposable experiments.** Quake implementations are measurements, not product work. They are removed after evidence is captured.
- **No magic score.** Report the change fingerprint and recurring resistance instead of hiding judgment inside one horoscope number.
- **Same experiment for comparisons.** Compare refs only with the same scenarios, constraints, and verification expectations.
- **Do not reward agent failure as architecture failure.** Environment problems, misunderstanding, and model mistakes are separated from structural resistance.
- **No automatic production refactor.** Futurequake diagnoses. Any real architecture change belongs in the project's normal planning and development workflow.

## Intellectual lineage

Futurequake is not claiming that change-scenario architecture analysis is new. It builds on decades of work around scenario-based architecture analysis, modifiability analysis, evolutionary architecture, and stressor-based architecture thinking.

Its specific move is to make change scenarios **executable** in the agent era: coding agents can cheaply attempt several bounded future changes against a real repository, allowing modifiability to be observed instead of merely estimated.

See [`futurequake/references/foundations.md`](./futurequake/references/foundations.md).

## Standard

The repository follows the open Agent Skills convention: each skill is a folder with a required `SKILL.md`, plus optional scripts and references loaded only when useful.

- Agent Skills: https://agentskills.io/
- Anthropic skill examples: https://github.com/anthropics/skills

## Status

`futurequake` is the first skill in this collection.

## Development

Run the bundled helper tests with:

```bash
python -m unittest discover -s futurequake/scripts -p 'test_*.py' -v
```

The metrics helper intentionally uses only the Python standard library and git.
