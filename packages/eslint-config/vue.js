import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";
import base from "./base.js";

/**
 * Base config + Vue 3 SFC support. `<script lang="ts">` blocks are parsed with the
 * TypeScript parser via vue-eslint-parser. Prettier disables conflicting formatting
 * rules (incl. eslint-plugin-vue's) and must stay last.
 */
export default [
  ...base,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    rules: {
      "vue/multi-word-component-names": "off",
      // Deliberate patterns in these apps; keep advisory rather than blocking the lint gate.
      "vue/no-mutating-props": "warn",
      "vue/no-v-text-v-html-on-component": "warn"
    }
  },
  prettier
];
