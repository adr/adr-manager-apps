import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * Shared base flat config: ESLint + typescript-eslint recommended rules, plus the
 * lint conventions carried over from the extension's original .eslintrc.json.
 *
 * Formatting is owned by Prettier, so the `vue` and `node` variants append
 * eslint-config-prettier last to switch off any conflicting stylistic rules.
 */
export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/dist-web/**", "**/out/**", "**/coverage/**", "**/plugins/parser/**", "**/*.d.ts"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // TypeScript resolves identifiers itself, so no-undef is redundant here and would
      // otherwise flag browser/node globals in .vue and config files.
      "no-undef": "off",
      // tsconfig's noUnusedLocals/noUnusedParameters are the source of truth; keep ESLint advisory.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
      ],
      // Off: too noisy against external (snake_case) API DTO shapes, and not a correctness rule.
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      curly: "warn",
      eqeqeq: "warn",
      "no-throw-literal": "warn"
    }
  }
);
