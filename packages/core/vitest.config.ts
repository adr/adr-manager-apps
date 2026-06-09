import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure string/parser logic, no DOM: the default node environment suffices.
    include: ["tests/**/*.test.ts"]
  }
});
