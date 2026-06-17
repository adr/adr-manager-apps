import { defineConfig } from "cypress";
import vitePreprocessor from "cypress-vite";

export default defineConfig({
    projectId: "shyc93",
    defaultCommandTimeout: 8000,
    allowCypressEnv: false,
    e2e: {
        setupNodeEvents(on, config) {
            on("file:preprocessor", vitePreprocessor());
            return config;
        }
    }
});
