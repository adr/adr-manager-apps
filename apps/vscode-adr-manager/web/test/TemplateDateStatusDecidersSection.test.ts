// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TemplateDateStatusDecidersSection from "../components/TemplateDateStatusDecidersSection.vue";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldVisibility } from "@adr-manager/core";

function fv(overrides: Partial<FieldVisibility> = {}): FieldVisibility {
  return { ...DEFAULT_FIELD_VISIBILITY, ...overrides };
}

const BASE_PROPS = {
  date: "",
  status: "",
  deciders: "",
  decisionMakers: "",
  consulted: "",
  informed: ""
};

describe("TemplateDateStatusDecidersSection", () => {
  describe("MADR 2.1.2 — default visibility", () => {
    it("shows Date, Status and Deciders when all fields are visible", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"2.1.2", fieldVisibility: fv() }
      });
      expect(wrapper.find("input[type=date]").exists()).toBe(true);
      expect(wrapper.find("select").exists()).toBe(true);
      expect(wrapper.text()).toContain("Deciders");
    });

    it("never shows Consulted, Informed or Decision makers in 2.1.2", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"2.1.2", fieldVisibility: fv() }
      });
      expect(wrapper.text()).not.toContain("Consulted");
      expect(wrapper.text()).not.toContain("Informed");
      expect(wrapper.text()).not.toContain("Decision makers");
    });
  });

  describe("MADR 2.1.2 — individual toggles", () => {
    it("regression: turning Deciders off does not reveal Consulted or Informed", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"2.1.2", fieldVisibility: fv({ deciders: false }) }
      });
      expect(wrapper.text()).not.toContain("Deciders");
      expect(wrapper.text()).not.toContain("Consulted");
      expect(wrapper.text()).not.toContain("Informed");
      expect(wrapper.text()).not.toContain("Decision-makers");
    });

    it("hides Date when fieldVisibility.date is false", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"2.1.2", fieldVisibility: fv({ date: false }) }
      });
      expect(wrapper.find("input[type=date]").exists()).toBe(false);
      expect(wrapper.text()).toContain("Status");
      expect(wrapper.text()).toContain("Deciders");
    });

    it("hides Status when fieldVisibility.status is false", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"2.1.2", fieldVisibility: fv({ status: false }) }
      });
      expect(wrapper.find("select").exists()).toBe(false);
      expect(wrapper.find("input[type=date]").exists()).toBe(true);
      expect(wrapper.text()).toContain("Deciders");
    });
  });

  describe("MADR 4.0.0 — default visibility", () => {
    it("shows Decisionmakers, Consulted and Informed by default", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"4.0.0", fieldVisibility: fv() }
      });
      expect(wrapper.text()).toContain("Decision-makers");
      expect(wrapper.text()).toContain("Consulted");
      expect(wrapper.text()).toContain("Informed");
    });

    it("does not show the 2.1.2 Deciders label in 4.0.0", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"4.0.0", fieldVisibility: fv() }
      });
      const labelTexts = wrapper.findAll(".meta-field label").map((l) => l.text());
      expect(labelTexts.some((t) => t.startsWith("Deciders"))).toBe(false);
    });
  });

  describe("MADR 4.0.0 — individual toggles", () => {
    it("turning Deciders off hides Decision makers but keeps Consulted and Informed", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"4.0.0", fieldVisibility: fv({ deciders: false }) }
      });
      expect(wrapper.text()).not.toContain("Decision-makers");
      expect(wrapper.text()).toContain("Consulted");
      expect(wrapper.text()).toContain("Informed");
    });

    it("turning Consulted off hides only Consulted, leaving Informed and Decisionmakers visible", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"4.0.0", fieldVisibility: fv({ consulted: false }) }
      });
      expect(wrapper.text()).not.toContain("Consulted");
      expect(wrapper.text()).toContain("Informed");
      expect(wrapper.text()).toContain("Decision-makers");
    });

    it("turning Informed off hides only Informed, leaving Consulted and Decision makers visible", () => {
      const wrapper = mount(TemplateDateStatusDecidersSection, {
        props: { ...BASE_PROPS, templateVersion:"4.0.0", fieldVisibility: fv({ informed: false }) }
      });
      expect(wrapper.text()).not.toContain("Informed");
      expect(wrapper.text()).toContain("Consulted");
      expect(wrapper.text()).toContain("Decision-makers");
    });
  });
});
