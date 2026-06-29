// Pure file-name derivation for the title-change rename. The vscode module is mocked away;
// renameAdrFileName is plain string logic.
import { describe, expect, test, vi } from "vitest";

// Just enough surface for the module-level statements in plugins/constants.ts.
vi.mock("vscode", () => ({
  extensions: { getExtension: () => ({ extensionPath: "/" }) },
  Uri: { parse: (value: string) => ({ path: value }) }
}));

import { adrFileNameForSave, renameAdrFileName } from "../extension-functions";

describe("renameAdrFileName", () => {
  test("keeps a leading NNNN- number prefix and replaces only the title", () => {
    expect(renameAdrFileName("0001-old-title.md", "New Title")).toBe("0001-new-title.md");
  });

  test("keeps a NNNN_ underscore number prefix", () => {
    expect(renameAdrFileName("0007_old_title.md", "New Title")).toBe("0007_new-title.md");
  });

  test("replaces the whole name when there is no number prefix", () => {
    expect(renameAdrFileName("case-description-1-anonymized-raw.md", "Use Event Sourcing")).toBe(
      "use-event-sourcing.md"
    );
    expect(renameAdrFileName("use-event-sourcing.md", "Adopt Kafka")).toBe("adopt-kafka.md");
  });
});

describe("adrFileNameForSave", () => {
  test("assigns the given number to an unnumbered file (conversion)", () => {
    expect(adrFileNameForSave("case-description-1-anonymized-raw.md", "Use Event Sourcing", 7)).toBe(
      "0007-use-event-sourcing.md"
    );
  });

  test("keeps an existing number even when a new one is offered", () => {
    expect(adrFileNameForSave("0003-broken-decision.md", "Use Event Sourcing", 7)).toBe("0003-use-event-sourcing.md");
  });

  test("falls back to a plain rename when no number is assigned", () => {
    expect(adrFileNameForSave("use-event-sourcing.md", "Adopt Kafka", undefined)).toBe("adopt-kafka.md");
    expect(adrFileNameForSave("0001-old.md", "New Title", undefined)).toBe("0001-new-title.md");
  });
});
