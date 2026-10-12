// Portable fragment for an EXISTING ESLint flat configuration.
// Import and spread architectureGuardReact() inside eslint.config.mjs.
// ESLint, JSX parser support and (for .tsx) a TypeScript-aware parser
// must already be configured by the consuming project.
//
// NOTE: This blocks native controls and inline style attributes outside the
// listed primitive/exception files. It does not detect token consistency,
// cross-screen visual drift or arbitrary CSS utility class overrides.
const nativeControls = ["button", "input", "select", "textarea"];

export function architectureGuardReact({
  files = ["src/**/*.{jsx,tsx}"],
  primitiveFiles = ["src/components/ui/**/*.{jsx,tsx}"],
  exceptionFiles = [],
  forbidInlineStyles = true,
} = {}) {
  const forbiddenSyntax = nativeControls.map((tag) => ({
    selector: 'JSXOpeningElement[name.name="' + tag + '"]',
    message: "Use the project's canonical UI primitive rather than a native <" + tag + "> outside primitive ownership.",
  }));

  if (forbidInlineStyles) {
    forbiddenSyntax.push({
      selector: 'JSXAttribute[name.name="style"]',
      message: "Inline styling is disallowed in consumers. Use semantic tokens and an approved variant, or document a scoped exception.",
    });
  }

  return [{
    name: "architecture-guard/react-consumers",
    files: [...files],
    ignores: [...primitiveFiles, ...exceptionFiles],
    rules: {
      "no-restricted-syntax": ["error", ...forbiddenSyntax],
    },
  }];
}
