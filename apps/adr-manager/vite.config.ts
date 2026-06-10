import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    // URL base for production (static sub-path deploy, e.g. GitHub Pages)
    base: "/adr-manager-apps/",
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
