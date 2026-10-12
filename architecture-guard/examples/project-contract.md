# Example project architecture contract

This template is a **starting point for adapting an existing application**, not a command to rename all of its folders. Keep the actual contract in the application's own repository and amend it with the owning team.

## Canonical ownership

| Concern | Owner | Consumer rule |
| --- | --- | --- |
| Semantic colors, spacing, typography, radii, elevations, motion | src/styles/tokens.css | Use named tokens; no screen-specific copies of brand literals |
| Buttons and links | src/components/ui/Button.tsx + index.ts | Import canonical Button; use semantic variants |
| Form fields and validation states | src/components/ui/TextField.tsx + index.ts | Import canonical TextField; don't style HTML input ad hoc |
| Dialogs, overlays, keyboard/focus behavior | src/components/ui/Dialog.tsx | Reuse or extend Dialog |
| Account permissions/roles | src/domain/auth/permissions.ts | Import owner; no copied conditional authorization logic |
| HTTP client + API schema | src/lib/api/client.ts | Don't build one-off fetch wrappers per screen |
| Screen-specific state | src/features/<feature> | Keep private until true stable cross-feature reuse exists |

## Example API

~~~tsx
type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

// Public usage
<Button variant="primary" loading={saving} onClick={save}>Save</Button>
<Button variant="destructive" onClick={deleteItem}>Delete</Button>
~~~

A button may intentionally look different when a variant has different meaning; it must still belong to one canonical family. Native <button> is expected **inside** the Button primitive implementation.

## Exceptions register

| Path | Rule | Reason | Owner | Exit condition |
| --- | --- | --- | --- | --- |
| src/features/map/NativeMapControls.tsx | native control | Third-party map control keyboard contract | Maps | Re-evaluate when wrapper exists |

Do not add wildcard exceptions, or exceptions without an owner and removal condition.

## Automated gates (example, not implied)

- ESLint AST rules ban native controls/inline style in protected JSX/TSX consumers.
- TS typecheck requires valid variants.
- Style lint checks direct non-token colors in protected CSS consumers.
- Browser tests capture canonical components at all interactive states.
- Screenshot regression checks cover key screens at phone/tablet/desktop widths.
- Unit/contract tests verify central policy owners.
- All configured checks run on actual PRs; evidence includes commands, exit codes and CI links.

## Agent change receipt (example)

~~~text
Change: add Settings save CTA
Canonical primitive: src/components/ui/Button.tsx
Decision: reuse existing primary Button, no new component
Tokens: reused; no literal colors
Tests: typecheck PASS, lint PASS, build PASS
Browser: 390px + 1440px screenshots observed, matching approved states
Exceptions: none
Missing gates: none for touched surface
~~~

Do not write PASS when a command was not executed. If a screen is new, it requires a legitimate initial baseline rather than a fake snapshot comparison.

## Legacy rollout

If hundreds of native controls already exist, start with changed/new modules and a tracked migration ledger. Enforce no newly introduced violations immediately; make remaining debt explicit and shrink the allowlist with each migration. Applying an uncompromising rule to an old codebase and disabling all lint when it fails is not progress.
