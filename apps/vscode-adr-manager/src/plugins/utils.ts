import { createShortTitle as coreCreateShortTitle } from "@adr-manager/core";

export { cleanUpString, snakeCase2naturalCase, naturalCase2snakeCase, naturalCase2titleCase } from "@adr-manager/core";

export function createShortTitle(title: string): string {
  return coreCreateShortTitle(title, { stripBackticks: true });
}

/**
 * Returns a randomly generated 32-character string (used as a Content-Security-Policy nonce).
 */
export function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Returns true if the given string matches the MADR file-name format: starts with a
 * four-digit number, is in kebab-case / snake_case (or a mix), and ends in .md.
 * The characters '#' and '?' are prohibited to avoid URI parsing issues.
 */
export function matchesMadrTitleFormat(name: string) {
  return name.match(/^\d{4}((-|_)[^\s-_?*:"<>|/\\]+)+\.md$/);
}

/**
 * Replaces every "\\" with "/" and collapses repeated "/" into a single "/".
 */
export function cleanPathString(path: string): string {
  return path.replace(/\\/g, "/").replace(/(\/\/)+\/*/g, "/");
}

/**
 * Splits a configured ADR directory into its meaningful path segments, dropping empty
 * segments and ".". This makes "", ".", "./" and "/" all resolve to an empty array, which
 * callers treat as "the workspace root folder itself" rather than a named subfolder.
 */
export function splitAdrDirectory(adrDirectory: string): string[] {
  return cleanPathString(adrDirectory)
    .split("/")
    .filter((segment) => segment !== "" && segment !== ".");
}

// Markdown files the extension scaffolds itself, which are never ADRs and must stay out of the overview.
const NON_ADR_MARKDOWN_FILES = new Set(["readme.md", "adr-template.md"]);

/**
 * Returns true if the file belongs in the ADR overview: any Markdown file except the README and
 * ADR template the extension scaffolds. ADRs need no four-digit prefix anymore, so unnumbered files
 * list alphabetically too; non-conforming ones open in the convert view instead of the editor.
 */
export function isListableAdrFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".md") && !NON_ADR_MARKDOWN_FILES.has(lower);
}
