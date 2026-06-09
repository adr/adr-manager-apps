import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";
import filesize from "rollup-plugin-filesize";
import image from "@rollup/plugin-image";
import json from "@rollup/plugin-json";
import postcss from "rollup-plugin-postcss";
import postcssImport from "postcss-import";
import replace from "@rollup/plugin-replace";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import vue from "unplugin-vue/rollup";
import nodePolyFills from "rollup-plugin-polyfill-node";
import copy from "rollup-plugin-copy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const production = !process.env.ROLLUP_WATCH;

const postCssPlugins = [postcssImport()];

// Compiles each file in the "web/pages" directory to a self-contained IIFE bundle
// (plus an extracted .css) that the extension loads into its web views (see WebPanel.ts).
// The compiled files are stored in the "dist/web" directory.
export default fs.readdirSync(path.join(__dirname, "web", "pages")).map((input) => {
	const name = input.split(".")[0].toLowerCase();
	return {
		input: `web/pages/${input}`,
		output: {
			file: `dist/web/${name}.js`,
			format: "iife",
			name: "app",
			sourcemap: false,
		},
		plugins: [
			vue(),
			commonjs(),
			json(),
			alias({
				entries: [{ find: "@", replacement: __dirname + "/web/" }],
			}),
			image(),
			postcss({ extract: `${name}.css`, plugins: postCssPlugins }),
			copy({
				targets: [{ src: "web/assets", dest: "dist" }],
			}),
			nodePolyFills(),
			resolve({
				browser: true,
				dedupe: ["vue"],
			}),
			replace({
				"process.env.NODE_ENV": production ? '"production"' : '"development"',
				preventAssignment: true,
			}),
			esbuild({
				minify: production,
				target: "esnext",
			}),
			production && terser(),
			production && filesize(),
		],
		external: ["vscode"],
		watch: {
			clearScreen: false,
			exclude: ["node_modules/**"],
		},
	};
});
