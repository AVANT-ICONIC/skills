import test from "node:test";
import assert from "node:assert/strict";
import { architectureGuardReact } from "../examples/eslint-react.mjs";

test("protects TSX/JSX consumers with syntax-level controls", () => {
  const [config] = architectureGuardReact();
  assert.equal(config.name, "architecture-guard/react-consumers");
  assert.deepEqual(config.files, ["src/**/*.{jsx,tsx}"]);
  assert.deepEqual(config.ignores, ["src/components/ui/**/*.{jsx,tsx}"]);
  const [severity, ...restrictions] = config.rules["no-restricted-syntax"];
  assert.equal(severity, "error");
  for (const control of ["button", "input", "select", "textarea"]) {
    assert.ok(restrictions.some((r) => r.selector === 'JSXOpeningElement[name.name="' + control + '"]'));
  }
  assert.ok(restrictions.some((r) => r.selector === 'JSXAttribute[name.name="style"]'));
});

test("explicit exceptions and source globs remain scoped", () => {
  const [config] = architectureGuardReact({
    files: ["app/**/*.{jsx,tsx}"],
    primitiveFiles: ["app/ui/primitives/**/*.tsx"],
    exceptionFiles: ["app/integrations/hosted-widget.tsx"],
    forbidInlineStyles: false,
  });
  assert.deepEqual(config.files, ["app/**/*.{jsx,tsx}"]);
  assert.deepEqual(config.ignores, [
    "app/ui/primitives/**/*.tsx",
    "app/integrations/hosted-widget.tsx",
  ]);
  const restrictions = config.rules["no-restricted-syntax"].slice(1);
  assert.equal(restrictions.length, 4);
  assert.ok(!restrictions.some((r) => r.selector.includes("style")));
});

test("independent calls cannot mutate each other's rules", () => {
  const [a] = architectureGuardReact();
  a.rules["no-restricted-syntax"].pop();
  a.files.push("changed");
  const [b] = architectureGuardReact();
  assert.equal(b.rules["no-restricted-syntax"].length, 6);
  assert.deepEqual(b.files, ["src/**/*.{jsx,tsx}"]);
});
