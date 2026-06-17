import { describe, expect, test } from "vitest";
import {
  cleanUpString,
  createShortTitle,
  matchOptionTitleMoreRelaxed,
  matchesIgnoringFormatting,
  naturalCase2snakeCase,
  naturalCase2titleCase,
  snakeCase2naturalCase
} from "../src/index";

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

  test("naturalCase2titleCase keeps minor words and known initialisms readable", () => {
    expect(naturalCase2titleCase("introduce adr ids for the madr parser")).toBe(
      "Introduce ADR IDs for the MADR Parser"
    );
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

describe("relaxed matching helpers", () => {
  test("matchesIgnoringFormatting ignores whitespace and markdown bullet style", () => {
    expect(matchesIgnoringFormatting("- One\n- Two\n", "* One * Two")).toBe(true);
    expect(matchesIgnoringFormatting("- One", "- Different")).toBe(false);
  });

  test("matchOptionTitleMoreRelaxed accepts short titles and optional backtick stripping", () => {
    expect(matchOptionTitleMoreRelaxed("Use PostgreSQL - durable relational store", "Use PostgreSQL")).toBe(true);
    expect(matchOptionTitleMoreRelaxed("Use `PostgreSQL` - durable relational store", "Use PostgreSQL")).toBe(false);
    expect(
      matchOptionTitleMoreRelaxed("Use `PostgreSQL` - durable relational store", "Use PostgreSQL", {
        stripBackticks: true
      })
    ).toBe(true);
  });
});
