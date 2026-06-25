// Tests for the extension's version-aware parse/serialize dispatch. The parsers
// and writers themselves are tested in @adr-manager/core (packages/core/tests).
import { describe, expect, test } from "vitest";
import { setMadrVersionInMd } from "@adr-manager/core";
import { detectMadrVersion, parseAdr, resolveMadrVersion, serializeAdr } from "../plugins/parser";

const MADR_212 = `# Use Markdown Any Decision Records

* Status: accepted
* Deciders: Ezra
* Date: 2026-06-10

## Context and Problem Statement

We need to record decisions.

## Considered Options

* MADR
* Formless

## Decision Outcome

Chosen option: "MADR", because it is lean.
`;

const MADR_400 = `---
status: "accepted"
date: 2026-06-10
decision-makers: Ezra
consulted: Steven
informed: The team
---

# Use a Custom Token-Based Design System

## Context and Problem Statement

The apps drifted apart visually.

## Decision Drivers

* Visual parity

## Considered Options

* Custom design system
* Keep Vuetify

## Decision Outcome

Chosen option: "Custom design system", because it gives parity.

### Consequences

* Good, because the apps look the same
* Bad, because we own more CSS

### Confirmation

A design review.

## Pros and Cons of the Options

### Custom design system

* Good, because it matches
* Neutral, because it is custom
* Bad, because it is more code

## More Information

Supersedes ADR-0001.
`;

describe("parseAdr", () => {
  test("detects and parses a 2.1.2 document with the ANTLR parser", () => {
    expect(detectMadrVersion(MADR_212)).toBe("2.1.2");
    const adr = parseAdr(MADR_212);
    expect(adr.conforming).toBe(true);
    expect(adr.deciders).toBe("Ezra");
    expect(adr.decisionOutcome.chosenOption).toBe("MADR");
  });

  test("detects and parses a 4.0.0 document including its new fields", () => {
    expect(detectMadrVersion(MADR_400)).toBe("4.0.0");
    const adr = parseAdr(MADR_400);
    expect(adr.conforming).toBe(true);
    expect(adr.decisionMakers).toBe("Ezra");
    expect(adr.consulted).toBe("Steven");
    expect(adr.informed).toBe("The team");
    expect(adr.confirmation).toBe("A design review.");
    expect(adr.moreInformation).toBe("Supersedes ADR-0001.");
    expect(adr.consequences).toStrictEqual([
      { kind: "good", text: "the apps look the same" },
      { kind: "bad", text: "we own more CSS" }
    ]);
    expect(adr.consideredOptions[0].neutrals).toStrictEqual(["it is custom"]);
  });

  test("marks a non-round-tripping 4.0.0 document as not conforming", () => {
    const adr = parseAdr(MADR_400 + "\n## Unknown Section\n\nUnparsed content.\n");
    expect(adr.conforming).toBe(false);
  });

  test("round-trips a 4.0.0 document through serializeAdr", () => {
    const adr = parseAdr(MADR_400);
    expect(serializeAdr(adr, "4.0.0")).toBe(MADR_400);
  });

  test("hydrates relevant files from the metadata comment", () => {
    const md = `${MADR_212}\n<!-- adr-manager-relevant-files: ["src/main.ts","docs/adr with spaces.md"] -->`;
    const adr = parseAdr(md);
    expect(adr.relevantFiles).toStrictEqual(["src/main.ts", "docs/adr with spaces.md"]);
    expect(serializeAdr(adr, "2.1.2")).not.toContain("adr-manager-relevant-files");
  });

  test("converts between template versions", () => {
    const adr = parseAdr(MADR_212);
    adr.decisionMakers = adr.deciders;
    const converted = serializeAdr(adr, "4.0.0");
    expect(detectMadrVersion(converted)).toBe("4.0.0");
    expect(converted).toContain("decision-makers: Ezra");
    expect(converted).not.toContain("* Deciders:");
  });

  test("resolveMadrVersion classifies markers, real templates and ambiguous ADRs", () => {
    const basic = `# Use MADR

## Context and Problem Statement

We need to record decisions.

## Considered Options

* MADR
* Formless

## Decision Outcome

Chosen option: "MADR", because it is lean.
`;
    // Detection alone cannot classify a basic ADR (both templates share these sections)...
    expect(detectMadrVersion(basic)).toBe("2.1.2");
    // ...so an unclassifiable ADR resolves to the default (latest) version.
    expect(resolveMadrVersion(basic)).toBe("4.0.0");
    // An explicit marker always wins, even against the default.
    expect(resolveMadrVersion(setMadrVersionInMd(basic, "2.1.2"))).toBe("2.1.2");
    // A document that genuinely only fits 2.1.2 keeps that version.
    expect(resolveMadrVersion(MADR_212)).toBe("2.1.2");
    // A real 4.0.0 document is detected as such.
    expect(resolveMadrVersion(MADR_400)).toBe("4.0.0");
  });

  test("strips a pinned version marker before parsing so it never leaks into a field", () => {
    const adr = parseAdr(setMadrVersionInMd(MADR_400, "4.0.0"));
    expect(adr.moreInformation).toBe("Supersedes ADR-0001.");
    expect(adr.confirmation).toBe("A design review.");
  });
});
