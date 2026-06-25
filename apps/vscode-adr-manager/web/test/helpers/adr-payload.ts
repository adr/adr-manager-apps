// Shared ADR payload builder for the save-adr / adr-data mixin tests. getInput() parses this
// JSON, so each test needs a full-shaped record and overrides only the fields it cares about.
export function makeAdrPayload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    yaml: "",
    title: "Sample ADR",
    date: "",
    status: "",
    deciders: "",
    technicalStory: "",
    contextAndProblemStatement: "",
    decisionDrivers: [],
    consideredOptions: [],
    decisionOutcome: { chosenOption: "", explanation: "", positiveConsequences: [], negativeConsequences: [] },
    links: [],
    decisionMakers: "",
    consulted: "",
    informed: "",
    consequences: [],
    confirmation: "",
    moreInformation: "",
    templateVersion: "2.1.2",
    fullPath: "/workspace/docs/decisions/0001-sample.md",
    ...overrides
  });
}
