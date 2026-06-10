import { defineConfig } from "cypress";
import vitePreprocessor from "cypress-vite";
import codeCoverageTask from "@cypress/code-coverage/task";

export default defineConfig({
    projectId: "shyc93",
    defaultCommandTimeout: 8000,
    e2e: {
        // There is no instrumented backend serving /__coverage__, so tell
        // @cypress/code-coverage v4 not to request server-side coverage.
        expose: {
            codeCoverage: {
                expectFrontendCoverageOnly: true
            }
        },
        setupNodeEvents(on, config) {
            on("file:preprocessor", vitePreprocessor());
            codeCoverageTask(on, config);
            return config;
        }
    }
});
