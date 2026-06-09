import globals from "globals";
import prettier from "eslint-config-prettier/flat";
import base from "./base.js";

/** Base config + Node globals, for extension-host / tooling code. Prettier stays last. */
export default [
  ...base,
  {
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  prettier
];
