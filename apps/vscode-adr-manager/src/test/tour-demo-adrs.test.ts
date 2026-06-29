import { describe, expect, test, vi } from "vitest";
import { buildDemoAdrEntries, DEMO_FOLDER_NAME } from "../../web/tour/demo-adrs";
import { buildEditorTourSteps } from "../../web/tour/editor-steps";
import { buildMainTourSteps } from "../../web/tour/main-steps";
import { cleanPathString } from "../plugins/utils";
import { consumeQueuedTourStart, isDemoAdrPath, type TourKind } from "../tour";

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

  test("entries are conforming and have unique names and synthetic paths", () => {
    const entries = buildDemoAdrEntries("my-project", "docs/decisions");
    expect(entries.length).toBeGreaterThanOrEqual(2);
    for (const entry of entries) {
      expect(entry.adr.conforming).toBe(true);
      expect(isDemoAdrPath(entry.fullPath)).toBe(true);
    }
    expect(new Set(entries.map((entry) => entry.fileName)).size).toBe(entries.length);
    expect(new Set(entries.map((entry) => entry.fullPath)).size).toBe(entries.length);
  });
});

describe("queued tour starts", () => {
  test("consuming one tour kind leaves the other queued", () => {
    const queue = new Set<TourKind>(["main", "editor"]);

    expect(consumeQueuedTourStart(queue, "main")).toBe(true);
    expect(queue.has("main")).toBe(false);
    expect(queue.has("editor")).toBe(true);
    expect(consumeQueuedTourStart(queue, "main")).toBe(false);
    expect(consumeQueuedTourStart(queue, "editor")).toBe(true);
  });
});

describe("tour step definitions", () => {
  const context = {
    demoMode: false,
    hasFilters: true,
    revealCardActions: () => undefined,
    setFiltersOpen: () => undefined,
    setExampleFilterActive: () => undefined
  };

  test("main steps have unique ids and data-tour targets", () => {
    const steps = buildMainTourSteps(context);
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
    for (const step of steps) {
      if (step.target) {
        expect(
          /^\[data-tour='[a-z-]+'\]$/.test(step.target) ||
            step.target === ".filter-panel .filter-chip:not(.tags-more-btn)"
        ).toBe(true);
      }
    }
  });

  test("the list step mentions the example entries only in demo mode", () => {
    const demo = buildMainTourSteps({ ...context, demoMode: true });
    const real = buildMainTourSteps(context);
    expect(demo.find((step) => step.id === "list")?.body).toContain("examples");
    expect(real.find((step) => step.id === "list")?.body).not.toContain("examples");
  });

  test("orders card actions immediately after the list, then search before filtering", () => {
    const ids = buildMainTourSteps(context).map((step) => step.id);
    expect(ids.slice(ids.indexOf("list"), ids.indexOf("adr-filter-example") + 1)).toEqual([
      "list",
      "edit",
      "delete",
      "adr-search",
      "adr-filter",
      "adr-filter-example"
    ]);
  });

  test("only includes the filter step when filters are available", () => {
    expect(buildMainTourSteps(context).some((step) => step.id === "adr-filter")).toBe(true);
    expect(buildMainTourSteps({ ...context, hasFilters: false }).some((step) => step.id === "adr-filter")).toBe(false);
  });

  test("opens and closes the filter panel around the filter step", () => {
    const setFiltersOpen = vi.fn();
    const step = buildMainTourSteps({ ...context, setFiltersOpen }).find((candidate) => candidate.id === "adr-filter");

    step?.onEnter?.();
    step?.onExit?.();

    expect(setFiltersOpen.mock.calls).toEqual([[true], [false]]);
  });

  test("applies and removes a temporary filter during the example step", () => {
    const setFiltersOpen = vi.fn();
    const setExampleFilterActive = vi.fn();
    const step = buildMainTourSteps({ ...context, setFiltersOpen, setExampleFilterActive }).find(
      (candidate) => candidate.id === "adr-filter-example"
    );

    step?.onEnter?.();
    step?.onExit?.();

    expect(setFiltersOpen.mock.calls).toEqual([[true], [false]]);
    expect(setExampleFilterActive.mock.calls).toEqual([[true], [false]]);
  });

  test("editor steps have unique ids, include version and field visibility, and have valid data-tour targets", () => {
    const steps = buildEditorTourSteps();
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
    expect(steps.some((s) => s.id === "template-version")).toBe(true);
    expect(steps.some((s) => s.id === "field-visibility")).toBe(true);
    for (const step of steps) {
      if (step.target) {
        expect(step.target).toMatch(/^\[data-tour='[a-z-]+'\]$/);
      }
    }
  });
});
