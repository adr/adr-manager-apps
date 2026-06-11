import { describe, expect, test } from "vitest";
import { buildDemoAdrEntries, DEMO_FOLDER_NAME, DEMO_FULL_PATH } from "../../web/tour/demo-adrs";
import { buildEditorTourSteps } from "../../web/tour/editor-steps";
import { buildMainTourSteps } from "../../web/tour/main-steps";
import { cleanPathString } from "../plugins/utils";

/** The exact filter MainView.adrsInFolder applies to the displayed list. */
function inFolder(entries: ReturnType<typeof buildDemoAdrEntries>, folder: string, adrDirectory: string) {
  return entries.filter((entry) => entry.relativePath.includes(cleanPathString(folder + "/" + adrDirectory)));
}

describe("buildDemoAdrEntries", () => {
  test("entries satisfy the MainView folder filter", () => {
    const entries = buildDemoAdrEntries("my-project", "docs/decisions");
    expect(inFolder(entries, "my-project", "docs/decisions")).toHaveLength(entries.length);
  });

  test("entries match the filter when the directory has a trailing slash", () => {
    const entries = buildDemoAdrEntries("my-project", "docs/decisions/");
    expect(inFolder(entries, "my-project", "docs/decisions/")).toHaveLength(entries.length);
  });

  test("entries fall back to docs/decisions when the directory has not arrived yet", () => {
    const entries = buildDemoAdrEntries(DEMO_FOLDER_NAME, "");
    // MainView filters with the raw (empty) directory value, which the default path contains.
    expect(inFolder(entries, DEMO_FOLDER_NAME, "")).toHaveLength(entries.length);
  });

  test("entries are conforming, sentinel-pathed and uniquely named", () => {
    const entries = buildDemoAdrEntries("my-project", "docs/decisions");
    expect(entries.length).toBeGreaterThanOrEqual(2);
    for (const entry of entries) {
      expect(entry.adr.conforming).toBe(true);
      expect(entry.fullPath).toBe(DEMO_FULL_PATH);
    }
    expect(new Set(entries.map((entry) => entry.fileName)).size).toBe(entries.length);
  });
});

describe("tour step definitions", () => {
  test("main steps have unique ids and data-tour targets", () => {
    const steps = buildMainTourSteps({ demoMode: false, revealCardActions: () => undefined });
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
    for (const step of steps) {
      if (step.target) {
        expect(step.target).toMatch(/^\[data-tour='[a-z-]+'\]$/);
      }
    }
  });

  test("the list step mentions the example entries only in demo mode", () => {
    const demo = buildMainTourSteps({ demoMode: true, revealCardActions: () => undefined });
    const real = buildMainTourSteps({ demoMode: false, revealCardActions: () => undefined });
    expect(demo.find((step) => step.id === "list")?.body).toContain("examples");
    expect(real.find((step) => step.id === "list")?.body).not.toContain("examples");
  });

  test("editor steps have unique ids and data-tour targets", () => {
    const steps = buildEditorTourSteps();
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
    for (const step of steps) {
      if (step.target) {
        expect(step.target).toMatch(/^\[data-tour='[a-z-]+'\]$/);
      }
    }
  });
});
