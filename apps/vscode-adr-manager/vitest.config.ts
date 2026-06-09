import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure string utilities, no DOM and no VS Code API: the default node environment suffices.
    include: ["src/test/**/*.test.ts"]
  }
});
