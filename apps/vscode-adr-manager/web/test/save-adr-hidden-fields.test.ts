// @vitest-environment jsdom
/**
 * Tests for the hidden-fields dialog logic in the save-adr mixin.
 *
 * The mixin is responsible for:
 *   1. Detecting hidden fields that contain data when fieldVisibility is received
 *      after an ADR is loaded (sets hiddenFieldsCauseConversion).
 *   2. openWithFieldsVisible() — dismisses dialog, enables temporary full visibility,
 *      and records which fields were highlighted.
 *   3. openWithFieldsHidden() — dismisses dialog without altering field data,
 *      preserving hidden field values for a non-destructive save.
 *   4. effectiveFieldVisibility — all-true when in temporary mode, else persisted map.
 *   5. setFieldVisibility() — exits temporary mode and clears highlighted fields.
 *   6. saveAdr() — always sends ALL field values regardless of visibility so hidden
 *      fields are not lost when the file is written.
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

// ── minimal host component ────────────────────────────────────────────────────
const TestComponent = defineComponent({
  mixins: [vscodeApiMixin, saveAdrMixin],
  template: "<div></div>"
});

// ── helpers ───────────────────────────────────────────────────────────────────
function fv(overrides: Partial<FieldVisibility> = {}): FieldVisibility {
  return { ...DEFAULT_FIELD_VISIBILITY, ...overrides };
}

function dispatchExtensionMessage(data: Record<string, unknown>) {
  window.dispatchEvent(new MessageEvent("message", { data }));
}

function getSaveAdrPayload(vm: any): any {
  vm.saveAdr();
  const call = postMessage.mock.calls.find((c: unknown[]) => (c[0] as any).command === "saveAdr");
  return JSON.parse((call![0] as any).data).adr;
}

// ── tests ─────────────────────────────────────────────────────────────────────
describe("save-adr mixin – hidden-fields dialog", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    postMessage.mockClear();
    wrapper = mount(TestComponent);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  // ── initial state ──────────────────────────────────────────────────────────
  describe("initial state", () => {
    it("hiddenFieldsCauseConversion starts false", () => {
      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(false);
    });

    it("temporarilyShowAllFields starts false", () => {
      expect((wrapper.vm as any).temporarilyShowAllFields).toBe(false);
    });

    it("highlightedFields starts empty", () => {
      expect((wrapper.vm as any).highlightedFields.size).toBe(0);
    });
  });

  // ── _checkHiddenFields via fieldVisibility message ─────────────────────────
  describe("hidden-fields detection", () => {
    it("sets hiddenFieldsCauseConversion when a hidden field has data", async () => {
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ date: "2024-06-10" }) });
      await wrapper.vm.$nextTick();

      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(true);
    });

    it("does NOT set hiddenFieldsCauseConversion when the hidden field is empty", async () => {
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ date: "" }) });
      await wrapper.vm.$nextTick();

      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(false);
    });

    it("does NOT fire when no ADR is loaded yet (fullPath is empty)", async () => {
      // No fetchAdrValues → fullPath stays ""
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(false);
    });

    it("detects a hidden technicalStory with data", async () => {
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ technicalStory: "JIRA-1234" })
      });
      await wrapper.vm.$nextTick();

      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ technicalStory: false }) });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(true);
    });

    it("resets hiddenFieldsCauseConversion when a subsequent visibility change has no hidden data", async () => {
      // First trigger the dialog
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ date: "2024-01-01" }) });
      await wrapper.vm.$nextTick();
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(true);

      // User turns date back on → no hidden data with data → no dialog
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv() });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(false);
    });
  });

  // ── openWithFieldsVisible ──────────────────────────────────────────────────
  describe("openWithFieldsVisible", () => {
    beforeEach(async () => {
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ date: "2024-06-10" }) });
      await wrapper.vm.$nextTick();
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(true);
    });

    it("dismisses the dialog", () => {
      (wrapper.vm as any).openWithFieldsVisible();
      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(false);
    });

    it("sets temporarilyShowAllFields to true", () => {
      (wrapper.vm as any).openWithFieldsVisible();
      expect((wrapper.vm as any).temporarilyShowAllFields).toBe(true);
    });

    it("adds the hidden field to highlightedFields", () => {
      (wrapper.vm as any).openWithFieldsVisible();
      expect((wrapper.vm as any).highlightedFields.has("date")).toBe(true);
    });

    it("does not highlight visible fields that have no data", () => {
      (wrapper.vm as any).openWithFieldsVisible();
      expect((wrapper.vm as any).highlightedFields.has("status")).toBe(false);
    });

    it("does not highlight visible fields that are not hidden", () => {
      (wrapper.vm as any).openWithFieldsVisible();
      // deciders is visible (not in the fv override) so should not be highlighted
      expect((wrapper.vm as any).highlightedFields.has("deciders")).toBe(false);
    });
  });

  // ── openWithFieldsHidden ───────────────────────────────────────────────────
  describe("openWithFieldsHidden", () => {
    beforeEach(async () => {
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ date: "2024-06-10" }) });
      await wrapper.vm.$nextTick();
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(true);
    });

    it("dismisses the dialog", () => {
      (wrapper.vm as any).openWithFieldsHidden();
      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(false);
    });

    it("does not enable temporary full visibility", () => {
      (wrapper.vm as any).openWithFieldsHidden();
      expect((wrapper.vm as any).temporarilyShowAllFields).toBe(false);
    });

    it("leaves highlightedFields empty", () => {
      (wrapper.vm as any).openWithFieldsHidden();
      expect((wrapper.vm as any).highlightedFields.size).toBe(0);
    });

    it("preserves the hidden field value in mixin state", () => {
      (wrapper.vm as any).openWithFieldsHidden();
      expect((wrapper.vm as any).date).toBe("2024-06-10");
    });
  });

  // ── effectiveFieldVisibility ───────────────────────────────────────────────
  describe("effectiveFieldVisibility", () => {
    it("reflects persisted visibility when not in temporary mode", () => {
      (wrapper.vm as any).fieldVisibility = fv({ date: false });
      expect((wrapper.vm as any).effectiveFieldVisibility.date).toBe(false);
    });

    it("overrides to all-true when temporarilyShowAllFields is set", () => {
      (wrapper.vm as any).fieldVisibility = fv({ date: false, technicalStory: false });
      (wrapper.vm as any).temporarilyShowAllFields = true;
      expect((wrapper.vm as any).effectiveFieldVisibility.date).toBe(true);
      expect((wrapper.vm as any).effectiveFieldVisibility.technicalStory).toBe(true);
    });

    it("makes every key true in temporary mode", () => {
      (wrapper.vm as any).temporarilyShowAllFields = true;
      const effective = (wrapper.vm as any).effectiveFieldVisibility;
      expect(Object.values(effective).every((v) => v === true)).toBe(true);
    });
  });

  // ── setFieldVisibility exits temporary mode ────────────────────────────────
  describe("setFieldVisibility clears temporary state", () => {
    beforeEach(async () => {
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ date: "2024-06-10" }) });
      await wrapper.vm.$nextTick();
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();
      (wrapper.vm as any).openWithFieldsVisible();
      expect((wrapper.vm as any).temporarilyShowAllFields).toBe(true);
      expect((wrapper.vm as any).highlightedFields.size).toBeGreaterThan(0);
    });

    it("resets temporarilyShowAllFields on any toggle", () => {
      (wrapper.vm as any).setFieldVisibility("date", true);
      expect((wrapper.vm as any).temporarilyShowAllFields).toBe(false);
    });

    it("clears highlightedFields on any toggle", () => {
      (wrapper.vm as any).setFieldVisibility("date", true);
      expect((wrapper.vm as any).highlightedFields.size).toBe(0);
    });

    it("still updates the fieldVisibility map", () => {
      (wrapper.vm as any).setFieldVisibility("status", false);
      expect((wrapper.vm as any).fieldVisibility.status).toBe(false);
    });
  });

  // ── saveAdr sends all fields regardless of visibility ──────────────────────
  describe("saveAdr – non-destructive (sends all field data)", () => {
    it("includes a hidden date field in the save payload", async () => {
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ date: "2024-06-10" }) });
      await wrapper.vm.$nextTick();
      (wrapper.vm as any).fieldVisibility = fv({ date: false });

      postMessage.mockClear();
      const adr = getSaveAdrPayload(wrapper.vm);
      expect(adr.date).toBe("2024-06-10");
    });

    it("includes a hidden technicalStory in the save payload", async () => {
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ technicalStory: "JIRA-1234" })
      });
      await wrapper.vm.$nextTick();
      (wrapper.vm as any).fieldVisibility = fv({ technicalStory: false });

      postMessage.mockClear();
      const adr = getSaveAdrPayload(wrapper.vm);
      expect(adr.technicalStory).toBe("JIRA-1234");
    });

    it("preserves hidden deciders and consulted in the payload", async () => {
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ deciders: "Alice, Bob", consulted: "Charlie" })
      });
      await wrapper.vm.$nextTick();
      (wrapper.vm as any).fieldVisibility = fv({ deciders: false, consulted: false });

      postMessage.mockClear();
      const adr = getSaveAdrPayload(wrapper.vm);
      expect(adr.deciders).toBe("Alice, Bob");
      expect(adr.consulted).toBe("Charlie");
    });

    it("full flow: open with hidden → dismiss → save still includes hidden data", async () => {
      // ADR with a date arrives
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ date: "2024-06-10" }) });
      await wrapper.vm.$nextTick();

      // Visibility push hides date → dialog appears
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(true);

      // User dismisses dialog without showing hidden data
      (wrapper.vm as any).openWithFieldsHidden();
      expect((wrapper.vm as any).hiddenFieldsCauseConversion).toBe(false);

      // Save must still carry the hidden date
      postMessage.mockClear();
      const adr = getSaveAdrPayload(wrapper.vm);
      expect(adr.date).toBe("2024-06-10");
    });

    it("full flow: open with visible → dismiss → save still includes the data", async () => {
      dispatchExtensionMessage({ command: "fetchAdrValues", adr: makeAdrPayload({ date: "2024-06-10" }) });
      await wrapper.vm.$nextTick();
      dispatchExtensionMessage({ command: "fieldVisibility", fieldVisibility: fv({ date: false }) });
      await wrapper.vm.$nextTick();

      (wrapper.vm as any).openWithFieldsVisible();

      postMessage.mockClear();
      const adr = getSaveAdrPayload(wrapper.vm);
      expect(adr.date).toBe("2024-06-10");
    });
  });
});
