/**
 * Unit tests for AdrSearchBar.vue and its tag-filter pagination.
 *
 * Covers:
 *   1. Initial render state (input, no clear btn, no filter panel)
 *   2. Filter toggle visibility — only appears when there are statuses or tags
 *   3. Filter panel open / close
 *   4. Status filter chips — render, activate, deactivate
 *   5. Tag filter chips — render, activate, deactivate
 *   6. Tag pagination — 10 shown, "+N more" expands, "Show less" collapses
 *   7. Text input wires into useAdrSearch query
 *   8. Clear button and Escape key reset the query
 *   9. hasActiveFilters / filter-badge dot
 */
import { mount } from "@vue/test-utils";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import AdrSearchBar from "@/components/AdrSearchBar.vue";
import { useAdrSearch } from "@/composables/useAdrSearch";
import type { Tag } from "@/types/adr";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTags(n: number): Tag[] {
    return Array.from({ length: n }, (_, i) => ({
        id: `tag-${i}`,
        label: `Tag${i + 1}`,
        color: "#6366f1"
    }));
}

const STATUSES = ["accepted", "proposed", "rejected"];
const TWO_TAGS = makeTags(2);

// ── Helpers ───────────────────────────────────────────────────────────────────

function mountBar(tags: Tag[] = [], statuses: string[] = []) {
    return mount(AdrSearchBar, { props: { tags, statuses } });
}

/** Open the filter panel on a mounted wrapper. */
async function openFilters(wrapper: ReturnType<typeof mountBar>) {
    await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AdrSearchBar", () => {
    const { clearQuery, toggleStatus, toggleTagId } = useAdrSearch();

    // Reset the singleton query state and unmount after each test
    let wrapper: ReturnType<typeof mountBar>;

    beforeEach(() => {
        clearQuery();
    });

    afterEach(() => {
        wrapper?.unmount();
        clearQuery();
    });

    // ── 1. Initial render ────────────────────────────────────────────────────
    describe("initial render", () => {
        it("renders the search input", () => {
            wrapper = mountBar();
            expect(wrapper.find("[data-cy=adr-search-input]").exists()).toBe(true);
        });

        it("does not show the clear button when the query is empty", () => {
            wrapper = mountBar();
            expect(wrapper.find("[data-cy=adr-search-clear]").exists()).toBe(false);
        });

        it("does not render the filter toggle when no statuses or tags are provided", () => {
            wrapper = mountBar([], []);
            expect(wrapper.find("[data-cy=adr-filter-toggle]").exists()).toBe(false);
        });

        it("does not render the filter panel by default", () => {
            wrapper = mountBar(TWO_TAGS, STATUSES);
            expect(wrapper.find("[data-cy=adr-filter-panel]").exists()).toBe(false);
        });
    });

    // ── 2. Filter toggle visibility ──────────────────────────────────────────
    describe("filter toggle visibility", () => {
        it("shows the toggle when statuses are provided", () => {
            wrapper = mountBar([], ["accepted"]);
            expect(wrapper.find("[data-cy=adr-filter-toggle]").exists()).toBe(true);
        });

        it("shows the toggle when tags are provided", () => {
            wrapper = mountBar(TWO_TAGS, []);
            expect(wrapper.find("[data-cy=adr-filter-toggle]").exists()).toBe(true);
        });

        it("hides the toggle when both arrays are empty", () => {
            wrapper = mountBar([], []);
            expect(wrapper.find("[data-cy=adr-filter-toggle]").exists()).toBe(false);
        });
    });

    // ── 3. Filter panel open / close ─────────────────────────────────────────
    describe("filter panel open / close", () => {
        beforeEach(() => {
            wrapper = mountBar(TWO_TAGS, STATUSES);
        });

        it("opens the filter panel when the toggle is clicked", async () => {
            await openFilters(wrapper);
            expect(wrapper.find("[data-cy=adr-filter-panel]").exists()).toBe(true);
        });

        it("closes the filter panel on a second toggle click", async () => {
            await openFilters(wrapper);
            await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
            expect(wrapper.find("[data-cy=adr-filter-panel]").exists()).toBe(false);
        });

        it("the toggle gets class 'open' while the panel is open", async () => {
            await openFilters(wrapper);
            expect(wrapper.find("[data-cy=adr-filter-toggle]").classes()).toContain("open");
        });

        it("the toggle loses class 'open' after closing", async () => {
            await openFilters(wrapper);
            await wrapper.find("[data-cy=adr-filter-toggle]").trigger("click");
            expect(wrapper.find("[data-cy=adr-filter-toggle]").classes()).not.toContain("open");
        });
    });

    // ── 4. Status filter chips ────────────────────────────────────────────────
    describe("status filter chips", () => {
        beforeEach(async () => {
            wrapper = mountBar([], STATUSES);
            await openFilters(wrapper);
        });

        it("renders one chip per provided status", () => {
            expect(wrapper.findAll(".status-chip")).toHaveLength(3);
        });

        it("renders a chip for each status label", () => {
            for (const s of STATUSES) {
                expect(wrapper.find(`[data-cy=status-filter-${s}]`).exists()).toBe(true);
            }
        });

        it("clicking a chip adds the 'active' class", async () => {
            const chip = wrapper.find("[data-cy=status-filter-accepted]");
            await chip.trigger("click");
            expect(chip.classes()).toContain("active");
        });

        it("clicking an active chip deactivates it", async () => {
            const chip = wrapper.find("[data-cy=status-filter-accepted]");
            await chip.trigger("click");
            await chip.trigger("click");
            expect(chip.classes()).not.toContain("active");
        });

        it("activating a chip adds has-active class to the toggle", async () => {
            await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
            expect(wrapper.find("[data-cy=adr-filter-toggle]").classes()).toContain("has-active");
        });

        it("shows the filter-badge dot when a filter is active", async () => {
            await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
            expect(wrapper.find(".filter-badge").exists()).toBe(true);
        });

        it("multiple status chips can be active simultaneously", async () => {
            await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
            await wrapper.find("[data-cy=status-filter-proposed]").trigger("click");
            expect(wrapper.find("[data-cy=status-filter-accepted]").classes()).toContain("active");
            expect(wrapper.find("[data-cy=status-filter-proposed]").classes()).toContain("active");
        });
    });

    // ── 5. Tag filter chips ───────────────────────────────────────────────────
    describe("tag filter chips", () => {
        const tags = makeTags(3);

        beforeEach(async () => {
            wrapper = mountBar(tags, []);
            await openFilters(wrapper);
        });

        it("renders one chip per provided tag", () => {
            // All 3 tags fit in the first page so only tag chips, no more-btn
            expect(wrapper.findAll("[data-cy^=tag-filter-Tag]")).toHaveLength(3);
        });

        it("clicking a chip marks it as active", async () => {
            const chip = wrapper.find("[data-cy=tag-filter-Tag1]");
            await chip.trigger("click");
            expect(chip.classes()).toContain("active");
        });

        it("clicking an active chip deactivates it", async () => {
            const chip = wrapper.find("[data-cy=tag-filter-Tag1]");
            await chip.trigger("click");
            await chip.trigger("click");
            expect(chip.classes()).not.toContain("active");
        });

        it("activating a tag chip adds has-active class to the toggle", async () => {
            await wrapper.find("[data-cy=tag-filter-Tag1]").trigger("click");
            expect(wrapper.find("[data-cy=adr-filter-toggle]").classes()).toContain("has-active");
        });
    });

    // ── 6. Tag pagination ─────────────────────────────────────────────────────
    describe("tag pagination", () => {
        describe("with fewer than 10 tags", () => {
            beforeEach(async () => {
                wrapper = mountBar(makeTags(7), []);
                await openFilters(wrapper);
            });

            it("shows all 7 tags", () => {
                expect(wrapper.findAll("[data-cy^=tag-filter-Tag]")).toHaveLength(7);
            });

            it("does not render the '+N more' button", () => {
                expect(wrapper.find("[data-cy=tags-show-more]").exists()).toBe(false);
            });

            it("does not render the 'Show less' button", () => {
                expect(wrapper.find("[data-cy=tags-show-less]").exists()).toBe(false);
            });
        });

        describe("with exactly 10 tags", () => {
            beforeEach(async () => {
                wrapper = mountBar(makeTags(10), []);
                await openFilters(wrapper);
            });

            it("shows all 10 tags", () => {
                expect(wrapper.findAll("[data-cy^=tag-filter-Tag]")).toHaveLength(10);
            });

            it("does not render the '+N more' button", () => {
                expect(wrapper.find("[data-cy=tags-show-more]").exists()).toBe(false);
            });
        });

        describe("with 11 tags", () => {
            beforeEach(async () => {
                wrapper = mountBar(makeTags(11), []);
                await openFilters(wrapper);
            });

            it("shows only 10 tag chips initially", () => {
                expect(wrapper.findAll("[data-cy^=tag-filter-Tag]")).toHaveLength(10);
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
                expect(wrapper.findAll("[data-cy^=tag-filter-Tag]")).toHaveLength(11);
            });

            it("clicking '+N more' replaces the button with 'Show less'", async () => {
                await wrapper.find("[data-cy=tags-show-more]").trigger("click");
                expect(wrapper.find("[data-cy=tags-show-more]").exists()).toBe(false);
                expect(wrapper.find("[data-cy=tags-show-less]").exists()).toBe(true);
            });

            it("clicking 'Show less' collapses back to 10 chips", async () => {
                await wrapper.find("[data-cy=tags-show-more]").trigger("click");
                await wrapper.find("[data-cy=tags-show-less]").trigger("click");
                expect(wrapper.findAll("[data-cy^=tag-filter-Tag]")).toHaveLength(10);
            });

            it("clicking 'Show less' restores the '+N more' button", async () => {
                await wrapper.find("[data-cy=tags-show-more]").trigger("click");
                await wrapper.find("[data-cy=tags-show-less]").trigger("click");
                expect(wrapper.find("[data-cy=tags-show-more]").exists()).toBe(true);
                expect(wrapper.find("[data-cy=tags-show-less]").exists()).toBe(false);
            });

            it("tag beyond position 10 can still be selected after expanding", async () => {
                await wrapper.find("[data-cy=tags-show-more]").trigger("click");
                const lastChip = wrapper.find("[data-cy=tag-filter-Tag11]");
                await lastChip.trigger("click");
                expect(lastChip.classes()).toContain("active");
            });
        });

        describe("with 20 tags", () => {
            beforeEach(async () => {
                wrapper = mountBar(makeTags(20), []);
                await openFilters(wrapper);
            });

            it("shows exactly 10 chips before expanding", () => {
                expect(wrapper.findAll("[data-cy^=tag-filter-Tag]")).toHaveLength(10);
            });

            it("shows '+10 more' on the button", () => {
                expect(wrapper.find("[data-cy=tags-show-more]").text()).toContain("+10 more");
            });

            it("shows all 20 chips after expanding", async () => {
                await wrapper.find("[data-cy=tags-show-more]").trigger("click");
                expect(wrapper.findAll("[data-cy^=tag-filter-Tag]")).toHaveLength(20);
            });
        });
    });

    // ── 7. Text search via input ──────────────────────────────────────────────
    describe("text search input", () => {
        beforeEach(() => {
            wrapper = mountBar([], []);
        });

        it("updates the shared query when text is typed", async () => {
            const { query } = useAdrSearch();
            await wrapper.find("[data-cy=adr-search-input]").setValue("postgres");
            // The input fires @input not @change, so trigger manually
            await wrapper.find("[data-cy=adr-search-input]").trigger("input");
            expect(query.value.text).toBe("postgres");
        });

        it("shows the clear button when the query is active", async () => {
            const { setQuery } = useAdrSearch();
            setQuery({ text: "anything" });
            await wrapper.vm.$nextTick();
            expect(wrapper.find("[data-cy=adr-search-clear]").exists()).toBe(true);
        });

        it("clicking the clear button resets the query", async () => {
            const { setQuery, query } = useAdrSearch();
            setQuery({ text: "anything" });
            await wrapper.vm.$nextTick();
            await wrapper.find("[data-cy=adr-search-clear]").trigger("click");
            expect(query.value.text).toBe("");
            expect(wrapper.find("[data-cy=adr-search-clear]").exists()).toBe(false);
        });

        it("Escape key resets the query", async () => {
            const { setQuery, query } = useAdrSearch();
            setQuery({ text: "anything" });
            await wrapper.vm.$nextTick();
            await wrapper.find("[data-cy=adr-search-input]").trigger("keydown", { key: "Escape" });
            expect(query.value.text).toBe("");
        });
    });

    // ── 8. clearQuery also resets filter chips ────────────────────────────────
    describe("clearQuery resets active filters", () => {
        it("removes has-active class from the toggle after clearQuery", async () => {
            wrapper = mountBar([], ["accepted"]);
            await openFilters(wrapper);
            await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
            expect(wrapper.find("[data-cy=adr-filter-toggle]").classes()).toContain("has-active");

            clearQuery();
            await wrapper.vm.$nextTick();
            expect(wrapper.find("[data-cy=adr-filter-toggle]").classes()).not.toContain("has-active");
        });

        it("deactivates all status chips after clearQuery", async () => {
            wrapper = mountBar([], ["accepted", "proposed"]);
            await openFilters(wrapper);
            await wrapper.find("[data-cy=status-filter-accepted]").trigger("click");
            await wrapper.find("[data-cy=status-filter-proposed]").trigger("click");

            clearQuery();
            await wrapper.vm.$nextTick();
            expect(wrapper.find("[data-cy=status-filter-accepted]").classes()).not.toContain("active");
            expect(wrapper.find("[data-cy=status-filter-proposed]").classes()).not.toContain("active");
        });

        it("hides the filter-badge dot after clearQuery", async () => {
            wrapper = mountBar(TWO_TAGS, []);
            await openFilters(wrapper);
            await wrapper.find("[data-cy=tag-filter-Tag1]").trigger("click");
            expect(wrapper.find(".filter-badge").exists()).toBe(true);

            clearQuery();
            await wrapper.vm.$nextTick();
            expect(wrapper.find(".filter-badge").exists()).toBe(false);
        });
    });
});
