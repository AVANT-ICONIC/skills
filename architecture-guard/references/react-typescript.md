# React / TypeScript: enforce one UI system

This is a **project adoption recipe**, not a claim that merely installing this skill changes a React app. Inspect the app's existing ESLint flat config, TS parser, UI library, CSS/theme tooling and PR workflow first. Preserve existing owner names and public component APIs.

## 1. Canonical contract

Pick one documented owner for each reusable primitive, for example:

~~~text
src/
  components/ui/
    Button.tsx
    TextField.tsx
    Dialog.tsx
    Card.tsx
    index.ts
  styles/tokens.css
  features/
    billing/
    settings/
~~~

Import consumer components through the public UI entrypoint, such as:

~~~tsx
import { Button, TextField } from "@/components/ui";

<Button variant="primary" size="md">Save</Button>
<TextField label="Email" error={error} />
~~~

Shared primitives own default states and semantic variants. Consumer pages should assemble them rather than inventing bespoke controls. Exceptions for canvases, third-party widgets, a11y-specific controls or platform-specific renderers must be deliberate.

## 2. Drop-in JSX control gate

Copy [eslint-react.mjs](../examples/eslint-react.mjs) into the target repository or import it from a vendored skill folder. Merge this fragment into an **existing** ESLint flat config, after enabling the project's JSX/TSX parser:

~~~js
import { architectureGuardReact } from "./tools/architecture-guard/eslint-react.mjs";

export default [
  // Existing parser and project rules...
  ...architectureGuardReact({
    files: ["src/**/*.{jsx,tsx}"],
    primitiveFiles: ["src/components/ui/**/*.{jsx,tsx}"],
    exceptionFiles: [
      // Reviewed, narrow, documented exceptions only.
    ],
    forbidInlineStyles: true,
  }),
];
~~~

Do not replace the application's real ESLint config with the above partial illustration. It is a fragment.

Expected protected consumer result:

~~~tsx
// FAIL: direct control bypasses canonical ownership
<button className="bg-blue-500">Save</button>

// PASS: approved primitive
<Button variant="primary">Save</Button>
~~~

The bundled fragment enforces only the explicitly configured syntax policy. It intentionally does **not** ban arbitrary className usages, guarantee consistent appearances, analyze imported component internals or prove that all controls have correct semantics. Those require additional project-specific checks and rendered verification.

## 3. Enforce design tokens too

Suggested theme shape:

~~~css
:root {
  --color-action: #2d6cdf;
  --color-surface: #111318;
  --space-control: 0.75rem;
  --radius-control: 0.5rem;
}

.button {
  background: var(--color-action);
  border-radius: var(--radius-control);
  padding-inline: var(--space-control);
}
~~~

The literal colors above live in the **canonical token owner**, not copied into screens. Integrate the project's existing token tooling and a CSS/SCSS-aware linter (e.g. Stylelint). A project might use Stylelint's color-no-hex in consumer style files, with explicit token-owner overrides. Numeric spacing and utility CSS often need project-specific AST or CSS tooling; do not pretend a regex enforces semantics.

For Tailwind projects, use the established theme/tokens source and a class/variant composition API (such as cva if already installed). Avoid opportunistic dependencies or parallel token systems.

## 4. Prevent cross-feature knowledge leaks

Use public module entrypoints, package export maps and/or import-boundary lint rules appropriate to the repository. The exception is an explicitly allowed shared module, not random feature-to-feature internal imports.

Treat duplicate business rules differently from duplicate JSX: move stable shared behavior into the domain owner and test the invariant. Keep local code local where its reasons for change are genuinely distinct.

## 5. States and visible regression

At minimum, render/check the approved primitive in normal, hover, focus-visible, active, disabled, loading, validation/error and responsive states as applicable. Test keyboard and accessible name/role/focus semantics. Capture representative consumer screens at actual viewports, compare against the approved baseline and investigate visual diffs.

Lint can flag direct native controls while completely missing a newly introduced CSS rule that makes one screen ugly. The actual visual Gauntlet is complementary, not optional when the task changes the UI.

## 6. Wire the gates

From the consuming app, with its *existing pinned tooling*:

~~~bash
npm run lint
npm run typecheck
npm test
npm run build
~~~

Use the package manager actually declared by the repository; do not invent npm scripts that do not exist. Wire relevant commands into current CI and prove the protected source paths are covered. New failing UI-regression tests must represent a real agreed visual contract.

## 7. Sanity checks

- A direct <button> in protected TSX fails lint.
- The same element inside an authorized primitive owner does not fail this rule.
- A canonical <Button> in protected TSX passes this rule.
- An inline style prop in protected TSX fails if enabled.
- A narrowly excepted path is still covered by unrelated type/build/behavior tests.
- A wrong color applied via regular CSS is caught only if token/style lint and/or screenshot gates actually cover it.

**Do not claim these outcomes without running a configured ESLint instance on representative fixtures.**
