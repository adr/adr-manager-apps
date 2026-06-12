import { describe, expect, test } from "vitest";
import { ArchitecturalDecisionRecord, adr2md400, md2adr400, detectMadrVersion, adr2md } from "../src/index";

function fullRecord(): ArchitecturalDecisionRecord {
  return new ArchitecturalDecisionRecord({
    title: "Use PostgreSQL as the primary datastore",
    status: "accepted",
    date: "2026-06-10",
    decisionMakers: "Jamie Rivera, Priya Patel",
    consulted: "Data Platform Guild",
    informed: "Backend Chapter",
    contextAndProblemStatement: "The billing service needs a durable system of record.",
    decisionDrivers: ["Strong transactional guarantees", "Mature operational tooling"],
    consideredOptions: [
      {
        title: "PostgreSQL",
        description: "Self-managed Postgres on Kubernetes.",
        pros: ["Battle-tested ACID semantics"],
        neutrals: ["Requires us to own backups"],
        cons: ["Horizontal scaling needs extra work"]
      },
      { title: "DynamoDB" }
    ],
    decisionOutcome: {
      chosenOption: "PostgreSQL",
      explanation: "it meets our transactional requirements"
    },
    consequences: [
      { kind: "good", text: "Strong consistency for billing records" },
      { kind: "neutral", text: "We keep operating our own database" },
      { kind: "bad", text: "We must plan a sharding strategy" }
    ],
    confirmation: "An ArchUnit test asserts the module only depends on the Postgres adapter.",
    moreInformation: "Revisit if write volume exceeds 5k TPS sustained.",
    relevantFiles: ["src/billing/store.ts", "src/billing/migrations/0001 initial.sql"]
  });
}

const FULL_MD = `---
status: "accepted"
date: 2026-06-10
decision-makers: Jamie Rivera, Priya Patel
consulted: Data Platform Guild
informed: Backend Chapter
---

# Use PostgreSQL as the primary datastore

## Context and Problem Statement

The billing service needs a durable system of record.

## Decision Drivers

* Strong transactional guarantees
* Mature operational tooling

## Considered Options

* PostgreSQL
* DynamoDB

## Decision Outcome

Chosen option: "PostgreSQL", because it meets our transactional requirements

### Consequences

* Good, because Strong consistency for billing records
* Neutral, because We keep operating our own database
* Bad, because We must plan a sharding strategy

### Confirmation

An ArchUnit test asserts the module only depends on the Postgres adapter.

## Pros and Cons of the Options

### PostgreSQL

Self-managed Postgres on Kubernetes.

* Good, because Battle-tested ACID semantics
* Neutral, because Requires us to own backups
* Bad, because Horizontal scaling needs extra work

## More Information

Revisit if write volume exceeds 5k TPS sustained.

## Relevant Files

* src/billing/store.ts
* src/billing/migrations/0001 initial.sql
`;

describe("adr2md400", () => {
  test("writes the full 4.0.0 template", () => {
    expect(adr2md400(fullRecord())).toBe(FULL_MD);
  });

  test("omits empty sections and front matter", () => {
    const adr = new ArchitecturalDecisionRecord({ title: "Bare decision" });
    expect(adr2md400(adr)).toBe('# Bare decision\n\n## Decision Outcome\n\nChosen option: ""\n');
  });

  test("a fresh ADR with status and date round-trips", () => {
    const adr = new ArchitecturalDecisionRecord({ status: "proposed", date: "2026-06-10" });
    const md = adr2md400(adr);
    expect(adr2md400(md2adr400(md))).toBe(md);
  });

  test("an empty ADR has no defaults and serializes identically in both templates", () => {
    const adr = new ArchitecturalDecisionRecord();
    expect(adr.status).toBe("");
    expect(adr.date).toBe("");
    expect(adr2md400(adr)).toBe(adr2md(adr));
    expect(adr2md400(md2adr400(adr2md400(adr)))).toBe(adr2md400(adr));
  });
});

describe("md2adr400", () => {
  test("parses the full 4.0.0 template", () => {
    expect(md2adr400(FULL_MD)).toStrictEqual(fullRecord());
  });

  test("round-trips exactly", () => {
    expect(adr2md400(md2adr400(FULL_MD))).toBe(FULL_MD);
  });

  test("parses a list-style explanation", () => {
    const adr = new ArchitecturalDecisionRecord({
      title: "T",
      consideredOptions: [{ title: "A" }],
      decisionOutcome: { chosenOption: "A", explanation: "* first reason\n* second reason" }
    });
    const md = adr2md400(adr);
    const parsed = md2adr400(md);
    expect(parsed.decisionOutcome.explanation).toBe("* first reason\n* second reason");
    expect(adr2md400(parsed)).toBe(md);
  });

  test("attaches pros and cons to options matched by short title", () => {
    const md = [
      "# T",
      "",
      "## Considered Options",
      "",
      "* MariaDB Connector - the official connector",
      "",
      "## Decision Outcome",
      "",
      'Chosen option: "MariaDB Connector"',
      "",
      "## Pros and Cons of the Options",
      "",
      "### MariaDB Connector",
      "",
      "* Good, because official",
      ""
    ].join("\n");
    const parsed = md2adr400(md);
    expect(parsed.consideredOptions).toHaveLength(1);
    expect(parsed.consideredOptions[0]?.pros).toStrictEqual(["official"]);
  });
});

describe("detectMadrVersion", () => {
  test("front matter marks a document as 4.0.0", () => {
    expect(detectMadrVersion(FULL_MD)).toBe("4.0.0");
  });

  test("4.0.0-only sections mark a document without front matter", () => {
    const md = '# T\n\n## Decision Outcome\n\nChosen option: "A"\n\n### Confirmation\n\nReviewed in the guild.\n';
    expect(detectMadrVersion(md)).toBe("4.0.0");
  });

  test("neutral arguments mark a document as 4.0.0", () => {
    const md = "# T\n\n## Pros and Cons of the Options\n\n### A\n\n* Neutral, because it depends\n";
    expect(detectMadrVersion(md)).toBe("4.0.0");
  });

  test("classic documents are detected as 2.1.2", () => {
    const adr = new ArchitecturalDecisionRecord({
      title: "T",
      status: "accepted",
      date: "2026-06-10",
      deciders: "Jane",
      consideredOptions: [{ title: "A", pros: ["fast"], cons: ["new"] }],
      decisionOutcome: { chosenOption: "A", explanation: "it fits" }
    });
    expect(detectMadrVersion(adr2md(adr))).toBe("2.1.2");
  });

  test("a Relevant Files section does not mark a document as 4.0.0", () => {
    const adr = new ArchitecturalDecisionRecord({
      title: "T",
      consideredOptions: [{ title: "A" }],
      decisionOutcome: { chosenOption: "A", explanation: "it fits" },
      relevantFiles: ["src/main.ts"]
    });
    expect(detectMadrVersion(adr2md(adr))).toBe("2.1.2");
  });
});
