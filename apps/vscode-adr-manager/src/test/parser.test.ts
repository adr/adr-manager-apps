// Tests for the extension's version-aware parse/serialize dispatch. The parsers
// and writers themselves are tested in @adr-manager/core (packages/core/tests).
import { describe, expect, test } from "vitest";
import { detectMadrVersion, parseAdr, serializeAdr } from "../plugins/parser";

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

  test("converts between template versions", () => {
    const adr = parseAdr(MADR_212);
    adr.decisionMakers = adr.deciders;
    const converted = serializeAdr(adr, "4.0.0");
    expect(detectMadrVersion(converted)).toBe("4.0.0");
    expect(converted).toContain("decision-makers: Ezra");
    expect(converted).not.toContain("* Deciders:");
  });
});
