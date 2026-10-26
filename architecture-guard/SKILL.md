---
name: architecture-guard
description: Enforce single-source-of-truth architecture, semantic design tokens, reusable UI primitives, composable feature boundaries and measurable change/performance quality while implementing or refactoring code. Use as a portable companion for substantive coding, UI work, design-system changes and architecture reviews. Not for trivial edits, documentation-only work or speculative universal abstractions.
compatibility: "Portable Agent Skills Markdown. No paid services or runtime dependencies; project-specific lint, tests and renderers are required for actual enforcement."
---

# Architecture Guard

**Make inconsistency difficult to introduce and straightforward to detect.** Optimize for coherent reuse, not the smallest line count or the greatest number of abstractions.

## Activation and authority

Use alongside a coding/implementation skill for nontrivial UI, application, library and refactor changes; also usable as a focused, read-only architecture audit. Do not activate for trivial text changes, non-code tasks or changes whose architecture impact is genuinely negligible. This companion adds guardrails; it does **not** replace the owning task workflow, OpenSpec, specifications, tests or the project's own conventions.

Load the relevant [enforcement framework](references/enforcement.md). For React/TypeScript, also load [the React recipe](references/react-typescript.md). Preserve reference-accurate visuals, native platform semantics, accessibility, existing public interfaces and accepted project behavior unless the owning task explicitly authorizes change.

A skill by itself cannot enforce anything: **only checks wired into a project's tools and CI can block violations**. Report those separately from skill guidance.

## Standing craftsmanship standard for EVERY software project

**Default and persistent:** For any new or existing software project, codebase architecture proposal, project scaffold, substantive implementation, refactor, or code review, apply this quality standard in addition to the repository's local conventions. Even a small code edit must not violate it. This is a standing cross-project requirement, not an optional preference the user has to repeat. Use normal judgment for casual discussion, single-line corrections and non-software artifacts: do not manufacture a complex architecture ceremony.

**The human-expert test:** An experienced, exacting human developer should be able to open the repository, understand its structure and intended usage, find the single owner of each important rule, trace a behavior end to end, and change it without a cleanup expedition. Optimize for long-term comprehension and maintainable correctness, not generated file count, cleverness, abstractions or artificial brevity.

### Repository organization and documentation

- Treat a clear root `README.md` as a real product/developer entry point: **what it is, prerequisites, install/setup, development, tests, build, usage, architecture map and links to detailed docs**. Document only commands that actually exist and distinguish planned from implemented. Keep every example executable or explicitly illustrative.
- Prefer `docs/` for substantive project Markdown: architecture, design decisions, developer instructions, APIs, workflows, performance notes, feature behavior and troubleshooting. Maintain one navigable `docs/README.md` or equivalent index when enough documents exist. Preserve conventional root files such as `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `LICENSE` and platform/tool-required Markdown; don't break tooling merely to move a file.
- Keep documentation colocated with the source of truth: high-level usage/explanation in `docs/`; useful API annotations/types and **why** comments in code; concrete usage examples beside the relevant module or in curated examples/tests. Do not scatter competing `PLAN-v2.md`, `SPEC-final.md`, outdated handoffs or redundant pseudo-documentation.
- Any user-visible behavior, public interface, CLI command, configuration or architectural boundary changed must receive a matching focused documentation/usage update in the same coherent change. Deleting or renaming functionality includes repairing affected docs and examples. Existing docs are not evidence unless checked against real code.
- Organize code by **domain/feature and responsibility**, with explicit public boundaries and discoverable naming. One canonical implementation per behavior; no `utils2`, `managers` dumping grounds, duplicate `ServiceNew`, unexplained index barrels, abandoned implementations or files scattered by convenience. Prefer a small modular monolith until independent builds/deployments are justified.
- Prefer typed, testable, cohesive modules and direct readable control flow. Reuse **meaning**, not superficial similarity. No needless mega-classes, broad flags, over-engineered generic frameworks, DI-container ceremony, circular dependencies or tiny files created solely to satisfy a line limit. Local helpers stay local.
- Prefer **direct, auditable, minimal** project commands and established tooling. Avoid chains of setup scripts that generate fix scripts that invoke other wrappers. Automation is warranted when it removes genuine repeated manual work and has clear ownership, errors, usage docs and tests.
- Keep README, architecture/docs index, real module APIs, examples, environment instructions and validation commands consistent. A repository with passing unit tests but misleading docs or orphaned modules does **not** pass the craftsmanship gate.

### Verification and review standard

- Before editing, locate the existing owner and actual usage. During editing, keep failures typed/explicit, invariants centralized, tests close to the risk and operational costs measured where relevant.
- For tests and CI speed, use [Test Velocity](../test-velocity/SKILL.md) when planning/optimizing suites: aim for sub-10-second **affected local feedback where practical** while maintaining a complete independent release/PR verification path. Never assert that a full browser/mobile/integration suite can universally finish within that budget.
- Review the completed change as an unfamiliar senior developer would: source and directory layout, naming, dependency direction, dead or duplicated code, stale docs, usage instructions, reproducible command results, security boundaries, actual rendering where applicable and avoidable runtime/build overhead.
- A green lint or generated documentation file is not proof of quality. Record which gates actually ran and whether they were real, partial, skipped or blocked.
- Honor existing mature conventions unless a demonstrated defect justifies a scoped migration. Do not reorganize a repository for cosmetics, generate documentation per trivial helper or expand unrelated scope.

## Operating invariants

1. **Canonical ownership.** Each shared design decision and domain invariant has an authoritative owner. Search existing design tokens, component registries, imports, utilities, hooks, services, state boundaries and prior conventions before introducing anything.
2. **Semantic design system.** UI uses named tokens for color, typography, spacing, radii, elevations, motion and responsive rules. Shared controls derive appearance, interaction states and accessibility from approved primitives. No silent custom button/input/card variants per screen.
3. **One implementation per shared concept.** Reuse or extract repeated *meaning and behavior*, not incidental textual similarity. Eliminate conflicting copies of business rules, validation, data fetching and presentation contracts.
4. **Right-sized composition.** Prefer cohesive small modules with explicit inputs/outputs; retain feature-local helpers where reuse would couple unrelated domains. Avoid flag-heavy mega-components, generic utility dumping grounds, leaky abstractions and premature design patterns.
5. **Performance with evidence.** Preserve algorithmic soundness, data boundaries, render costs and bundle weight. Measure before claiming a micro-optimization helps. Do not scatter caching or memoization without demonstrated benefit or clear cost model.
6. **Controlled exceptions.** Platform-native controls, exploratory spikes, migrations, third-party renderers, a11y edge cases and intentionally distinct variants can be legitimate. Exceptions must be narrow, documented, justified, owned and checked for expiry.
7. **Enforced outcomes.** Agent instructions are not a CI gate. Implement stack-appropriate static checks, token/component policies, automated regression tests, and visual/runtime checks when project scope permits. Never claim a gate exists until it actually runs.

## Loop: inspect → decide → implement → prove

**1. Locate the source of truth.** Inspect relevant source, shared UI library, styles/theme, design files, dependency graph, tests, lint/build setup and applicable AGENTS.md. Record existing canonical owners; check actual runtime output where relevant. A missing style guide is not permission to invent a new one if the app has visible established patterns.

**2. Classify proposed code.** For each new behavior/visual element, choose:

- **Reuse:** correct existing primitive/function/module matches semantics and contract.
- **Extend:** existing owner should expose a typed prop, variant, slot or extension point.
- **Extract:** repeated stable responsibility belongs in a new shared owner; update known call sites.
- **Keep local:** truly feature-specific behavior or merely coincidental similarity.
- **Exception:** explicitly documented deviation with scoped proof.

Only introduce a new component where the existing interface cannot express the requirement cleanly; record why. Do not make every function globally reusable.

**3. Implement within boundaries.** Integrate through sanctioned tokens, components and module APIs. Keep accessibility, focus, keyboard, disabled/loading/error and responsive states coherent. Prefer named semantic variants to per-call inline overrides. Add automated enforcement alongside the first architectural boundary it protects; never generate a whole new design system without authorization.

**4. Verify.** Run the project's typecheck, lint, tests and build; inspect affected UI at representative widths/states, keyboard/accessibility behavior and visual diffs. Add targeted regression checks and real CI steps when allowed. For performance-sensitive changes, compare meaningful before/after metrics under matched conditions. Differentiate checks performed from checks proposed.

**5. Stress-test future edits when warranted.** Change one shared token/control conceptually (or in an isolated disposable experiment) and identify exactly how many places need editing. Use an existing Futurequake skill for systematic disposable change experiments and a Gauntlet skill for real visual-output inspection, if available. Neither is a mandatory dependency.

## Acceptance gate

A change passes Architecture Guard only when evidence establishes:

- No unjustified second source of truth was introduced for a shared concept.
- Affected UI uses canonical tokens/primitives or justified, reviewed exceptions.
- Changed logic has correct module ownership and no harmful coupling introduced merely to dedupe.
- Relevant lint/typecheck/build/tests pass (or specific blockers are declared).
- README, docs/, module usage examples, configuration/CLI instructions and architecture index match observed behavior; changed paths have no orphaned or duplicate implementation.
- Affected rendered screens/states are verified when UI changes; visual equivalence is **not** inferred from lint alone.
- Actual enforcement/configuration and CI status are explicitly identified, not imagined.

For an audit, report findings and suggestions without editing. For authorized implementation, remediate in the requested scope. Do not use the skill as license for unrelated refactors, blanket replacements, unsafe migrations, unapproved merges or deployments.

## Output contract

Report briefly: canonical owners found; reuse/extract/local/exception decisions; touched files; enforcement added or still missing; exact checks run and results; remaining drift/risk. Prefer evidence over invented percentage scores. For large legacy codebases, gate touched surfaces first and propose phased adoption rather than claiming instant whole-repo purity.

**Examples and setup:** [Project architecture contract](examples/project-contract.md), [enforcement reference](references/enforcement.md), [React/TypeScript recipe](references/react-typescript.md).
