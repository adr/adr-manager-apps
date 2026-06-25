import { ArchitecturalDecisionRecord } from "./classes";
import type { MadrTemplateVersion, Tag } from "./types";

export interface DemoAdrFixture {
  fileName: string;
  templateVersion: MadrTemplateVersion;
  tags: Tag[];
  record: ArchitecturalDecisionRecord;
}

/**
 * The populated example ADR opened by both tours. It deliberately uses MADR 2.1.2
 * because its people and consequence fields follow that template's structure.
 */
export function buildPrimaryDemoAdrFixture(): DemoAdrFixture {
  return {
    fileName: "0001-use-markdown-architectural-decision-records.md",
    templateVersion: "2.1.2",
    tags: [
      { id: "architecture", label: "architecture", color: "#6366f1" },
      { id: "documentation", label: "documentation", color: "#22c55e" }
    ],
    record: new ArchitecturalDecisionRecord({
      title: "Use Markdown Architectural Decision Records",
      status: "accepted",
      date: "2024-03-18",
      deciders: "Ada Lovelace, Grace Hopper",
      contextAndProblemStatement:
        "We want to record the architectural decisions made in this project, " +
        "so that new team members can understand why the system looks the way it does.",
      decisionDrivers: [
        "Decisions should live next to the code they affect",
        "The format should be reviewable in pull requests"
      ],
      consideredOptions: [
        {
          title: "MADR",
          description: "Markdown Architectural Decision Records.",
          pros: ["Plain Markdown, works with any Git host", "Lightweight template"],
          cons: ["Needs discipline to keep up to date"]
        },
        { title: "A wiki", pros: ["Easy to edit"], cons: ["Drifts away from the code"] },
        { title: "No documentation" }
      ],
      decisionOutcome: {
        chosenOption: "MADR",
        explanation: "it keeps the decision history versioned together with the code",
        positiveConsequences: ["Every decision is reviewable and traceable"],
        negativeConsequences: ["Writing a record takes a little time"]
      },
      links: []
    })
  };
}

export function buildDemoAdrFixtures(): DemoAdrFixture[] {
  return [
    buildPrimaryDemoAdrFixture(),
    {
      fileName: "0002-choose-database-for-user-data.md",
      templateVersion: "2.1.2",
      tags: [{ id: "data", label: "data", color: "#f59e0b" }],
      record: new ArchitecturalDecisionRecord({
        title: "Choose Database for User Data",
        status: "proposed",
        contextAndProblemStatement:
          "User data needs durable storage with flexible querying. Which database should we adopt?"
      })
    }
  ];
}

/**
 * Copy for the steps that describe features both apps share identically. App-specific
 * steps (repositories vs workspace folders, commit vs save, the Command Palette) keep
 * their own wording in each app's step file.
 */
export const TOUR_COPY = {
  adrDefinition:
    "An ADR is a short Markdown document that captures one architectural decision, the context behind it, " +
    "the options that were considered and the outcome.",
  search: "Type in the search bar to find ADRs by title.",
  filter: "Use the filter button to narrow the list by status or tag.",
  editorIntro:
    "The editor turns the MADR template into a form with fields like title, context, considered options " +
    "and decision outcome. Everything you type is converted to Markdown as you go, and the title also " +
    "becomes the file name.",
  templateVersion:
    "This shows the MADR template version used by the decision. Open it to choose another supported version; " +
    "ADR Manager keeps compatible field data when switching.",
  modeToggle:
    "This switch toggles the optional MADR fields. Professional mode reveals decision drivers, pros and " +
    "cons per option and detailed consequences, while Basic keeps only the essentials. Hidden fields are " +
    "kept in the file.",
  fieldVisibility:
    "The Fields button is a Professional mode feature that lets you toggle individual Professional mode " +
    "sections on or off to match your personal preferences."
} as const;
