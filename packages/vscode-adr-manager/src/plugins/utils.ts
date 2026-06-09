import { createShortTitle as coreCreateShortTitle } from "@adr-manager/core";

// Case-conversion and clean-up helpers now live in the shared core package.
export { cleanUpString, snakeCase2naturalCase, naturalCase2snakeCase, naturalCase2titleCase } from "@adr-manager/core";

/**
 * Returns a shortened title. The extension strips backticks (the web app keeps them).
 */
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
 * Returns true if the specified string is a valid directory name. The name must not start
 * with whitespace, end with a dot or whitespace, or contain any of: ? * : " ; < > | / \
 */
export function validateDirectoryName(name?: string | undefined): boolean {
  if (typeof name === "undefined") {
    return false;
  }

  const test = /^[^\s\x00-\x1f\\?*:"";<>|\/][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$/g;

  return test.test(name);
}

/**
 * Returns true if the given string matches the MADR file-name format: starts with a
 * four-digit number, is in kebab-case / snake_case (or a mix), and ends in .md.
 * The characters '#' and '?' are prohibited to avoid URI parsing issues.
 */
export function matchesMadrTitleFormat(name: string) {
  return name.match(/^\d{4}((-|_)[^\s-_?*:\"<>|/\\]+)+\.md$/);
}

/**
 * Replaces every "\\" with "/" and collapses repeated "/" into a single "/".
 */
export function cleanPathString(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/(\\\\)+\\*/g, "/")
    .replace(/(\/\/)+\/*/g, "/");
}
