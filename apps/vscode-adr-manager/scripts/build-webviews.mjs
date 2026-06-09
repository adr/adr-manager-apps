// Compiles each file in the "web/pages" directory to a self-contained IIFE bundle
// (plus an extracted .css) that the extension loads into its webviews (see WebPanel.ts),
// using Vite's lib mode once per page. Output goes to "dist/web".
// Usage: node scripts/build-webviews.mjs [--watch] [--production]
import { cpSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { build } from "vite";

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

const root = fileURLToPath(new URL("..", import.meta.url));
const pages = readdirSync(fileURLToPath(new URL("../web/pages", import.meta.url))).map((file) =>
  file.split(".")[0].toLowerCase()
);

// Five sequential builds share dist/web (emptyOutDir: false), so clean it once up front.
rmSync(fileURLToPath(new URL("../dist/web", import.meta.url)), { recursive: true, force: true });

// The codicon font is loaded by the webview HTML at runtime (see WebPanel.ts) and has to
// live under dist/ because the packaged VSIX contains no node_modules. Resolve the package
// through Node because pnpm's hoisted linker installs it in the workspace root.
const require = createRequire(import.meta.url);
const codiconsDist = dirname(require.resolve("@vscode/codicons/dist/codicon.css"));
for (const file of ["codicon.css", "codicon.ttf"]) {
  cpSync(`${codiconsDist}/${file}`, fileURLToPath(new URL(`../dist/web/codicons/${file}`, import.meta.url)));
}

const config = (page) => ({
  configFile: false,
  root,
  mode: production ? "production" : "development",
  plugins: [vue()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("../web", import.meta.url)) },
    dedupe: ["vue"]
  },
  // Lib mode deliberately preserves process.env.NODE_ENV for library consumers, but these
  // bundles run directly in a webview where `process` does not exist: replace it explicitly.
  define: {
    "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development")
  },
  build: {
    outDir: "dist/web",
    emptyOutDir: false,
    minify: production ? "esbuild" : false,
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    lib: {
      entry: `web/pages/${page}.ts`,
      // Vite requires a global name for IIFE output; nothing reads it at runtime.
      formats: ["iife"],
      name: "app",
      fileName: () => `${page}.js`,
      cssFileName: page
    },
    watch: watch ? {} : null
  },
  logLevel: watch ? "warn" : "info"
});

if (!watch) {
  for (const page of pages) {
    await build(config(page));
  }
} else {
  console.log("[watch] webviews build started");
  // Gate the first "finished" marker until all pages completed their initial build,
  // so the tasks.json background matcher only reports ready when everything is built.
  let initialPending = pages.length;
  for (const page of pages) {
    const watcher = await build(config(page));
    watcher.on("event", (event) => {
      if (event.code === "BUNDLE_START") console.log(`[watch] webviews build started (${page})`);
      if (event.code === "ERROR") console.error(`✘ [ERROR] ${event.error.message}`);
      if (event.code === "BUNDLE_END") {
        if (initialPending > 0 && --initialPending > 0) return;
        console.log(`[watch] webviews build finished (${page})`);
      }
    });
  }
}
