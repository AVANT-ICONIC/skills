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

### `seo-aiseo`

**Evidence-led SEO and AI-search optimization for real websites.**

SEO + AI SEO audits technical eligibility, search intent, content quality, information gain, entity clarity, local relevance, structured data, AI retrieval/citation visibility, conversion readiness, and measurement. It separates first-party platform guidance from observational research and experiments, and treats AI discovery as an extension of search rather than a separate collection of hacks.

See [`seo-aiseo/SKILL.md`](./seo-aiseo/SKILL.md).

## Repository layout

```text
skills/
├── README.md
├── futurequake/
│   ├── SKILL.md
│   ├── examples/
│   ├── references/
│   └── scripts/
└── seo-aiseo/
    ├── SKILL.md
    └── references/
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

### Futurequake

```text
Run Futurequake on this repository before we commit to the architecture.
```

```text
Compare main against this PR with Futurequake. Use the same quake set on both refs.
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

## Design principles

- **Evidence over assertion.** Skills should produce inspectable evidence and distinguish facts from inference.
- **Scoped activation.** Each skill must say when it applies, when it does not, and what it is allowed to change.
- **Portable by default.** Avoid runtime-specific behavior unless the skill explicitly requires it.
- **Progressive disclosure.** Keep the core operating law in `SKILL.md`; load detailed references, examples, or scripts only when needed.
- **No magic scores.** Prefer observable measurements and explicit tradeoffs over opaque composite ratings.
- **No hidden side effects.** Diagnostic skills should not silently mutate production work or external systems.
- **Current sources for changing domains.** When a skill depends on live platform behavior, it should re-check primary documentation instead of freezing folklore into the skill.

## Standard

The repository follows the open Agent Skills convention: each skill is a folder with a required `SKILL.md`, plus optional scripts and references loaded only when useful.

- Agent Skills: https://agentskills.io/
- Anthropic skill examples: https://github.com/anthropics/skills

## Status

The collection currently includes `futurequake` and `seo-aiseo`.

## Development

Futurequake includes a bundled metrics helper. Run its tests with:

```bash
python -m unittest discover -s futurequake/scripts -p 'test_*.py' -v
```

The metrics helper intentionally uses only the Python standard library and git.
