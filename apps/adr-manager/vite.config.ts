import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
    // URL base for production (static sub-path deploy, e.g. GitHub Pages)
    base: "/adr-manager-apps/",
    server: {
        host: "localhost",
        port: 8000
    },
    plugins: [
        vue(),
        // autoImport replaces the old unplugin-vue-components + VuetifyResolver setup
        // and injects per-component Vuetify styles.
        vuetify({ autoImport: true })
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        }
    }
});
