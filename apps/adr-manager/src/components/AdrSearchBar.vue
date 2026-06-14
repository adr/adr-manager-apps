<template>
    <div class="search-bar" data-cy="adr-search-bar" data-tour="adr-search">
        <!-- Text input + filter toggle row -->
        <div class="search-input-wrap">
            <span class="mdi mdi-magnify search-icon" aria-hidden="true"></span>
            <input
                :value="query.text"
                data-cy="adr-search-input"
                class="search-input"
                placeholder="Search ADRs…"
                aria-label="Search ADRs by title"
                @input="onTextInput"
                @keydown.escape="clearQuery"
            />
            <button
                v-if="hasFilters"
                type="button"
                class="filter-toggle"
                :class="{ open: filtersOpen, 'has-active': hasActiveFilters }"
                data-cy="adr-filter-toggle"
                :aria-expanded="filtersOpen"
                aria-label="Toggle ADR filters"
                title="Toggle filters"
                @click="filtersOpen = !filtersOpen"
            >
                <span class="mdi mdi-filter-variant" aria-hidden="true"></span>
                <span v-if="hasActiveFilters" class="filter-badge"></span>
            </button>
            <button
                v-if="active"
                type="button"
                class="clear-btn"
                data-cy="adr-search-clear"
                title="Clear search"
                @click="clearQuery"
            >
                <span class="mdi mdi-close" aria-hidden="true"></span>
            </button>
        </div>

        <!-- Collapsible filter panel -->
        <div v-if="filtersOpen && hasFilters" class="filter-panel" data-cy="adr-filter-panel">
            <!-- Status filter chips -->
            <template v-if="statuses.length > 0">
                <span class="filter-label">Status</span>
                <div class="filter-row">
                    <button
                        v-for="status in statuses"
                        :key="status"
                        type="button"
                        class="filter-chip status-chip"
                        :class="{ active: query.statuses.includes(status) }"
                        :data-tone="status"
                        :data-cy="`status-filter-${status}`"
                        :aria-pressed="query.statuses.includes(status)"
                        @click="toggleStatus(status)"
                    >
                        {{ status }}
                    </button>
                </div>
            </template>

            <!-- Tag filter chips -->
            <template v-if="tags.length > 0">
                <span class="filter-label">Tags</span>
                <div class="filter-row">
                    <button
                        v-for="tag in visibleTags"
                        :key="tag.id"
                        type="button"
                        class="filter-chip tag-chip"
                        :class="{ active: query.tagIds.includes(tag.id) }"
                        :style="{ '--tag-color': tag.color }"
                        :data-cy="`tag-filter-${tag.label}`"
                        :aria-pressed="query.tagIds.includes(tag.id)"
                        @click="toggleTagId(tag.id)"
                    >
                        <span class="tag-dot" aria-hidden="true"></span>
                        {{ tag.label }}
                    </button>
                    <button
                        v-if="!tagsExpanded && hiddenTagCount > 0"
                        type="button"
                        class="filter-chip tags-more-btn"
                        data-cy="tags-show-more"
                        @click="tagsExpanded = true"
                    >
                        +{{ hiddenTagCount }} more
                    </button>
                    <button
                        v-else-if="tagsExpanded && hiddenTagCount > 0"
                        type="button"
                        class="filter-chip tags-more-btn"
                        data-cy="tags-show-less"
                        @click="tagsExpanded = false"
                    >
                        Show less
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAdrSearch } from "@/composables/useAdrSearch";
import type { Tag } from "@/types/adr";

const props = defineProps<{
    /** All unique statuses present across the current ADRs. */
    statuses: string[];
    /** All unique tags present across the current ADRs. */
    tags: Tag[];
}>();

const { query, active, setQuery, clearQuery, toggleStatus, toggleTagId } = useAdrSearch();

const filtersOpen = ref(false);
const tagsExpanded = ref(false);
const TAG_PAGE = 10;

const hasFilters = computed(() => props.statuses.length > 0 || props.tags.length > 0);
const hasActiveFilters = computed(() => query.value.statuses.length > 0 || query.value.tagIds.length > 0);
const visibleTags = computed(() => tagsExpanded.value ? props.tags : props.tags.slice(0, TAG_PAGE));
const hiddenTagCount = computed(() => Math.max(0, props.tags.length - TAG_PAGE));

function onTextInput(e: Event) {
    setQuery({ text: (e.target as HTMLInputElement).value });
}
</script>

<style scoped>
.search-bar {
    padding: 6px 8px 8px;
    border-bottom: 1px solid var(--adr-line);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* ── Input row ── */
.search-input-wrap {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 6px;
    border-radius: 6px;
    border: 1px solid var(--adr-line-strong);
    background: var(--adr-surface);
    transition: border-color 0.14s;
}

.search-input-wrap:focus-within {
    border-color: var(--adr-teal);
}

.search-icon {
    font-size: 15px;
    color: var(--adr-ink-3);
    flex: 0 0 auto;
}

.search-input {
    flex: 1 1 auto;
    border: 0;
    outline: 0;
    background: transparent;
    font-family: inherit;
    font-size: 12.5px;
    color: var(--adr-ink);
    min-width: 0;
}

.search-input::placeholder {
    color: var(--adr-ink-3);
}

/* ── Filter toggle button ── */
.filter-toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex: 0 0 auto;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--adr-ink-3);
    cursor: pointer;
    padding: 0;
    transition: background 0.12s, color 0.12s;
}

.filter-toggle:hover,
.filter-toggle.open {
    background: var(--adr-surface-2);
    color: var(--adr-ink);
}

.filter-toggle.has-active {
    color: var(--adr-teal);
}

.filter-toggle .mdi {
    font-size: 15px;
}

.filter-badge {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--adr-teal);
}

/* ── Clear button ── */
.clear-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    border: 0;
    border-radius: 50%;
    background: var(--adr-line-strong);
    color: var(--adr-ink-2);
    cursor: pointer;
    padding: 0;
}

.clear-btn:hover {
    background: var(--adr-ink-3);
    color: var(--adr-ink);
}

.clear-btn .mdi {
    font-size: 11px;
}

/* ── Collapsible filter panel ── */
.filter-panel {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 6px 2px 2px;
    border-top: 1px solid var(--adr-line);
}

.filter-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--adr-ink-3);
}

.filter-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}

.filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    padding: 0 7px;
    border-radius: 999px;
    border: 1px solid var(--adr-line-strong);
    background: transparent;
    color: var(--adr-ink-2);
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    text-transform: capitalize;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
}

/* Status chip colors — mirrors .chip.status[data-tone] palette from global.css */
.status-chip[data-tone="accepted"]   { color: var(--adr-success); border-color: var(--adr-success); }
.status-chip[data-tone="proposed"]   { color: var(--adr-info);    border-color: var(--adr-info); }
.status-chip[data-tone="rejected"]   { color: var(--adr-error);   border-color: var(--adr-error); }
.status-chip[data-tone="deprecated"] { color: var(--adr-warning);    border-color: var(--adr-warning); }
.status-chip[data-tone="superseded"] { color: var(--adr-superseded); border-color: var(--adr-superseded); }

.status-chip.active[data-tone="accepted"]   { background: color-mix(in srgb, var(--adr-success)    15%, transparent); }
.status-chip.active[data-tone="proposed"]   { background: color-mix(in srgb, var(--adr-info)        15%, transparent); }
.status-chip.active[data-tone="rejected"]   { background: color-mix(in srgb, var(--adr-error)       15%, transparent); }
.status-chip.active[data-tone="deprecated"] { background: color-mix(in srgb, var(--adr-warning)     15%, transparent); }
.status-chip.active[data-tone="superseded"] { background: color-mix(in srgb, var(--adr-superseded)  15%, transparent); }

.status-chip:not(.active):hover { background: var(--adr-surface-2); }

/* Tag chip */
.tag-chip {
    border-color: color-mix(in srgb, var(--tag-color) 40%, transparent);
}

.tag-chip.active {
    background: color-mix(in srgb, var(--tag-color) 15%, transparent);
    border-color: var(--tag-color);
    color: color-mix(in srgb, var(--tag-color) 80%, #000);
}

.tag-chip:not(.active):hover {
    background: color-mix(in srgb, var(--tag-color) 8%, transparent);
    color: var(--adr-ink);
}

.tag-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--tag-color);
    flex: 0 0 auto;
}

.tags-more-btn {
    border-style: dashed;
    color: var(--adr-ink-3);
    font-weight: 500;
}

.tags-more-btn:hover {
    background: var(--adr-surface-2);
    color: var(--adr-ink-2);
    border-style: solid;
}
</style>
