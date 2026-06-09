import { defineConfig } from "cypress";
import vitePreprocessor from "cypress-vite";
import codeCoverageTask from "@cypress/code-coverage/task";

export default defineConfig({
    projectId: "shyc93",
    defaultCommandTimeout: 8000,
    e2e: {
        setupNodeEvents(on, config) {
            on("file:preprocessor", vitePreprocessor());
            // Folded in from the (now removed) deprecated cypress/plugins/index.js.
            codeCoverageTask(on, config);
            return config;
        }
    }
});
