// @vitest-environment jsdom
/**
 * Tests for field-visibility persistence in the save-adr mixin.
 *
 * The mixin is responsible for:
 *   1. Requesting the saved field-visibility from the extension host on mount.
 *   2. Applying the response so the webview reflects the persisted state.
 *   3. NOT resetting field-visibility when a new ADR's data arrives via
 *      "fetchAdrValues" (which only updates the ADR content, not the panel settings).
 *   4. Sending an "updateFieldVisibility" message (with the full updated map) when
 *      the user toggles a field.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldVisibility } from "@adr-manager/core";
import saveAdrMixin from "../mixins/save-adr";
import vscodeApiMixin from "../mixins/vscode-api-mixin";
import { makeAdrPayload } from "./helpers/adr-payload";

// ── mock VS Code API ──────────────────────────────────────────────────────────
const postMessage = vi.fn();
vi.stubGlobal("vscode", { postMessage });

// ── minimal host component that uses both mixins ──────────────────────────────
const TestComponent = defineComponent({
  mixins: [vscodeApiMixin, saveAdrMixin],
  template: "<div></div>"
});

// ── helpers ───────────────────────────────────────────────────────────────────
function fv(overrides: Partial<FieldVisibility> = {}): FieldVisibility {
  return { ...DEFAULT_FIELD_VISIBILITY, ...overrides };
}

/** Dispatch a message that looks like it came from the extension host */
function dispatchExtensionMessage(data: Record<string, unknown>) {
  window.dispatchEvent(new MessageEvent("message", { data }));
}

// ── tests ─────────────────────────────────────────────────────────────────────
describe("save-adr mixin – field visibility persistence", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    postMessage.mockClear();
    wrapper = mount(TestComponent);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  // ── mount behaviour ─────────────────────────────────────────────────────────
  describe("on mount", () => {
    it("requests the persisted field visibility from the extension host", () => {
      expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ command: "getFieldVisibility" }));
    });

    it("initialises fieldVisibility to all-true defaults before the response arrives", () => {
      const vm = wrapper.vm as any;
      expect(vm.fieldVisibility).toEqual(DEFAULT_FIELD_VISIBILITY);
    });

    it("removes the extension message listener on unmount", () => {
      const addListener = vi.spyOn(window, "addEventListener");
      const removeListener = vi.spyOn(window, "removeEventListener");
      const isolated = mount(TestComponent);

      const messageHandler = addListener.mock.calls.find(([event]) => event === "message")?.[1];
      expect(messageHandler).toBeTypeOf("function");

      isolated.unmount();
      expect(removeListener).toHaveBeenCalledWith("message", messageHandler);

      addListener.mockRestore();
      removeListener.mockRestore();
    });
  });

  // ── synchronous initialisation from embedded HTML variable ──────────────────
  describe("__INITIAL_FIELD_VISIBILITY__ embedded in webview HTML", () => {
    it("applies the embedded value synchronously — no message needed", () => {
      (global as any).__INITIAL_FIELD_VISIBILITY__ = fv({ date: false, status: false });
      const w = mount(TestComponent);
      expect((w.vm as any).fieldVisibility.date).toBe(false);
      expect((w.vm as any).fieldVisibility.status).toBe(false);
      expect((w.vm as any).fieldVisibility.deciders).toBe(true);
      w.unmount();
      delete (global as any).__INITIAL_FIELD_VISIBILITY__;
    });

    it("does not apply when __INITIAL_FIELD_VISIBILITY__ is null", () => {
      (global as any).__INITIAL_FIELD_VISIBILITY__ = null;
      const w = mount(TestComponent);
      expect((w.vm as any).fieldVisibility).toEqual(DEFAULT_FIELD_VISIBILITY);
      w.unmount();
      delete (global as any).__INITIAL_FIELD_VISIBILITY__;
    });

    it("a subsequent fieldVisibility message still overrides the embedded value", async () => {
      (global as any).__INITIAL_FIELD_VISIBILITY__ = fv({ date: false });
      const w = mount(TestComponent);
      expect((w.vm as any).fieldVisibility.date).toBe(false);

      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ status: false }) });
      await w.vm.$nextTick();

      // The message winner: date is now true again, status is false
      expect((w.vm as any).fieldVisibility.date).toBe(true);
      expect((w.vm as any).fieldVisibility.status).toBe(false);
      w.unmount();
      delete (global as any).__INITIAL_FIELD_VISIBILITY__;
    });
  });

  // ── receiving the persisted value ───────────────────────────────────────────
  describe("fieldVisibility message from extension", () => {
    it("applies the received fieldVisibility to component state", async () => {
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ status: false }) });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).fieldVisibility.status).toBe(false);
    });

    it("marks all other keys as true when only one is overridden", async () => {
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();
      const fvState = (wrapper.vm as any).fieldVisibility;
      expect(fvState.date).toBe(false);
      expect(fvState.status).toBe(true);
      expect(fvState.deciders).toBe(true);
    });
  });

  // ── switching ADRs ──────────────────────────────────────────────────────────
  describe("fetchAdrValues does NOT reset fieldVisibility", () => {
    it("preserves fieldVisibility after a new ADR's data arrives", async () => {
      // Extension pushes saved visibility (status hidden)
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ status: false }) });
      await wrapper.vm.$nextTick();

      // Extension sends a new ADR's content (simulates switching to ADR B)
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ title: "ADR B" }) });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).fieldVisibility.status).toBe(false);
    });

    it("updates the ADR title without touching fieldVisibility", async () => {
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ links: false }) });
      await wrapper.vm.$nextTick();

      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ title: "New Title" }) });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).title).toBe("New Title");
      expect((wrapper.vm as any).fieldVisibility.links).toBe(false);
    });

    it("applies the proactive fieldVisibility push that follows fetchAdrValues", async () => {
      // Initial default state
      expect((wrapper.vm as any).fieldVisibility.date).toBe(true);

      // Extension sends ADR data first …
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ title: "ADR B" }) });
      await wrapper.vm.$nextTick();

      // … then immediately pushes the saved visibility (as WebPanel.ts now does)
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).fieldVisibility.date).toBe(false);
    });
  });

  // ── user toggling a field ───────────────────────────────────────────────────
  describe("setFieldVisibility", () => {
    it("sends updateFieldVisibility with the new value for the toggled key", () => {
      postMessage.mockClear();
      (wrapper.vm as any).setFieldVisibility("status", false);
      const call = postMessage.mock.calls.find((c: any[]) => c[0]?.command === "updateFieldVisibility");
      expect(call).toBeDefined();
      expect(call![0].data.status).toBe(false);
    });

    it("sends the full fieldVisibility map, not just the changed key", () => {
      postMessage.mockClear();
      (wrapper.vm as any).setFieldVisibility("deciders", false);
      const call = postMessage.mock.calls.find((c: any[]) => c[0]?.command === "updateFieldVisibility");
      const data: FieldVisibility = call![0].data;
      // All other keys remain true
      expect(data.date).toBe(true);
      expect(data.status).toBe(true);
      expect(data.deciders).toBe(false);
      expect(data.links).toBe(true);
    });

    it("updates the local fieldVisibility state immediately", () => {
      (wrapper.vm as any).setFieldVisibility("links", false);
      expect((wrapper.vm as any).fieldVisibility.links).toBe(false);
    });

    it("round-trips: toggle off then on restores all-true", () => {
      (wrapper.vm as any).setFieldVisibility("date", false);
      expect((wrapper.vm as any).fieldVisibility.date).toBe(false);
      (wrapper.vm as any).setFieldVisibility("date", true);
      expect((wrapper.vm as any).fieldVisibility.date).toBe(true);
    });
  });

  describe("relevantFiles in _filteredProfessionalPayload", () => {
    it("passes linked files through (without empties) when the field is visible", () => {
      const vm = wrapper.vm as any;
      vm.relevantFiles = ["src/a.ts", "", "src/b.ts"];
      const payload = vm._filteredProfessionalPayload();
      expect(payload.relevantFiles).toEqual(["src/a.ts", "src/b.ts"]);
    });

    it("clears linked files in the payload when the field is hidden, keeping local state", () => {
      const vm = wrapper.vm as any;
      vm.relevantFiles = ["src/a.ts"];
      vm.fieldVisibility = fv({ relevantFiles: false });
      const payload = vm._filteredProfessionalPayload();
      expect(payload.relevantFiles).toEqual([]);
      expect(vm.relevantFiles).toEqual(["src/a.ts"]);
    });
  });

  // ── full ADR-switch simulation ──────────────────────────────────────────────
  describe("full ADR-switch scenario", () => {
    it("retains visibility after: set → fetchAdrValues → proactive push sequence", async () => {
      // 1. User toggles status off in ADR A
      (wrapper.vm as any).setFieldVisibility("status", false);

      // 2. Navigate to ADR B: extension sends new ADR content
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ title: "ADR B" }) });
      await wrapper.vm.$nextTick();

      // 3. Extension proactively pushes the saved visibility (the fix)
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ status: false }) });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).fieldVisibility.status).toBe(false);
      // Other keys unaffected
      expect((wrapper.vm as any).fieldVisibility.date).toBe(true);
    });
  });
});
