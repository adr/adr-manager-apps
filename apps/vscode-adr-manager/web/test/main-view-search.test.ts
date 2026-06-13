// @vitest-environment jsdom
/**
 * Unit tests for search and tag-filter pagination in MainView.vue.
 *
 * Covers:
 *   1. Search text – filters ADR list by title
 *   2. Status filter – toggles status chips, filters ADR list
 *   3. Tag filter   – toggles tag chips, filters ADR list
 *   4. Clear search – resets all filters
 *   5. Filter panel visibility (toggle button, hasFilters / hasActiveFilters)
 *   6. Tag pagination – first 10 tags shown, "+N more" / "Show less" buttons
 *   7. "No results" empty state when no ADRs match
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import MainView from "../views/MainView.vue";
import type { Tag } from "@adr-manager/core";

// ── VS Code API mock ─────────────────────────────────────────────────────────
const postMessage = vi.fn();
vi.stubGlobal("vscode", { postMessage });

// ── Stub heavy child components so they don't blow up ───────────────────────
const stubs = {
  ADRContainer: { template: '<div class="adr-container-stub"></div>' },
  TourOverlay: { template: "<div></div>" }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fire a simulated extension-host message into the webview. */
function dispatchMessage(data: Record<string, unknown>) {
  window.dispatchEvent(new MessageEvent("message", { data }));
}

/** Build a minimal ADR entry that fetchAdrs would send (JSON-parsed form). */
function makeEntry(
  title: string,
  status: string,
  tags: Tag[] = [],
  index = 0
): Record<string, unknown> {
  return {
    adr: { title, status, conforming: true, parseErrors: [] },
    tags,
    fullPath: `/workspace/docs/decisions/000${index}-${title.toLowerCase().replace(/\s+/g, "-")}.md`,
    relativePath: `docs/decisions/000${index}-${title.toLowerCase().replace(/\s+/g, "-")}.md`,
    fileName: `000${index}-${title.toLowerCase().replace(/\s+/g, "-")}.md`
  };
}

/** Dispatch fetchAdrs + getWorkspaceFolders so the view has data. */
function seedAdrs(entries: ReturnType<typeof makeEntry>[]) {
  dispatchMessage({ command: "fetchAdrs", adrs: JSON.stringify(entries) });
  dispatchMessage({
    command: "getWorkspaceFolders",
    workspaceFolders: JSON.stringify(["MyWorkspace"])
  });
  dispatchMessage({ command: "getAdrDirectory", adrDirectory: "docs/decisions" });
}

/** Build N unique tags */
function makeTags(n: number): Tag[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `tag-${i}`,
    label: `Tag ${i + 1}`,
    color: "#6366f1"
  }));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("MainView – search and tag-filter pagination", () => {
  let wrapper: ReturnType<typeof mount>;

  beforeEach(() => {
    postMessage.mockClear();
    wrapper = mount(MainView, { global: { stubs } });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  // ── 1. Initial state ────────────────────────────────────────────────────────
  describe("initial state", () => {
    it("renders the search input", () => {
      expect(wrapper.find("[data-cy=adr-search-input]").exists()).toBe(true);
    });

    it("does not show the filter toggle when there are no ADRs", () => {
      expect(wrapper.find("[data-cy=adr-filter-toggle]").exists()).toBe(false);
    });

    it("does not show the clear button when nothing is typed", () => {
      expect(wrapper.find("[data-cy=adr-search-clear]").exists()).toBe(false);
    });

    it("filter panel is hidden by default", () => {
      expect(wrapper.find("[data-cy=adr-filter-panel]").exists()).toBe(false);
    });
  });

  // ── 2. Filter toggle visibility ─────────────────────────────────────────────
  describe("filter toggle", () => {
    beforeEach(async () => {
      seedAdrs([makeEntry("ADR One", "accepted", [{ id: "t1", label: "Tag1", color: "#f00" }], 1)]);
      await wrapper.vm.$nextTick();
    });

    it("shows the filter toggle when ADRs have statuses or tags", () => {
      expect(wrapper.find("[data-cy=adr-filter-toggle]").exists()).toBe(true);
    });

    it("opens the filter panel when the toggle is clicked", async () => {
      await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
      expect(wrapper.find("[data-cy=adr-filter-panel]").exists()).toBe(true);
    });

    it("closes the filter panel on a second click", async () => {
      await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
      await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
      expect(wrapper.find("[data-cy=adr-filter-panel]").exists()).toBe(false);
    });

    it("adds 'has-active' class when a status filter is active", async () => {
      await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
      await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
      expect(wrapper.find("[data-cy=adr-filter-toggle]").classes()).toContain("has-active");
    });
  });

  // ── 3. Text search ──────────────────────────────────────────────────────────
  describe("text search", () => {
    beforeEach(async () => {
      seedAdrs([
        makeEntry("Use Postgres", "accepted", [], 1),
        makeEntry("Use Redis", "proposed", [], 2),
        makeEntry("Adopt TypeScript", "accepted", [], 3)
      ]);
      await wrapper.vm.$nextTick();
    });

    it("shows the clear button when text is typed", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("post");
      expect(wrapper.find("[data-cy=adr-search-clear]").exists()).toBe(true);
    });

    it("searchActive is true when text is non-empty", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("post");
      expect((wrapper.vm as any).searchActive).toBe(true);
    });

    it("filters ADR list to entries matching the typed text", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("postgres");
      const vm = wrapper.vm as any;
      expect(vm.filteredDisplayedAdrs).toHaveLength(1);
      expect(vm.filteredDisplayedAdrs[0].adr.title).toBe("Use Postgres");
    });

    it("match is case-insensitive", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("REDIS");
      const vm = wrapper.vm as any;
      expect(vm.filteredDisplayedAdrs).toHaveLength(1);
      expect(vm.filteredDisplayedAdrs[0].adr.title).toBe("Use Redis");
    });

    it("pressing Escape clears the search", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("post");
      await wrapper.find("[data-cy=adr-search-input]").trigger("keydown", { key: "Escape" });
      expect((wrapper.vm as any).searchText).toBe("");
    });

    it("clicking the clear button resets the search", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("post");
      await wrapper.find("[data-cy=adr-search-clear]").trigger("click");
      expect((wrapper.vm as any).searchText).toBe("");
      expect(wrapper.find("[data-cy=adr-search-clear]").exists()).toBe(false);
    });

    it("returns all ADRs when search is cleared", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("postgres");
      await wrapper.find("[data-cy=adr-search-clear]").trigger("click");
      expect((wrapper.vm as any).filteredDisplayedAdrs).toHaveLength(3);
    });
  });

  // ── 4. Status filter ────────────────────────────────────────────────────────
  describe("status filter", () => {
    beforeEach(async () => {
      seedAdrs([
        makeEntry("Use Postgres", "accepted", [], 1),
        makeEntry("Use Redis", "proposed", [], 2),
        makeEntry("Use Kafka", "accepted", [], 3)
      ]);
      await wrapper.vm.$nextTick();
      await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
    });

    it("renders a chip for each unique status", () => {
      const chips = wrapper.findAll("[data-cy^=status-filter-]");
      expect(chips).toHaveLength(2);
    });

    it("clicking a status chip adds it to filterStatuses", async () => {
      await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
      expect((wrapper.vm as any).filterStatuses).toContain("accepted");
    });

    it("filters the ADR list to only matching statuses", async () => {
      await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
      const vm = wrapper.vm as any;
      expect(vm.filteredDisplayedAdrs).toHaveLength(2);
      expect(vm.filteredDisplayedAdrs.every((e: any) => e.adr.status === "accepted")).toBe(true);
    });

    it("clicking the same status chip again removes the filter", async () => {
      await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
      await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
      expect((wrapper.vm as any).filterStatuses).not.toContain("accepted");
      expect((wrapper.vm as any).filteredDisplayedAdrs).toHaveLength(3);
    });

    it("multiple status filters apply as OR", async () => {
      await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
      await wrapper.find("[data-cy=status-filter-proposed]").trigger("click");
      expect((wrapper.vm as any).filteredDisplayedAdrs).toHaveLength(3);
    });
  });

  // ── 5. Tag filter ───────────────────────────────────────────────────────────
  describe("tag filter", () => {
    const tagFrontend: Tag = { id: "fe", label: "frontend", color: "#6366f1" };
    const tagBackend: Tag = { id: "be", label: "backend", color: "#22c55e" };

    beforeEach(async () => {
      seedAdrs([
        makeEntry("Use React", "accepted", [tagFrontend], 1),
        makeEntry("Use Node", "accepted", [tagBackend], 2),
        makeEntry("Use Vite", "accepted", [tagFrontend, tagBackend], 3)
      ]);
      await wrapper.vm.$nextTick();
      await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
    });

    it("renders a chip for each unique tag", () => {
      expect(wrapper.find("[data-cy=tag-filter-frontend]").exists()).toBe(true);
      expect(wrapper.find("[data-cy=tag-filter-backend]").exists()).toBe(true);
    });

    it("clicking a tag chip adds its id to filterTagIds", async () => {
      await wrapper.find("[data-cy=tag-filter-frontend]").trigger("click");
      expect((wrapper.vm as any).filterTagIds).toContain("fe");
    });

    it("filters the ADR list to ADRs containing the selected tag", async () => {
      await wrapper.find("[data-cy=tag-filter-frontend]").trigger("click");
      const vm = wrapper.vm as any;
      expect(vm.filteredDisplayedAdrs).toHaveLength(2);
    });

    it("clicking the same tag chip again deselects it", async () => {
      await wrapper.find("[data-cy=tag-filter-frontend]").trigger("click");
      await wrapper.find("[data-cy=tag-filter-frontend]").trigger("click");
      expect((wrapper.vm as any).filterTagIds).not.toContain("fe");
      expect((wrapper.vm as any).filteredDisplayedAdrs).toHaveLength(3);
    });

    it("multiple tag filters use OR logic — any matching tag passes", async () => {
      await wrapper.find("[data-cy=tag-filter-frontend]").trigger("click");
      await wrapper.find("[data-cy=tag-filter-backend]").trigger("click");
      // All three ADRs have at least one of the two selected tags
      expect((wrapper.vm as any).filteredDisplayedAdrs).toHaveLength(3);
    });
  });

  // ── 6. Combined text + filter ────────────────────────────────────────────────
  describe("combined text and filter search", () => {
    const tagFrontend: Tag = { id: "fe", label: "frontend", color: "#6366f1" };

    beforeEach(async () => {
      seedAdrs([
        makeEntry("Use React", "accepted", [tagFrontend], 1),
        makeEntry("Use Vue", "accepted", [tagFrontend], 2),
        makeEntry("Use Node", "proposed", [], 3)
      ]);
      await wrapper.vm.$nextTick();
    });

    it("text and tag filters apply together", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("react");
      await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
      await wrapper.find("[data-cy=tag-filter-frontend]").trigger("click");
      const vm = wrapper.vm as any;
      expect(vm.filteredDisplayedAdrs).toHaveLength(1);
      expect(vm.filteredDisplayedAdrs[0].adr.title).toBe("Use React");
    });

    it("clearSearch resets both text and filter state", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("react");
      await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
      await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
      await (wrapper.vm as any).clearSearch();
      const vm = wrapper.vm as any;
      expect(vm.searchText).toBe("");
      expect(vm.filterStatuses).toHaveLength(0);
      expect(vm.filterTagIds).toHaveLength(0);
      expect(vm.searchActive).toBe(false);
    });
  });

  // ── 7. No-results empty state ────────────────────────────────────────────────
  describe("empty state when no ADRs match", () => {
    beforeEach(async () => {
      seedAdrs([makeEntry("Use Postgres", "accepted", [], 1)]);
      await wrapper.vm.$nextTick();
    });

    it("shows 'No ADRs match' when search yields no results", async () => {
      await wrapper.find("[data-cy=adr-search-input]").setValue("zzznomatch");
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain("No ADRs match your search");
    });

    it("does not show the empty state when search is inactive", () => {
      expect(wrapper.text()).not.toContain("No ADRs match your search");
    });
  });

  // ── 8. Tag pagination ────────────────────────────────────────────────────────
  describe("tag filter pagination", () => {
    describe("with exactly 10 tags", () => {
      beforeEach(async () => {
        const tags = makeTags(10);
        seedAdrs([makeEntry("ADR One", "accepted", tags, 1)]);
        await wrapper.vm.$nextTick();
        await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
      });

      it("shows all 10 tag chips", () => {
        expect(wrapper.findAll("[data-cy^=tag-filter-]")).toHaveLength(10);
      });

      it("does not show the '+N more' button", () => {
        expect(wrapper.find("[data-cy=tags-show-more]").exists()).toBe(false);
      });

      it("does not show the 'Show less' button", () => {
        expect(wrapper.find("[data-cy=tags-show-less]").exists()).toBe(false);
      });
    });

    describe("with 11 tags", () => {
      beforeEach(async () => {
        const tags = makeTags(11);
        seedAdrs([makeEntry("ADR One", "accepted", tags, 1)]);
        await wrapper.vm.$nextTick();
        await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
      });

      it("shows only 10 tag chips initially", () => {
        const tagChips = wrapper.findAll("[data-cy^=tag-filter-Tag]");
        expect(tagChips).toHaveLength(10);
      });

      it("shows the '+1 more' button", () => {
        expect(wrapper.find("[data-cy=tags-show-more]").exists()).toBe(true);
        expect(wrapper.find("[data-cy=tags-show-more]").text()).toContain("+1 more");
      });

      it("does not show 'Show less' before expanding", () => {
        expect(wrapper.find("[data-cy=tags-show-less]").exists()).toBe(false);
      });

      it("clicking '+N more' reveals all 11 chips", async () => {
        await wrapper.find("[data-cy=tags-show-more]").trigger("click");
        const tagChips = wrapper.findAll("[data-cy^=tag-filter-Tag]");
        expect(tagChips).toHaveLength(11);
      });

      it("clicking '+N more' hides that button and shows 'Show less'", async () => {
        await wrapper.find("[data-cy=tags-show-more]").trigger("click");
        expect(wrapper.find("[data-cy=tags-show-more]").exists()).toBe(false);
        expect(wrapper.find("[data-cy=tags-show-less]").exists()).toBe(true);
      });

      it("clicking 'Show less' collapses back to 10 chips", async () => {
        await wrapper.find("[data-cy=tags-show-more]").trigger("click");
        await wrapper.find("[data-cy=tags-show-less]").trigger("click");
        const tagChips = wrapper.findAll("[data-cy^=tag-filter-Tag]");
        expect(tagChips).toHaveLength(10);
      });

      it("clicking 'Show less' restores the '+N more' button", async () => {
        await wrapper.find("[data-cy=tags-show-more]").trigger("click");
        await wrapper.find("[data-cy=tags-show-less]").trigger("click");
        expect(wrapper.find("[data-cy=tags-show-more]").exists()).toBe(true);
        expect(wrapper.find("[data-cy=tags-show-less]").exists()).toBe(false);
      });
    });

    describe("with 15 tags spread across multiple ADRs", () => {
      beforeEach(async () => {
        const all = makeTags(15);
        seedAdrs([
          makeEntry("ADR Alpha", "accepted", all.slice(0, 8), 1),
          makeEntry("ADR Beta", "proposed", all.slice(8), 2)
        ]);
        await wrapper.vm.$nextTick();
        await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
      });

      it("aggregates all 15 unique tags from both ADRs", () => {
        expect((wrapper.vm as any).availableTags).toHaveLength(15);
      });

      it("reports hiddenTagCount of 5", () => {
        expect((wrapper.vm as any).hiddenTagCount).toBe(5);
      });

      it("shows '+5 more' on the button", () => {
        expect(wrapper.find("[data-cy=tags-show-more]").text()).toContain("+5 more");
      });

      it("after expand shows all 15 chips", async () => {
        await wrapper.find("[data-cy=tags-show-more]").trigger("click");
        expect(wrapper.findAll("[data-cy^=tag-filter-Tag]")).toHaveLength(15);
      });
    });

    describe("hiddenTagCount computed", () => {
      it("is 0 when there are fewer than 10 tags", async () => {
        seedAdrs([makeEntry("ADR One", "accepted", makeTags(3), 1)]);
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).hiddenTagCount).toBe(0);
      });

      it("is 0 when there are exactly 10 tags", async () => {
        seedAdrs([makeEntry("ADR One", "accepted", makeTags(10), 1)]);
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).hiddenTagCount).toBe(0);
      });

      it("is 1 when there are 11 tags", async () => {
        seedAdrs([makeEntry("ADR One", "accepted", makeTags(11), 1)]);
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).hiddenTagCount).toBe(1);
      });

      it("equals total - 10 for any count above 10", async () => {
        seedAdrs([makeEntry("ADR One", "accepted", makeTags(17), 1)]);
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).hiddenTagCount).toBe(7);
      });
    });
  });
});
