import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    // Production URL base (GitHub Pages sub-path by default). VITE_BASE_PATH overrides it for self-hosted deployments.
    base: process.env["VITE_BASE_PATH"] ?? "/adr-manager-apps/",
    server: {
        host: "localhost",
        port: 8000
    },
    plugins: [vue()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        }
    }
});
