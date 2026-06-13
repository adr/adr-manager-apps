// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mount, type DOMWrapper } from "@vue/test-utils";
import FieldVisibilityPanel from "../components/FieldVisibilityPanel.vue";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldVisibility } from "@adr-manager/core";

function fv(overrides: Partial<FieldVisibility> = {}): FieldVisibility {
  return { ...DEFAULT_FIELD_VISIBILITY, ...overrides };
}

function findToggleFor(wrapper: ReturnType<typeof mount>, label: string): DOMWrapper<HTMLInputElement> {
  return wrapper.find<HTMLInputElement>(`input[aria-label="Show ${label}"]`);
}

describe("FieldVisibilityPanel", () => {
  describe("panel open/close", () => {
    it("is closed by default", () => {
      const wrapper = mount(FieldVisibilityPanel, {
        props: { templateVersion: "2.1.2", fieldVisibility: fv() }
      });
      expect(wrapper.find("[data-cy=field-visibility-panel]").exists()).toBe(false);
      expect(wrapper.find("[data-cy=field-visibility-toggle]").attributes("aria-expanded")).toBe("false");
    });

    it("opens when the Fields button is clicked", async () => {
      const wrapper = mount(FieldVisibilityPanel, {
        props: { templateVersion: "2.1.2", fieldVisibility: fv() }
      });
      await wrapper.find("[data-cy=field-visibility-toggle]").trigger("click");
      expect(wrapper.find("[data-cy=field-visibility-panel]").exists()).toBe(true);
      expect(wrapper.find("[data-cy=field-visibility-toggle]").attributes("aria-expanded")).toBe("true");
    });

    it("closes when the Fields button is clicked a second time", async () => {
      const wrapper = mount(FieldVisibilityPanel, {
        props: { templateVersion: "2.1.2", fieldVisibility: fv() }
      });
      await wrapper.find("[data-cy=field-visibility-toggle]").trigger("click");
      await wrapper.find("[data-cy=field-visibility-toggle]").trigger("click");
      expect(wrapper.find("[data-cy=field-visibility-panel]").exists()).toBe(false);
      expect(wrapper.find("[data-cy=field-visibility-toggle]").attributes("aria-expanded")).toBe("false");
    });
  });

  describe("MADR 2.1.2 field list", () => {
    it("shows only the 2.1.2 field set", async () => {
      const wrapper = mount(FieldVisibilityPanel, {
        props: { templateVersion: "2.1.2", fieldVisibility: fv() }
      });
      await wrapper.find("[data-cy=field-visibility-toggle]").trigger("click");
      const labels = wrapper.findAll(".fvp-label").map((l) => l.text());
      expect(labels).toContain("Deciders");
      expect(labels).toContain("Technical Story");
      expect(labels).toContain("Links");
      expect(labels).not.toContain("Consulted");
      expect(labels).not.toContain("Informed");
      expect(labels).not.toContain("Consequences");
      expect(labels).not.toContain("Confirmation");
    });
  });

  describe("MADR 4.0.0 field list", () => {
    it("shows only the 4.0.0 field set", async () => {
      const wrapper = mount(FieldVisibilityPanel, {
        props: { templateVersion: "4.0.0", fieldVisibility: fv() }
      });
      await wrapper.find("[data-cy=field-visibility-toggle]").trigger("click");
      const labels = wrapper.findAll(".fvp-label").map((l) => l.text());
      expect(labels).toContain("Consulted");
      expect(labels).toContain("Informed");
      expect(labels).toContain("Consequences");
      expect(labels).toContain("Confirmation");
      expect(labels).not.toContain("Technical Story");
      expect(labels).not.toContain("Links");
    });
  });

  describe("toggle emits", () => {
    it("emits setFieldVisibility(key, false) when a visible field is toggled off", async () => {
      const wrapper = mount(FieldVisibilityPanel, {
        props: { templateVersion: "2.1.2", fieldVisibility: fv() }
      });
      await wrapper.find("[data-cy=field-visibility-toggle]").trigger("click");
      const checkbox = findToggleFor(wrapper, "Deciders");
      (checkbox.element as HTMLInputElement).checked = false;
      await checkbox.trigger("change");
      expect(wrapper.emitted("setFieldVisibility")?.[0]).toEqual(["deciders", false]);
    });

    it("emits setFieldVisibility(key, true) when a hidden field is toggled on", async () => {
      const wrapper = mount(FieldVisibilityPanel, {
        props: { templateVersion: "2.1.2", fieldVisibility: fv({ deciders: false }) }
      });
      await wrapper.find("[data-cy=field-visibility-toggle]").trigger("click");
      const checkbox = findToggleFor(wrapper, "Deciders");
      (checkbox.element as HTMLInputElement).checked = true;
      await checkbox.trigger("change");
      expect(wrapper.emitted("setFieldVisibility")?.[0]).toEqual(["deciders", true]);
    });

    it("renders the checkbox unchecked when the field is hidden in the prop", async () => {
      const wrapper = mount(FieldVisibilityPanel, {
        props: { templateVersion: "2.1.2", fieldVisibility: fv({ deciders: false }) }
      });
      await wrapper.find("[data-cy=field-visibility-toggle]").trigger("click");
      const checkbox = findToggleFor(wrapper, "Deciders");
      expect((checkbox.element as HTMLInputElement).checked).toBe(false);
    });

    it("renders the checkbox checked when the field is visible in the prop", async () => {
      const wrapper = mount(FieldVisibilityPanel, {
        props: { templateVersion: "2.1.2", fieldVisibility: fv() }
      });
      await wrapper.find("[data-cy=field-visibility-toggle]").trigger("click");
      const checkbox = findToggleFor(wrapper, "Deciders");
      expect((checkbox.element as HTMLInputElement).checked).toBe(true);
    });
  });
});
