import { describe, expect, test } from "vitest";
import {
  ArchitecturalDecisionRecord,
  MADR_TEMPLATE_ADAPTERS,
  adr2md,
  adr2md400,
  detectMadrVersion,
  getMadrTemplateAdapter,
  hasMadrTemplateField,
  md2adr,
  md2adr400,
  parseMadr,
  roundTripsMadr,
  serializeMadr
} from "../src/index";

const MADR_212 = `# Use PostgreSQL

* Status: accepted
* Deciders: Jane Doe
* Date: 2026-06-10

## Context and Problem Statement

We need a durable system of record.

## Considered Options

* PostgreSQL
* DynamoDB

## Decision Outcome

Chosen option: "PostgreSQL", because it fits.
`;

const MADR_400 = `---
status: "accepted"
date: 2026-06-10
decision-makers: Jane Doe
consulted: Data Guild
informed: Backend Chapter
---

# Use PostgreSQL

## Context and Problem Statement

We need a durable system of record.

## Considered Options

* PostgreSQL
* DynamoDB

## Decision Outcome

Chosen option: "PostgreSQL", because it fits.

### Consequences

* Good, because the data model is familiar
* Bad, because failover needs care

### Confirmation

Reviewed by the architecture group.

## More Information

Revisit after the first scaling incident.
`;

describe("MADR template registry", () => {
  test("exposes unique template versions", () => {
    const versions = MADR_TEMPLATE_ADAPTERS.map((adapter) => adapter.version);
    expect(versions).toStrictEqual(["4.0.0", "2.1.2"]);
    expect(new Set(versions).size).toBe(versions.length);
  });

  test("describes template-specific editor semantics", () => {
    const classic = getMadrTemplateAdapter("2.1.2");
    const modern = getMadrTemplateAdapter("4.0.0");

    expect(classic.peopleFields).toBe("deciders");
    expect(classic.optionArgumentKinds).toStrictEqual(["good", "bad"]);
    expect(hasMadrTemplateField(classic, "positiveConsequences")).toBe(true);
    expect(hasMadrTemplateField(classic, "consequences")).toBe(false);

    expect(modern.peopleFields).toBe("decisionMakersConsultedInformed");
    expect(modern.optionArgumentKinds).toStrictEqual(["good", "neutral", "bad"]);
    expect(hasMadrTemplateField(modern, "positiveConsequences")).toBe(false);
    expect(hasMadrTemplateField(modern, "consequences")).toBe(true);
  });

  test("detects supported versions through the registry", () => {
    expect(detectMadrVersion(MADR_212)).toBe("2.1.2");
    expect(detectMadrVersion(MADR_400)).toBe("4.0.0");
  });

  test("cannot tell a basic 4.0.0 document from 2.1.2 (why the version marker exists)", () => {
    const basic = new ArchitecturalDecisionRecord({
      title: "Use PostgreSQL",
      contextAndProblemStatement: "We need a durable system of record.",
      consideredOptions: [{ title: "PostgreSQL" }, { title: "DynamoDB" }],
      decisionOutcome: { chosenOption: "PostgreSQL", explanation: "it fits" }
    });
    const markdown = serializeMadr(basic, "4.0.0");
    expect(markdown).not.toContain("---");
    expect(detectMadrVersion(markdown)).toBe("2.1.2");
  });

  test("dispatches 2.1.2 parsing and serialization to the classic parser", () => {
    const parsed = parseMadr(MADR_212, "2.1.2");
    expect(parsed).toStrictEqual(md2adr(MADR_212));
    expect(serializeMadr(parsed, "2.1.2")).toBe(adr2md(parsed));
  });

  test("dispatches 4.0.0 parsing and serialization to the 4.0.0 reader", () => {
    const parsed = parseMadr(MADR_400, "4.0.0");
    expect(parsed).toStrictEqual(md2adr400(MADR_400));
    expect(serializeMadr(parsed, "4.0.0")).toBe(adr2md400(parsed));
  });

  test("round-trips documents with the requested adapter", () => {
    const record = new ArchitecturalDecisionRecord({
      title: "Use PostgreSQL",
      decisionMakers: "Jane Doe",
      consideredOptions: [{ title: "PostgreSQL" }],
      decisionOutcome: { chosenOption: "PostgreSQL", explanation: "it fits" },
      confirmation: "Reviewed by the architecture group."
    });
    const markdown = serializeMadr(record, "4.0.0");
    expect(roundTripsMadr(markdown, "4.0.0")).toBe(true);
  });

  test("carries people fields when switching templates", () => {
    const record = new ArchitecturalDecisionRecord({ deciders: "Jane Doe" });
    getMadrTemplateAdapter("4.0.0").carryOverOnSwitch(record, "2.1.2");
    expect(record.decisionMakers).toBe("Jane Doe");

    record.deciders = "";
    getMadrTemplateAdapter("2.1.2").carryOverOnSwitch(record, "4.0.0");
    expect(record.deciders).toBe("Jane Doe");
  });
});
