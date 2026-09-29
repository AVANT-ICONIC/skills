# Contributing

Thanks for improving AVANT-ICONIC Skills.

The repository is deliberately small and portable. A skill should add a useful operating primitive, not another decorative prompt.

## Rules

- Put each skill in its own top-level folder with a required `SKILL.md`.
- The frontmatter `name` must match the folder name.
- Keep the core operating law in `SKILL.md`.
- Use `references/`, `examples/`, or `scripts/` only when progressive disclosure is useful.
- Keep skills runtime-neutral unless runtime-specific behavior is the explicit subject of the skill.
- Do not copy ChatGPT WebUI-specific checkpoint or connector behavior into this repository.
- Prefer inspectable evidence over opaque scores or unsupported claims.
- Re-check primary sources when a skill depends on changing platform behavior.
- Add tests for bundled executable helpers when practical.
- Do not commit generated output, temporary files, or local environment artifacts.

## Pull requests

A contribution should explain:

1. the operating primitive it introduces;
2. when it should and should not activate;
3. what evidence or artifact it produces;
4. any external assumptions or dependencies;
5. how the change was verified.

Run the repository validation workflow before merging.

WebUI-specific variants belong in [AVANT-ICONIC/gpt-webui-skills](https://github.com/AVANT-ICONIC/gpt-webui-skills).
