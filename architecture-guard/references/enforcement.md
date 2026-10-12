# Enforcing architecture contracts

An agent prompt is advisory. An architecture **gate** is a deterministic check that can fail the change. Adopt the strongest available project-native gates, rather than adding fragile custom scanners merely to boast about strictness.

## Declare a project-local contract

Put a short, versioned contract in the target repository, usually near AGENTS.md or in its architectural docs. The [example](../examples/project-contract.md) is a starting point, not a required new schema. Discover and preserve existing conventions first.

Record:

- Canonical token source and semantic naming scheme.
- Component library and allowed public import paths for buttons, text fields, dialogs, cards, typography, navigation, layout, etc.
- Feature boundaries and owners for validation, state, API clients, domain rules, shared hooks/utilities.
- Approved variants, a11y requirements, and explicit exceptional native elements.
- Scope of enforcement, existing legacy debt and migration ownership.
- Exact commands that block a PR; affected-screen screenshot and interaction baselines.

## Progressive gates

| Level | Gate | Verifies | Does not prove |
| --- | --- | --- | --- |
| 0 | Manual architecture inventory | Ownership and known duplication | That code is consistent |
| 1 | AST lint / import boundaries | Forbidden raw controls, banned direct imports, unsafe overrides | Rendered appearance |
| 2 | Token/style lint + tests | Hardcoded color/style policy, component contracts | All screens share one appearance |
| 3 | Rendered visual regression + a11y | Captured states, representative viewports, keyboard behavior | Architectural modularity |
| 4 | Runtime measurements + changeability exercises | Real regressions, perf costs, modification friction | Universal optimality |

Do not block unrelated maintenance just because an entire legacy repository is imperfect. When a legacy baseline is too noisy, prohibit *new* violations on changed paths, record the existing debt, and shrink the exceptions over time. Fail closed for genuinely new protected surfaces.

## Hard-gate rules for UI

- Only shared primitive owners may define the project's canonical base visuals for common controls. Prefer public component API + semantic variants, not arbitrary className or inline style overrides.
- Disallow raw JSX interactive controls at consumer boundaries when a corresponding primitive is defined. Native controls are allowed inside primitives; use documented exceptions for special platform or a11y requirements.
- Style token ownership should live in a documented theme source. Raw brand color literals belong in token definitions, not scattered across screens. Built-in CSS keywords, transparent/none/inherit and contextual exceptions may be legitimate.
- Protect import boundaries: feature code should consume public module entry points rather than reaching into other features' internals.
- Include focus, hover, pressed, disabled, loading, error, dark/light where applicable, responsive breakpoints and reduced-motion expectations in shared components' contract.
- Do not enforce one *visual appearance* for intentionally different semantic variants. Enforce one **component family and variant policy** instead.

## Logic reuse rules

Classify before deduplicating:

**Same underlying invariant:** centralize validation, parsing, permissions, calculations, domain policy and API data shape; cover with unit/contract tests.

**Same UI interaction contract:** centralize components/hooks with stable variants and semantics.

**Similar text, different reason to change:** keep separate. Accidental coupling can be worse than a dozen lines of duplicated code.

**One-off local logic:** keep local, hide unnecessary exports, minimize conceptual footprint.

Avoid arbitrary DRY percentages, force-fitting shared generics, global dependency containers, mandatory wrappers around native one-liners and premature memoization.

## Integration checks

A typical existing project can wire:

1. ESLint or analogous parser-aware linter: restricted syntax/imports and boundaries.
2. Stylelint or analogous token/style checker: prevent unauthorized literal colors and one-off styling.
3. TypeScript/compiler strictness and public component prop types: valid variants and APIs.
4. Unit/contract tests: ensure the same authoritative rule is invoked, not reimplemented elsewhere.
5. Storybook or equivalent test fixture: canonical component states and a11y tests, if already installed or justified.
6. Screenshot/image diff runner on real browsers: screen-level consistency across viewports and states.
7. Build and bundle metrics only where the project supports meaningful baselines.

All rules need a **verified** execution command and CI job or equivalent enforcement entry point. Do not claim pass when tools are missing, screenshots are mocked, tests are skipped, or checks apply only locally.

## Exceptions and escape hatches

Record exceptions with path, exact violated rule, reason, owner, date and removal condition. Ban unlimited ignore lists, sweeping directory ignores, silent "temporary" overrides and blanket lint disable comments. A bypass must not spread.

## Failure response

When a gate reports a violation, check if it is a true-positive or an inaccurate rule. Repair the implementation first when it really violates the contract. If the policy is wrong, update the contract and tests with a clear reason; do **not** suppress errors globally to get green CI.

## Review receipt

Use this short evidence matrix:

| Concern | Canonical owner | Change classification | Verified by | Status |
| --- | --- | --- | --- | --- |
| Primary CTA | components/ui/Button | Reuse | AST lint + rendered state | pass/fail/not-run |
| Colors | theme/tokens | Reuse | Style lint + screens | pass/fail/not-run |
| Validation | domain/validation | Extract | unit tests | pass/fail/not-run |
| Rendering | affected screens | Verify | browser screenshots | pass/fail/not-run |

Keep "reviewed source", "executed check" and "observed screenshot" distinct.
