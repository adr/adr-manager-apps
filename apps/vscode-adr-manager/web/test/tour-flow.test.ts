// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { buildDemoAdrEntries } from "../tour/demo-adrs";
import { buildEditorTourSteps } from "../tour/editor-steps";
import { getDemoAdrPath } from "../../src/tour";
import MainView from "../views/MainView.vue";
import ViewProfessionalView from "../views/ViewProfessionalView.vue";

const postMessage = vi.fn();
vi.stubGlobal("vscode", { postMessage });

const stubs = {
  ADRContainer: { template: "<article></article>" },
  TourOverlay: { template: "<div></div>" }
};

describe("MainView tour completion", () => {
  let wrapper: ReturnType<typeof mount>;
  let mountMessages: unknown[];

  beforeEach(() => {
    postMessage.mockClear();
    wrapper = mount(MainView, { global: { stubs } });
    mountMessages = postMessage.mock.calls.map(([message]) => message);
    postMessage.mockClear();
    (wrapper.vm as any).demoMode = true;
    (wrapper.vm as any).demoAdrs = buildDemoAdrEntries("example-project", "docs/decisions");
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it("requests the state for the main tour explicitly", () => {
    expect(mountMessages).toContainEqual({ command: "getTourState", data: { kind: "main" } });
  });

  it("exposes tag filters for the demo entries", () => {
    expect((wrapper.vm as any).hasFilters).toBe(true);
    expect((wrapper.vm as any).availableTags.map((tag: { label: string }) => tag.label)).toEqual([
      "architecture",
      "documentation",
      "data"
    ]);
  });

  it("filters demo entries by tag", () => {
    (wrapper.vm as any).filterTagIds = ["data"];

    expect((wrapper.vm as any).filteredDisplayedAdrs.map((entry: any) => entry.adr.title)).toEqual([
      "Choose Database for User Data"
    ]);
  });

  it("temporarily applies and then removes one tour filter", () => {
    (wrapper.vm as any).setExampleFilterActive(true);

    expect((wrapper.vm as any).filterStatuses).toEqual(["accepted"]);
    expect((wrapper.vm as any).filteredDisplayedAdrs.map((entry: any) => entry.adr.title)).toEqual([
      "Use Markdown Architectural Decision Records"
    ]);

    (wrapper.vm as any).setExampleFilterActive(false);

    expect((wrapper.vm as any).filterStatuses).toEqual([]);
    expect((wrapper.vm as any).filteredDisplayedAdrs).toHaveLength(2);
  });

  it("preserves filters that were active before the tour demonstration", () => {
    (wrapper.vm as any).filterStatuses = ["accepted"];

    (wrapper.vm as any).setExampleFilterActive(true);
    expect((wrapper.vm as any).filterStatuses).toEqual(["accepted", "proposed"]);

    (wrapper.vm as any).setExampleFilterActive(false);
    expect((wrapper.vm as any).filterStatuses).toEqual(["accepted"]);
  });

  it("clears demo state before opening the demo editor after finishing", () => {
    (wrapper.vm as any).afterTourClosed("finished");

    expect((wrapper.vm as any).demoMode).toBe(false);
    expect((wrapper.vm as any).demoAdrs).toEqual([]);
    expect(postMessage).toHaveBeenCalledWith({ command: "viewDemo", data: undefined });
  });

  it.each(["skipped", "declined"] as const)("clears demo state without opening the editor when %s", (reason) => {
    (wrapper.vm as any).afterTourClosed(reason);

    expect((wrapper.vm as any).demoMode).toBe(false);
    expect((wrapper.vm as any).demoAdrs).toEqual([]);
    expect(postMessage).not.toHaveBeenCalledWith({ command: "viewDemo", data: undefined });
  });
});

describe("editor tour completion", () => {
  const editorStubs = {
    MadrTemplateProfessional: true,
    AdrTagSection: true,
    TourOverlay: { template: "<div></div>" },
    VersionSelect: true,
    FieldVisibilityPanel: true,
    HiddenFieldsConvertDialog: true
  };

  beforeEach(() => {
    postMessage.mockClear();
  });

  it("returns to the overview when the demo ADR's tour closes", () => {
    const wrapper = mount(ViewProfessionalView, { global: { stubs: editorStubs } });
    (wrapper.vm as any).fullPath = getDemoAdrPath("0000-use-markdown-architectural-decision-records.md");
    postMessage.mockClear();

    (wrapper.vm as any).onTourClosed("finished");

    expect(postMessage).toHaveBeenCalledWith({ command: "main", data: undefined });
    wrapper.unmount();
  });

  it("stays in the editor when a real ADR's tour closes", () => {
    const wrapper = mount(ViewProfessionalView, { global: { stubs: editorStubs } });
    (wrapper.vm as any).fullPath = "/workspace/docs/decisions/0001-real-decision.md";
    postMessage.mockClear();

    (wrapper.vm as any).onTourClosed("finished");

    expect(postMessage).not.toHaveBeenCalledWith({ command: "main", data: undefined });
    wrapper.unmount();
  });
});

describe("editor tour template version step", () => {
  it("opens and closes the template version menu", () => {
    const wrap = document.createElement("div");
    wrap.dataset["tour"] = "template-version";
    const button = document.createElement("button");
    button.className = "verselect-btn";
    button.setAttribute("aria-expanded", "false");
    wrap.addEventListener("tour-version-menu", (event) => {
      const open = (event as CustomEvent<boolean>).detail;
      wrap.querySelector(".menu")?.remove();
      if (open) {
        const nextMenu = document.createElement("div");
        nextMenu.className = "menu";
        wrap.append(nextMenu);
        button.setAttribute("aria-expanded", "true");
      } else {
        button.setAttribute("aria-expanded", "false");
      }
    });
    wrap.append(button);
    document.body.append(wrap);

    const step = buildEditorTourSteps().find((candidate) => candidate.id === "template-version");
    step?.onEnter?.();
    expect(button.getAttribute("aria-expanded")).toBe("true");

    step?.onExit?.();
    expect(button.getAttribute("aria-expanded")).toBe("false");

    wrap.remove();
  });
});
