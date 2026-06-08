import { mergeConfig, defineConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: "jsdom",
            globals: true,
            include: ["tests/**/*.{test,spec}.ts"],
            // Vuetify SFCs must be inlined to transform under jsdom.
            server: { deps: { inline: ["vuetify"] } },
            coverage: {
                provider: "v8",
                reporter: ["text", "json", "lcov"],
                exclude: ["src/plugins/parser/**", "tests/**", "**/*.d.ts"]
            }
        }
    })
);
