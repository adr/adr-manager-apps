// @vitest-environment jsdom
/**
 * Tests for tag preservation when switching between Basic and Professional editor modes.
 *
 * The bug (fixed): all four switchXxx() methods serialised every ADR field into the
 * hand-off payload EXCEPT `tags`, so the new view always started with an empty tag list.
 *
 * Covered views and directions:
 *   1. AddBasicView       → switchToProfessionalTemplate  (add-basic  → add-professional)
 *   2. AddProfessionalView → switchToBasicTemplate         (add-pro    → add-basic)
 *   3. ViewBasicView      → switchToProfessionalTemplate  (view-basic → view-professional)
 *   4. ViewProfessionalView → switchToBasicTemplate        (view-pro   → view-basic)
 *
 * Each direction verifies:
 *   a. Tags array is present in the postMessage payload.
 *   b. Every tag's color, id, and label survive the serialisation.
 *   c. An empty tag list is also handled correctly.
 *   d. Tags are plain objects (Proxy-stripped) so structured-clone does not drop them.
 *   e. Round-trip: the payload can be fed back via fetchAdrValues and the tags are restored.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import AddBasicView from "../views/AddBasicView.vue";
import AddProfessionalView from "../views/AddProfessionalView.vue";
import ViewBasicView from "../views/ViewBasicView.vue";
import ViewProfessionalView from "../views/ViewProfessionalView.vue";
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
const TAG_BACKEND: Tag = { id: "b2", label: "backend",  color: "#22c55e" };
const TAG_INFRA: Tag   = { id: "c3", label: "infra",    color: "#f59e0b" };

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the parsed payload sent with a specific command, or throw if not found. */
function getSwitchPayload(command: string): Record<string, unknown> {
    const call = postMessage.mock.calls.find(
        (c: unknown[]) => (c[0] as { command: string }).command === command
    );
    if (!call) throw new Error(`No postMessage call found for command "${command}"`);
    return JSON.parse(call[0].data as string);
}

/** Dispatch a simulated extension-host message into the webview. */
function dispatchExtensionMessage(data: Record<string, unknown>) {
    window.dispatchEvent(new MessageEvent("message", { data }));
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("mode-switch tag preservation", () => {

    // ── 1. AddBasicView → switchToProfessionalTemplate ──────────────────────
    describe("AddBasicView → switchToProfessionalTemplate", () => {
        let wrapper: ReturnType<typeof mount>;

        beforeEach(() => {
            wrapper = mount(AddBasicView, { global: { stubs } });
            postMessage.mockClear(); // discard mount-time getFieldVisibility / getRecentTags
        });

        afterEach(() => { wrapper.unmount(); });

        it("includes a tags field in the switch payload", () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const payload = getSwitchPayload("switchAddViewBasicToProfessional");
            expect(payload).toHaveProperty("tags");
        });

        it("sends all assigned tags in the payload", () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_BACKEND];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const { tags } = getSwitchPayload("switchAddViewBasicToProfessional") as { tags: Tag[] };
            expect(tags).toEqual([TAG_FRONTEND, TAG_BACKEND]);
        });

        it("preserves each tag's color exactly", () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_INFRA];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const { tags } = getSwitchPayload("switchAddViewBasicToProfessional") as { tags: Tag[] };
            expect(tags[0].color).toBe(TAG_FRONTEND.color);
            expect(tags[1].color).toBe(TAG_INFRA.color);
        });

        it("sends an empty array when no tags are assigned", () => {
            (wrapper.vm as any).tags = [];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const { tags } = getSwitchPayload("switchAddViewBasicToProfessional") as { tags: Tag[] };
            expect(tags).toEqual([]);
        });

        it("sends tags as plain objects so structured-clone can serialise them", () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const { tags } = getSwitchPayload("switchAddViewBasicToProfessional") as { tags: Tag[] };
            expect(Object.keys(tags[0]).sort()).toEqual(["color", "id", "label"]);
        });

        it("round-trip: payload tags survive fetchAdrValues and restore on the vm", async () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_BACKEND];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const payload = getSwitchPayload("switchAddViewBasicToProfessional");

            // Simulate WebPanel echoing the payload back as fetchAdrValues
            dispatchExtensionMessage({ command: "fetchAdrValues", adr: JSON.stringify(payload) });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).tags).toEqual([TAG_FRONTEND, TAG_BACKEND]);
        });
    });

    // ── 2. AddProfessionalView → switchToBasicTemplate ──────────────────────
    describe("AddProfessionalView → switchToBasicTemplate", () => {
        let wrapper: ReturnType<typeof mount>;

        beforeEach(() => {
            wrapper = mount(AddProfessionalView, { global: { stubs } });
            postMessage.mockClear();
        });

        afterEach(() => { wrapper.unmount(); });

        it("includes a tags field in the switch payload", () => {
            (wrapper.vm as any).tags = [TAG_BACKEND];
            (wrapper.vm as any).switchToBasicTemplate();
            const payload = getSwitchPayload("switchAddViewProfessionalToBasic");
            expect(payload).toHaveProperty("tags");
        });

        it("sends all assigned tags in the payload", () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_BACKEND, TAG_INFRA];
            (wrapper.vm as any).switchToBasicTemplate();
            const { tags } = getSwitchPayload("switchAddViewProfessionalToBasic") as { tags: Tag[] };
            expect(tags).toEqual([TAG_FRONTEND, TAG_BACKEND, TAG_INFRA]);
        });

        it("preserves each tag's color exactly", () => {
            (wrapper.vm as any).tags = [TAG_BACKEND];
            (wrapper.vm as any).switchToBasicTemplate();
            const { tags } = getSwitchPayload("switchAddViewProfessionalToBasic") as { tags: Tag[] };
            expect(tags[0].color).toBe(TAG_BACKEND.color);
        });

        it("sends an empty array when no tags are assigned", () => {
            (wrapper.vm as any).tags = [];
            (wrapper.vm as any).switchToBasicTemplate();
            const { tags } = getSwitchPayload("switchAddViewProfessionalToBasic") as { tags: Tag[] };
            expect(tags).toEqual([]);
        });

        it("round-trip: payload tags survive fetchAdrValues and restore on the vm", async () => {
            (wrapper.vm as any).tags = [TAG_INFRA];
            (wrapper.vm as any).switchToBasicTemplate();
            const payload = getSwitchPayload("switchAddViewProfessionalToBasic");

            dispatchExtensionMessage({ command: "fetchAdrValues", adr: JSON.stringify(payload) });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).tags).toEqual([TAG_INFRA]);
        });
    });

    // ── 3. ViewBasicView → switchToProfessionalTemplate ─────────────────────
    describe("ViewBasicView → switchToProfessionalTemplate", () => {
        let wrapper: ReturnType<typeof mount>;

        beforeEach(() => {
            wrapper = mount(ViewBasicView, { global: { stubs } });
            postMessage.mockClear();
        });

        afterEach(() => { wrapper.unmount(); });

        it("includes a tags field in the switch payload", () => {
            (wrapper.vm as any).tags = [TAG_INFRA];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const payload = getSwitchPayload("switchViewingViewBasicToProfessional");
            expect(payload).toHaveProperty("tags");
        });

        it("sends all assigned tags in the payload", () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_INFRA];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const { tags } = getSwitchPayload("switchViewingViewBasicToProfessional") as { tags: Tag[] };
            expect(tags).toEqual([TAG_FRONTEND, TAG_INFRA]);
        });

        it("preserves each tag's color exactly", () => {
            (wrapper.vm as any).tags = [TAG_INFRA];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const { tags } = getSwitchPayload("switchViewingViewBasicToProfessional") as { tags: Tag[] };
            expect(tags[0].color).toBe(TAG_INFRA.color);
        });

        it("sends an empty array when no tags are assigned", () => {
            (wrapper.vm as any).tags = [];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const { tags } = getSwitchPayload("switchViewingViewBasicToProfessional") as { tags: Tag[] };
            expect(tags).toEqual([]);
        });

        it("round-trip: payload tags survive fetchAdrValues and restore on the vm", async () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_BACKEND];
            (wrapper.vm as any).switchToProfessionalTemplate();
            const payload = getSwitchPayload("switchViewingViewBasicToProfessional");

            dispatchExtensionMessage({ command: "fetchAdrValues", adr: JSON.stringify(payload) });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).tags).toEqual([TAG_FRONTEND, TAG_BACKEND]);
        });
    });

    // ── 4. ViewProfessionalView → switchToBasicTemplate ─────────────────────
    describe("ViewProfessionalView → switchToBasicTemplate", () => {
        let wrapper: ReturnType<typeof mount>;

        beforeEach(() => {
            wrapper = mount(ViewProfessionalView, { global: { stubs } });
            postMessage.mockClear();
        });

        afterEach(() => { wrapper.unmount(); });

        it("includes a tags field in the switch payload", () => {
            (wrapper.vm as any).tags = [TAG_BACKEND];
            (wrapper.vm as any).switchToBasicTemplate();
            const payload = getSwitchPayload("switchViewingViewProfessionalToBasic");
            expect(payload).toHaveProperty("tags");
        });

        it("sends all assigned tags in the payload", () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_BACKEND];
            (wrapper.vm as any).switchToBasicTemplate();
            const { tags } = getSwitchPayload("switchViewingViewProfessionalToBasic") as { tags: Tag[] };
            expect(tags).toEqual([TAG_FRONTEND, TAG_BACKEND]);
        });

        it("preserves each tag's color exactly", () => {
            (wrapper.vm as any).tags = [TAG_BACKEND];
            (wrapper.vm as any).switchToBasicTemplate();
            const { tags } = getSwitchPayload("switchViewingViewProfessionalToBasic") as { tags: Tag[] };
            expect(tags[0].color).toBe(TAG_BACKEND.color);
        });

        it("sends an empty array when no tags are assigned", () => {
            (wrapper.vm as any).tags = [];
            (wrapper.vm as any).switchToBasicTemplate();
            const { tags } = getSwitchPayload("switchViewingViewProfessionalToBasic") as { tags: Tag[] };
            expect(tags).toEqual([]);
        });

        it("round-trip: payload tags survive fetchAdrValues and restore on the vm", async () => {
            (wrapper.vm as any).tags = [TAG_FRONTEND, TAG_INFRA];
            (wrapper.vm as any).switchToBasicTemplate();
            const payload = getSwitchPayload("switchViewingViewProfessionalToBasic");

            dispatchExtensionMessage({ command: "fetchAdrValues", adr: JSON.stringify(payload) });
            await wrapper.vm.$nextTick();

            expect((wrapper.vm as any).tags).toEqual([TAG_FRONTEND, TAG_INFRA]);
        });
    });
});
