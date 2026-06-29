// Tests for the extension-specific utilities. The shared parser/title/casing
// logic is tested in @adr-manager/core (packages/core/tests).
import { describe, expect, test } from "vitest";
import { cleanPathString, isListableAdrFile, matchesMadrTitleFormat, splitAdrDirectory } from "../plugins/utils";

describe("Test MADR Title Format Match", () => {
  test("Valid MADR titles", () => {
    const validTitles = [
      "0000-use-markdown-architectural-records.md",
      "0001-use-vue.js.md",
      "0002-use-antlr-for-parsing-adrs.md",
      "0003-use-rollup-to-bundle-webviews.md",
      "0004-example-madr-title.md",
      "0005_madr_with_underscores.md",
      "0006_madr-with_mixed-word_delimiters.md",
      "0007-Uppercase-File-Name.md",
      "0008_UpperCase_LetTErs_IN_WorDs.md"
    ];
    validTitles.forEach((title) => {
      const result = matchesMadrTitleFormat(title);
      expect(result).toBeTruthy();
    });
  });

  test("Invalid MADR titles", () => {
    const invalidTitles = [
      "001-only-three-numbers-at-the-start.md",
      "0003-not-ending-in-md.txt",
      "0004-dash-in-the-end-.md",
      "0004_underscore_in_the_end_.md"
    ];

    invalidTitles.forEach((title) => {
      const result = matchesMadrTitleFormat(title);
      expect(result).toBeFalsy();
    });
  });
});

describe("Test Cleaning Path Strings", () => {
  test("Replace backslashes with forward slash", () => {
    const uncleanedPaths = [
      "C:\\Users\\Steven\\some\\path\\with\\backslash",
      "\\\\Users\\\\\\Steven\\\\multiple\\\\\\backslashes",
      "\\backslash\\at\\the\\end\\"
    ];
    const cleanedPaths = [
      "C:/Users/Steven/some/path/with/backslash",
      "/Users/Steven/multiple/backslashes",
      "/backslash/at/the/end/"
    ];
    for (let i = 0; i < uncleanedPaths.length; i++) {
      expect(cleanPathString(uncleanedPaths[i]!)).toBe(cleanedPaths[i]);
    }
  });
  test("Replace multiple forward slashes with single forward slash", () => {
    const uncleanedPaths = [
      "//Users//Steven/a/path//with///multiple/////forward///slashes",
      "/multiple/forward/slashes/at/the/end//"
    ];
    const cleanedPaths = [
      "/Users/Steven/a/path/with/multiple/forward/slashes",
      "/multiple/forward/slashes/at/the/end/"
    ];
    for (let i = 0; i < uncleanedPaths.length; i++) {
      expect(cleanPathString(uncleanedPaths[i]!)).toBe(cleanedPaths[i]);
    }
  });
});

describe("Test Splitting ADR Directories", () => {
  test("Splits a nested directory into its segments", () => {
    expect(splitAdrDirectory("docs/decisions")).toEqual(["docs", "decisions"]);
    expect(splitAdrDirectory("/doc/adr/")).toEqual(["doc", "adr"]);
  });

  test("Treats root references as an empty segment list", () => {
    expect(splitAdrDirectory(".")).toEqual([]);
    expect(splitAdrDirectory("./")).toEqual([]);
    expect(splitAdrDirectory("/")).toEqual([]);
    expect(splitAdrDirectory("")).toEqual([]);
  });
});

describe("Test Listable ADR Files", () => {
  test("Lists any Markdown file, numbered or not", () => {
    expect(isListableAdrFile("0001-use-vue.md")).toBe(true);
    expect(isListableAdrFile("case-description-1-anonymized-raw.md")).toBe(true);
    expect(isListableAdrFile("Decision Notes.MD")).toBe(true);
  });

  test("Skips non-Markdown files and the scaffolded README and template", () => {
    expect(isListableAdrFile("diagram.png")).toBe(false);
    expect(isListableAdrFile("README.md")).toBe(false);
    expect(isListableAdrFile("readme.md")).toBe(false);
    expect(isListableAdrFile("adr-template.md")).toBe(false);
  });
});
