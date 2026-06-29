// @vitest-environment jsdom
/**
 * Tag preservation when switching between Basic and Professional editor modes.
 *
 * The bug (fixed): every switchXxx() method serialised all ADR fields into the hand-off
 * payload except `tags`, so the destination view always started with an empty tag list.
 * The cases below run the same checks against each view and switch direction.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import AddBasicView from "../views/AddBasicView.vue";
import AddProfessionalView from "../views/AddProfessionalView.vue";
import ViewBasicView from "../views/ViewBasicView.vue";
import ViewProfessionalView from "../views/ViewProfessionalView.vue";
import type { Component } from "vue";
import type { Tag } from "@adr-manager/core";

// ── VS Code API mock ──────────────────────────────────────────────────────────
const postMessage = vi.fn();
vi.stubGlobal("vscode", { postMessage });

// ── Child component stubs (avoid rendering complex sub-trees) ─────────────────
const stubs = {
  MadrTemplateBasic: { template: "<div></div>" },
  MadrTemplateProfessional: { template: "<div></div>" },
  AdrTagSection: { template: "<div></div>", props: ["tags", "recentTags"] },
  TourOverlay: { template: "<div></div>", props: ["active", "steps"] },
  VersionSelect: {
    template: "<div></div>",
    props: ["modelValue"],
    emits: ["update:modelValue"]
  },
  FieldVisibilityPanel: {
    template: "<div></div>",
    props: ["templateVersion", "fieldVisibility"]
  }
};

// ── Fixtures ──────────────────────────────────────────────────────────────────
const TAG_FRONTEND: Tag = { id: "a1", label: "frontend", color: "#6366f1" };
const TAG_BACKEND: Tag = { id: "b2", label: "backend", color: "#22c55e" };
const TAG_INFRA: Tag = { id: "c3", label: "infra", color: "#f59e0b" };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the parsed payload sent with a specific command, or throw if not found. */
function getSwitchPayload(command: string): Record<string, unknown> {
  const call = postMessage.mock.calls.find((c: unknown[]) => (c[0] as { command: string }).command === command);
  if (!call) throw new Error(`No postMessage call found for command "${command}"`);
  return JSON.parse(call[0].data as string);
}

/** Dispatch a simulated extension-host message into the webview. */
function dispatchExtensionMessage(data: Record<string, unknown>) {
  window.dispatchEvent(new MessageEvent("message", { data }));
}

// ── Cases: one row per view + switch direction ──────────────────────────────────
type SwitchMethod = "switchToProfessionalTemplate" | "switchToBasicTemplate";
const cases: { name: string; View: Component; method: SwitchMethod; command: string }[] = [
  {
    name: "AddBasicView → switchToProfessionalTemplate",
    View: AddBasicView,
    method: "switchToProfessionalTemplate",
    command: "switchAddViewBasicToProfessional"
  },
  {
    name: "AddProfessionalView → switchToBasicTemplate",
    View: AddProfessionalView,
    method: "switchToBasicTemplate",
    command: "switchAddViewProfessionalToBasic"
  },
  {
    name: "ViewBasicView → switchToProfessionalTemplate",
    View: ViewBasicView,
    method: "switchToProfessionalTemplate",
    command: "switchViewingViewBasicToProfessional"
  },
  {
    name: "ViewProfessionalView → switchToBasicTemplate",
    View: ViewProfessionalView,
    method: "switchToBasicTemplate",
    command: "switchViewingViewProfessionalToBasic"
  }
];

// ── Test suite ────────────────────────────────────────────────────────────────

describe("mode-switch tag preservation", () => {
  cases.forEach(({ name, View, method, command }) => {
    describe(name, () => {
      let wrapper: ReturnType<typeof mount>;

      beforeEach(() => {
        wrapper = mount(View, { global: { stubs } });
        postMessage.mockClear(); // discard mount-time getFieldVisibility / getRecentTags
      });

      afterEach(() => {
        wrapper.unmount();
      });

      it("includes a tags field in the switch payload", () => {
        (wrapper.vm as any).tags = [TAG_FRONTEND];
        (wrapper.vm as any)[method]();
        expect(getSwitchPayload(command)).toHaveProperty("tags");
      });

      it("sends all assigned tags in the payload", () => {
        (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_BACKEND];
        (wrapper.vm as any)[method]();
        expect((getSwitchPayload(command) as { tags: Tag[] }).tags).toEqual([TAG_FRONTEND, TAG_BACKEND]);
      });

      it("preserves each tag's color exactly", () => {
        (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_INFRA];
        (wrapper.vm as any)[method]();
        const { tags } = getSwitchPayload(command) as { tags: Tag[] };
        expect(tags[0].color).toBe(TAG_FRONTEND.color);
        expect(tags[1].color).toBe(TAG_INFRA.color);
      });

      it("sends an empty array when no tags are assigned", () => {
        (wrapper.vm as any).tags = [];
        (wrapper.vm as any)[method]();
        expect((getSwitchPayload(command) as { tags: Tag[] }).tags).toEqual([]);
      });

      it("sends tags as plain objects so structured-clone can serialise them", () => {
        (wrapper.vm as any).tags = [TAG_FRONTEND];
        (wrapper.vm as any)[method]();
        const { tags } = getSwitchPayload(command) as { tags: Tag[] };
        expect(Object.keys(tags[0]).sort()).toEqual(["color", "id", "label"]);
      });

      it("round-trip: payload tags survive fetchAdrValues and restore on the vm", async () => {
        (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_BACKEND];
        (wrapper.vm as any)[method]();
        const payload = getSwitchPayload(command);

        // Simulate WebPanel echoing the payload back as fetchAdrValues
        dispatchExtensionMessage({ command: "fetchAdrValues", adr: JSON.stringify(payload) });
        await wrapper.vm.$nextTick();

        expect((wrapper.vm as any).tags).toEqual([TAG_FRONTEND, TAG_BACKEND]);
      });
    });
  });
});
