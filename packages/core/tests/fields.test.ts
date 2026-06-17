import { describe, expect, test } from "vitest";
import {
  ArchitecturalDecisionRecord,
  DEFAULT_FIELD_VISIBILITY,
  FIELD_KEYS,
  applyFieldVisibilityFilter
} from "../src/index";

describe("relevantFiles field visibility", () => {
  test("relevantFiles is a known, default-visible field key", () => {
    expect(FIELD_KEYS).toContain("relevantFiles");
    expect(DEFAULT_FIELD_VISIBILITY.relevantFiles).toBe(true);
  });

  test("a visible relevantFiles field is preserved by the filter", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: ["src/main.ts"] });
    const filtered = applyFieldVisibilityFilter(adr, { ...DEFAULT_FIELD_VISIBILITY });
    expect(filtered.relevantFiles).toStrictEqual(["src/main.ts"]);
  });

  test("a hidden relevantFiles field is zeroed without mutating the original", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: ["src/main.ts"] });
    const filtered = applyFieldVisibilityFilter(adr, { ...DEFAULT_FIELD_VISIBILITY, relevantFiles: false });
    expect(filtered.relevantFiles).toStrictEqual([]);
    expect(adr.relevantFiles).toStrictEqual(["src/main.ts"]);
  });
});

describe("relevantFiles cleanUp", () => {
  test("lenient mode trims entries but keeps empties", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: [" src/main.ts ", ""] });
    expect(adr.relevantFiles).toStrictEqual(["src/main.ts", ""]);
  });

  test("aggressive mode trims and drops empty entries", () => {
    const adr = new ArchitecturalDecisionRecord({ relevantFiles: [" src/main.ts ", ""] });
    adr.cleanUp({ aggressive: true });
    expect(adr.relevantFiles).toStrictEqual(["src/main.ts"]);
  });
});

describe("applyFieldVisibilityFilter", () => {
  test("clears hidden optional fields without mutating required fields or option identity", () => {
    const adr = new ArchitecturalDecisionRecord({
      yaml: "status: accepted",
      title: "Use PostgreSQL",
      status: "accepted",
      date: "2026-06-17",
      deciders: "Alice",
      decisionMakers: "Alice",
      consulted: "Bob",
      informed: "Carol",
      technicalStory: "Billing needs relational data.",
      contextAndProblemStatement: "Need a durable store.",
      decisionDrivers: ["Durability"],
      consideredOptions: [
        {
          title: "PostgreSQL",
          description: "Relational database",
          pros: ["ACID"],
          neutrals: ["Existing skill"],
          cons: ["Operational cost"]
        }
      ],
      decisionOutcome: {
        chosenOption: "PostgreSQL",
        explanation: "Best fit.",
        positiveConsequences: ["Better consistency"],
        negativeConsequences: ["More ops"]
      },
      consequences: [{ kind: "good", text: "Stable schema" }],
      confirmation: "Review after launch.",
      links: ["https://example.com"],
      relevantFiles: ["src/db.ts"],
      moreInformation: "Extra notes."
    });

    const filtered = applyFieldVisibilityFilter(adr, {
      date: false,
      status: false,
      deciders: false,
      consulted: false,
      informed: false,
      technicalStory: false,
      decisionDrivers: false,
      optionDescription: false,
      optionProsAndCons: false,
      positiveConsequences: false,
      negativeConsequences: false,
      consequences: false,
      confirmation: false,
      links: false,
      moreInformation: false,
      relevantFiles: false
    });

    expect(filtered.title).toBe("Use PostgreSQL");
    expect(filtered.contextAndProblemStatement).toBe("Need a durable store.");
    expect(filtered.decisionOutcome.chosenOption).toBe("PostgreSQL");
    expect(filtered.decisionOutcome.explanation).toBe("Best fit.");
    expect(filtered.yaml).toBe("status: accepted");

    expect(filtered.status).toBe("");
    expect(filtered.date).toBe("");
    expect(filtered.deciders).toBe("");
    expect(filtered.decisionMakers).toBe("");
    expect(filtered.consulted).toBe("");
    expect(filtered.informed).toBe("");
    expect(filtered.technicalStory).toBe("");
    expect(filtered.decisionDrivers).toStrictEqual([]);
    expect(filtered.decisionOutcome.positiveConsequences).toStrictEqual([]);
    expect(filtered.decisionOutcome.negativeConsequences).toStrictEqual([]);
    expect(filtered.consequences).toStrictEqual([]);
    expect(filtered.confirmation).toBe("");
    expect(filtered.links).toStrictEqual([]);
    expect(filtered.relevantFiles).toStrictEqual([]);
    expect(filtered.moreInformation).toBe("");

    expect(filtered.consideredOptions).toStrictEqual([
      { id: 0, title: "PostgreSQL", description: "", pros: [], neutrals: [], cons: [] }
    ]);
    expect(adr.consideredOptions[0]).toMatchObject({
      title: "PostgreSQL",
      description: "Relational database",
      pros: ["ACID"],
      neutrals: ["Existing skill"],
      cons: ["Operational cost"]
    });
  });
});
