import { describe, expect, test } from "vitest";
import { cleanUpString, createShortTitle, naturalCase2snakeCase, snakeCase2naturalCase } from "../src/index";

describe("createShortTitle", () => {
  // The same four cases hold with and without stripBackticks (the extension's profile),
  // since none of these titles contain backticks.
  const cases: { title: string; short: string }[] = [
    {
      title: "[MADR](https://adr.github.io/madr/) 2.1.2 – The Markdown Architectural Decision Records",
      short: "MADR 2.1.2"
    },
    {
      title: "Include in [adr-tools](https://github.com/npryce/adr-tools)",
      short: "Include in adr-tools"
    },
    // Wrong balancing of brackets
    {
      title: "Include in [adr-tools](https://github.com/npryce/adr-tools",
      short: "Include in [adr-tools](https://github.com/npryce/adr-tools"
    },
    // Single closing brace
    { title: "Con. Opt 1)", short: "Con. Opt 1)" }
  ];

  cases.forEach(({ title, short }) => {
    test(`default options: ${short}`, () => {
      expect(createShortTitle(title)).toBe(short);
    });
    test(`stripBackticks: ${short}`, () => {
      expect(createShortTitle(title, { stripBackticks: true })).toBe(short);
    });
  });
});

describe("case conversions", () => {
  test("Test snakeCase2naturalCase", () => {
    expect(snakeCase2naturalCase("0005-use-dashes-in-file-names.md")).toBe("0005 Use Dashes In File Names.md");
  });

  test("Test naturalCase2snakeCase", () => {
    expect(naturalCase2snakeCase("0005 Use dashes in File names.md")).toBe("0005-use-dashes-in-file-names.md");
  });
});

describe("cleanUpString", () => {
  test("trims surrounding whitespace", () => {
    expect(cleanUpString("  some value\n")).toBe("some value");
  });

  test("maps undefined and null to the empty string", () => {
    expect(cleanUpString(undefined)).toBe("");
    expect(cleanUpString(null)).toBe("");
  });
});
