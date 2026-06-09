import node from "@adr-manager/eslint-config/node";
import vue from "@adr-manager/eslint-config/vue";

// Extension host code (src/) is Node; web views (web/) are Vue SFCs.
export default [
  ...node,
  ...vue,
  {
    // Legacy extension code: keep these correctness/style rules advisory (warnings)
    // while the extension is modernized gradually, so they don't block the lint gate.
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "no-useless-escape": "warn",
      "no-useless-assignment": "warn",
      "no-control-regex": "warn",
      "vue/require-valid-default-prop": "warn",
      "vue/require-v-for-key": "warn",
      "vue/no-use-v-if-with-v-for": "warn",
      "vue/no-side-effects-in-computed-properties": "warn"
    }
  }
];
