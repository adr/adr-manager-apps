// Bundles the extension host (src/extension.ts) with esbuild.
// Usage: node scripts/build-host.mjs [--watch] [--production]
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

// Emits errors in a format the tasks.json problem matcher parses, plus
// begin/end markers so the background watch task can signal readiness.
const problemMatcherPlugin = {
  name: "esbuild-problem-matcher",
  setup(build) {
    build.onStart(() => console.log("[watch] build started"));
    build.onEnd((result) => {
      for (const { text, location } of result.errors) {
        console.error(`✘ [ERROR] ${text}`);
        if (location) console.error(`    ${location.file}:${location.line}:${location.column}:`);
      }
      console.log("[watch] build finished");
    });
  }
};

const ctx = await esbuild.context({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  // The vscode module is provided by the VS Code runtime and must not be bundled.
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  // engines.vscode ^1.67.0 -> Electron with Node 16.
  target: "node16",
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  logLevel: "silent",
  plugins: [problemMatcherPlugin]
});

if (watch) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
