// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TemplateRelevantFilesSection from "../components/TemplateRelevantFilesSection.vue";

function mountSection(relevantFilesProp: string[] = [], statusProp: Record<string, boolean> = {}) {
  return mount(TemplateRelevantFilesSection, { props: { relevantFilesProp, statusProp } });
}

describe("TemplateRelevantFilesSection", () => {
  it("renders one row per linked file", () => {
    const wrapper = mountSection(["src/a.ts", "src/b.ts"]);
    const rows = wrapper.findAll("[data-testid=relevantFileRow]");
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text()).toContain("src/a.ts");
    expect(rows[1]!.text()).toContain("src/b.ts");
  });

  it("shows a hint instead of rows when no files are linked", () => {
    const wrapper = mountSection([]);
    expect(wrapper.find("[data-testid=relevantFileRow]").exists()).toBe(false);
    expect(wrapper.text()).toContain("No files linked yet.");
  });

  it("warns only for files known to be missing, not for unchecked ones", () => {
    const wrapper = mountSection(["src/gone.ts", "src/here.ts", "src/unknown.ts"], {
      "src/gone.ts": false,
      "src/here.ts": true
    });
    const rows = wrapper.findAll("[data-testid=relevantFileRow]");
    expect(rows[0]!.find("[data-testid=relevantFileMissing]").exists()).toBe(true);
    expect(rows[1]!.find("[data-testid=relevantFileMissing]").exists()).toBe(false);
    expect(rows[2]!.find("[data-testid=relevantFileMissing]").exists()).toBe(false);
  });

  it("emits open with the path when a file is clicked", async () => {
    const wrapper = mountSection(["src/a.ts", "src/b.ts"]);
    await wrapper.findAll("[data-testid=relevantFileLink]")[1]!.trigger("click");
    expect(wrapper.emitted("open")).toEqual([["src/b.ts"]]);
  });

  it("emits remove with the index when the trash button is clicked", async () => {
    const wrapper = mountSection(["src/a.ts", "src/b.ts"]);
    await wrapper.findAll("[data-testid=relevantFileRemove]")[1]!.trigger("click");
    expect(wrapper.emitted("remove")).toEqual([[1]]);
  });

  it("emits pick when the add button is clicked", async () => {
    const wrapper = mountSection([]);
    await wrapper.find("[data-testid=relevantFilesPick]").trigger("click");
    expect(wrapper.emitted("pick")).toHaveLength(1);
  });
});
