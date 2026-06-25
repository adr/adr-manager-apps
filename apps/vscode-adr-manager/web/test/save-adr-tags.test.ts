// @vitest-environment jsdom
/**
 * Tests for tag support in the save-adr mixin.
 *
 * The mixin is responsible for:
 *   1. Requesting persisted recent tags from the extension host on mount.
 *   2. Storing the response so AdrTagSection can render suggestions.
 *   3. Loading tags embedded in a fetchAdrValues payload (existing ADR).
 *   4. Including tags in createBasicAdr, createProfessionalAdr, and saveAdr messages.
 *   5. Persisting MRU recent tags to the extension host via updateRecentTags message.
 *   6. NOT overwriting tags when fieldVisibility or other unrelated messages arrive.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import saveAdrMixin from "../mixins/save-adr";
import vscodeApiMixin from "../mixins/vscode-api-mixin";
import type { Tag } from "@adr-manager/core";
import { makeAdrPayload } from "./helpers/adr-payload";

// ── mock VS Code API ──────────────────────────────────────────────────────────
const postMessage = vi.fn();
vi.stubGlobal("vscode", { postMessage });

// ── test component ────────────────────────────────────────────────────────────
const TestComponent = defineComponent({
  mixins: [vscodeApiMixin, saveAdrMixin],
  template: "<div></div>"
});

// ── fixtures ──────────────────────────────────────────────────────────────────
const TAG_A: Tag = { id: "a1", label: "frontend", color: "#6366f1" };
const TAG_B: Tag = { id: "b2", label: "backend", color: "#22c55e" };
const TAG_C: Tag = { id: "c3", label: "infra", color: "#f59e0b" };

/** Dispatch a simulated extension-host message into the webview. */
function dispatchExtensionMessage(data: Record<string, unknown>) {
  window.dispatchEvent(new MessageEvent("message", { data }));
}

// ── helpers ───────────────────────────────────────────────────────────────────
function getPostCall(command: string) {
  return postMessage.mock.calls.find((c: unknown[]) => (c[0] as { command: string }).command === command);
}

// ── tests ─────────────────────────────────────────────────────────────────────
describe("save-adr mixin – tag support", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    postMessage.mockClear();
    wrapper = mount(TestComponent);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  // ── on mount ─────────────────────────────────────────────────────────────────
  describe("on mount", () => {
    it("requests persisted recent tags from the extension host", () => {
      expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ command: "getRecentTags" }));
    });

    it("initialises tags to an empty array before any message arrives", () => {
      expect((wrapper.vm as any).tags).toEqual([]);
    });

    it("initialises recentTags to an empty array before any message arrives", () => {
      expect((wrapper.vm as any).recentTags).toEqual([]);
    });
  });

  // ── receiving recentTags from extension host ──────────────────────────────────
  describe("recentTags message from extension host", () => {
    it("populates recentTags when the extension host replies", async () => {
      dispatchExtensionMessage({ command: "recentTags", recentTags: [TAG_A, TAG_B] });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).recentTags).toEqual([TAG_A, TAG_B]);
    });

    it("handles an empty recentTags array gracefully", async () => {
      dispatchExtensionMessage({ command: "recentTags", recentTags: [] });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).recentTags).toEqual([]);
    });

    it("handles a missing recentTags field gracefully (defaults to [])", async () => {
      dispatchExtensionMessage({ command: "recentTags" });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).recentTags).toEqual([]);
    });
  });

  // ── loading tags from an existing ADR (fetchAdrValues) ───────────────────────
  describe("fetchAdrValues with tags", () => {
    it("stores tags when the ADR payload includes them", async () => {
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ tags: [TAG_A] })
      });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).tags).toEqual([TAG_A]);
    });

    it("stores multiple tags from the ADR payload", async () => {
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ tags: [TAG_A, TAG_B] })
      });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).tags).toEqual([TAG_A, TAG_B]);
    });

    it("defaults tags to [] when the ADR payload has no tags field", async () => {
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload()
      });
      await wrapper.vm.$nextTick();
      // tags should remain [] since getInput only sets tags when fields.tags is present
      expect((wrapper.vm as any).tags).toEqual([]);
    });

    it("does not overwrite existing tags when a new ADR payload omits them", async () => {
      // Set tags first
      (wrapper.vm as any).tags = [TAG_A];

      // New ADR arrives without a tags field
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload()
      });
      await wrapper.vm.$nextTick();

      // Tags remain from the previous assignment
      expect((wrapper.vm as any).tags).toEqual([TAG_A]);
    });

    it("replaces tags when a new ADR with different tags arrives", async () => {
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ tags: [TAG_A] })
      });
      await wrapper.vm.$nextTick();

      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ tags: [TAG_B, TAG_C] })
      });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).tags).toEqual([TAG_B, TAG_C]);
    });

    it("does not reset recentTags when fetchAdrValues arrives", async () => {
      dispatchExtensionMessage({ command: "recentTags", recentTags: [TAG_A] });
      await wrapper.vm.$nextTick();

      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ tags: [TAG_B] })
      });
      await wrapper.vm.$nextTick();

      expect((wrapper.vm as any).recentTags).toEqual([TAG_A]);
    });
  });

  // ── updateRecentTags ──────────────────────────────────────────────────────────
  describe("updateRecentTags method", () => {
    it("updates local recentTags state", () => {
      (wrapper.vm as any).updateRecentTags([TAG_A, TAG_B]);
      expect((wrapper.vm as any).recentTags).toEqual([TAG_A, TAG_B]);
    });

    it("sends an updateRecentTags message to the extension host", () => {
      postMessage.mockClear();
      (wrapper.vm as any).updateRecentTags([TAG_A]);
      const call = getPostCall("updateRecentTags");
      expect(call).toBeDefined();
    });

    it("spreads each tag to a plain object before postMessage (Proxy safety)", () => {
      postMessage.mockClear();
      (wrapper.vm as any).updateRecentTags([TAG_A, TAG_B]);
      const call = getPostCall("updateRecentTags");
      const data = call![0].data as Tag[];
      // Each item should be a plain object equal to the original
      expect(data[0]).toEqual(TAG_A);
      expect(data[1]).toEqual(TAG_B);
    });

    it("handles an empty MRU list", () => {
      postMessage.mockClear();
      (wrapper.vm as any).updateRecentTags([]);
      const call = getPostCall("updateRecentTags");
      expect(call![0].data).toEqual([]);
    });
  });

  // ── saveAdr payload includes tags ─────────────────────────────────────────────
  describe("saveAdr includes tags in the payload", () => {
    beforeEach(async () => {
      // Load ADR with tags
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ tags: [TAG_A, TAG_B] })
      });
      await wrapper.vm.$nextTick();
      postMessage.mockClear();
    });

    it("sends a saveAdr message that includes the current tags", () => {
      (wrapper.vm as any).saveAdr();
      const call = getPostCall("saveAdr");
      expect(call).toBeDefined();
      const adr = JSON.parse(call![0].data).adr;
      expect(adr.tags).toEqual([TAG_A, TAG_B]);
    });

    it("sends tags as plain objects (not Vue Proxy wrappers)", () => {
      (wrapper.vm as any).saveAdr();
      const call = getPostCall("saveAdr");
      const adr = JSON.parse(call![0].data).adr;
      // Verify each tag is a plain { id, label, color } object
      for (const tag of adr.tags) {
        expect(Object.keys(tag).sort()).toEqual(["color", "id", "label"]);
      }
    });

    it("sends an empty tags array when no tags are assigned", async () => {
      (wrapper.vm as any).tags = [];
      (wrapper.vm as any).saveAdr();
      const call = getPostCall("saveAdr");
      const adr = JSON.parse(call![0].data).adr;
      expect(adr.tags).toEqual([]);
    });

    it("reflects the latest tags even after they change post-load", () => {
      (wrapper.vm as any).tags = [TAG_C];
      (wrapper.vm as any).saveAdr();
      const call = getPostCall("saveAdr");
      const adr = JSON.parse(call![0].data).adr;
      expect(adr.tags).toEqual([TAG_C]);
    });
  });

  // ── createAdr (basic) payload includes tags ───────────────────────────────────
  describe("createAdr (basic) includes tags", () => {
    it("sends createBasicAdr with tags when tags are assigned", () => {
      (wrapper.vm as any).tags = [TAG_A];
      (wrapper.vm as any).createAdr("createBasicAdr");
      const call = getPostCall("createBasicAdr");
      expect(call).toBeDefined();
      const payload = JSON.parse(call![0].data);
      expect(payload.tags).toEqual([TAG_A]);
    });

    it("sends createBasicAdr with an empty tags array when none are assigned", () => {
      (wrapper.vm as any).tags = [];
      (wrapper.vm as any).createAdr("createBasicAdr");
      const call = getPostCall("createBasicAdr");
      const payload = JSON.parse(call![0].data);
      expect(payload.tags).toEqual([]);
    });

    it("spreads tags to plain objects in createBasicAdr", () => {
      (wrapper.vm as any).tags = [TAG_B];
      (wrapper.vm as any).createAdr("createBasicAdr");
      const call = getPostCall("createBasicAdr");
      const payload = JSON.parse(call![0].data);
      expect(payload.tags[0]).toEqual(TAG_B);
    });
  });

  // ── createAdr (professional) payload includes tags ────────────────────────────
  describe("createAdr (professional) includes tags", () => {
    it("sends createProfessionalAdr with tags when tags are assigned", () => {
      (wrapper.vm as any).tags = [TAG_A, TAG_C];
      (wrapper.vm as any).createAdr("createProfessionalAdr");
      const call = getPostCall("createProfessionalAdr");
      expect(call).toBeDefined();
      const payload = JSON.parse(call![0].data);
      expect(payload.tags).toEqual([TAG_A, TAG_C]);
    });

    it("sends createProfessionalAdr with an empty tags array when none are assigned", () => {
      (wrapper.vm as any).tags = [];
      (wrapper.vm as any).createAdr("createProfessionalAdr");
      const call = getPostCall("createProfessionalAdr");
      const payload = JSON.parse(call![0].data);
      expect(payload.tags).toEqual([]);
    });
  });

  // ── tags survive unrelated message traffic ────────────────────────────────────
  describe("tags are not disturbed by unrelated messages", () => {
    it("fieldVisibility message does not clear tags", async () => {
      (wrapper.vm as any).tags = [TAG_A];
      dispatchExtensionMessage({
        command: "fieldVisibility",
        fieldVisibility: { date: false, status: true, deciders: true }
      });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).tags).toEqual([TAG_A]);
    });

    it("saveSuccessful message does not clear tags", async () => {
      (wrapper.vm as any).tags = [TAG_B];
      dispatchExtensionMessage({ command: "saveSuccessful", newPath: "/new/path.md" });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).tags).toEqual([TAG_B]);
    });
  });

  // ── full round-trip scenario ──────────────────────────────────────────────────
  describe("full round-trip: load ADR → edit tags → save", () => {
    it("tags set during editing appear in the saveAdr payload", async () => {
      // Extension pushes ADR with one tag
      dispatchExtensionMessage({
        command: "fetchAdrValues",
        adr: makeAdrPayload({ tags: [TAG_A] })
      });
      await wrapper.vm.$nextTick();

      // User adds a second tag via AdrTagSection (simulated by direct mutation)
      (wrapper.vm as any).tags = [TAG_A, TAG_B];

      postMessage.mockClear();
      (wrapper.vm as any).saveAdr();

      const call = getPostCall("saveAdr");
      const adr = JSON.parse(call![0].data).adr;
      expect(adr.tags).toEqual([TAG_A, TAG_B]);
    });

    it("updateRecentTags persists after load and before save", async () => {
      dispatchExtensionMessage({ command: "recentTags", recentTags: [TAG_C] });
      await wrapper.vm.$nextTick();

      postMessage.mockClear();
      (wrapper.vm as any).updateRecentTags([TAG_A, TAG_C]);

      expect((wrapper.vm as any).recentTags).toEqual([TAG_A, TAG_C]);
      const call = getPostCall("updateRecentTags");
      expect(call![0].data).toEqual([TAG_A, TAG_C]);
    });
  });
});
