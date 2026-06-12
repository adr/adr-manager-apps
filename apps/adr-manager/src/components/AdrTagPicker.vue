<template>
    <div ref="wrap" data-cy="tag-picker" class="tag-picker-wrap">
        <!-- Assigned chips + add button -->
        <div class="tag-row">
            <AdrTagChip
                v-for="tag in currentTags"
                :key="tag.id"
                :tag="tag"
                removable
                @remove="removeTag(tag)"
            />
            <button
                type="button"
                data-cy="tag-add-btn"
                class="tag-add-btn"
                :class="{ open }"
                @click="open = !open"
            >
                <span class="mdi mdi-plus" aria-hidden="true"></span>
                Add tag
            </button>
        </div>

        <!-- Dropdown -->
        <div v-if="open" data-cy="tag-menu" class="tag-menu">
            <!-- Recently used tags (capped at MAX_RECENT) -->
            <template v-if="suggestions.length > 0">
                <p class="menu-section-label">Recently used</p>
                <div
                    v-for="tag in suggestions"
                    :key="tag.id"
                    data-cy="tag-suggestion"
                    class="menu-tag-row"
                    @click="addTag(tag)"
                >
                    <AdrTagChip :tag="tag" />
                </div>
                <hr class="menu-divider" />
            </template>

            <!-- Create new tag -->
            <p class="menu-section-label">New tag</p>
            <div class="create-row">
                <input
                    ref="labelInput"
                    v-model="newLabel"
                    data-cy="tag-new-label"
                    class="field new-tag-input"
                    placeholder="Label…"
                    maxlength="32"
                    @keydown.enter.prevent="createTag"
                />
            </div>
            <div class="palette-row">
                <button
                    v-for="c in TAG_PALETTE"
                    :key="c"
                    type="button"
                    data-cy="tag-swatch"
                    class="swatch"
                    :class="{ selected: newColor === c }"
                    :style="{ background: c }"
                    :aria-label="`Pick color ${c}`"
                    :data-color="c"
                    @click="newColor = c"
                ></button>
            </div>
            <div class="create-foot">
                <button
                    type="button"
                    data-cy="tag-create-btn"
                    class="btn btn-primary create-btn"
                    :disabled="!newLabel.trim()"
                    @click="createTag"
                >
                    Create
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import AdrTagChip from "./AdrTagChip.vue";
import { useClickOutside } from "@/composables/useClickOutside";
import { lsGet, lsSet } from "@/plugins/storage";
import { TAG_PALETTE } from "@adr-manager/core";
import type { Tag } from "@/types/adr";

const MAX_RECENT = 4;

const props = defineProps<{
    tags: readonly Tag[];
}>();

const emit = defineEmits<{
    "update:tags": [Tag[]];
}>();

const open = ref(false);
const newLabel = ref("");
const newColor = ref<string>(TAG_PALETTE[0]);
const labelInput = useTemplateRef<HTMLInputElement>("labelInput");
const wrap = useTemplateRef<HTMLElement>("wrap");
useClickOutside(wrap, () => (open.value = false));

const currentTags = computed(() => props.tags as Tag[]);

// ---- Recently-used tag registry (persisted to localStorage) ----

function loadRecent(): Tag[] {
    try {
        return JSON.parse(lsGet("recentTags") ?? "[]") as Tag[];
    } catch {
        return [];
    }
}

const recentTags = ref<Tag[]>(loadRecent());

function pushRecent(tag: Tag): void {
    const updated = recentTags.value.filter((t) => t.id !== tag.id);
    updated.unshift(tag);
    recentTags.value = updated.slice(0, MAX_RECENT);
    lsSet("recentTags", JSON.stringify(recentTags.value));
}

/** Recently-used tags that are not already assigned to this ADR. */
const suggestions = computed((): Tag[] => {
    const assignedIds = new Set(currentTags.value.map((t) => t.id));
    return recentTags.value.filter((t) => !assignedIds.has(t.id));
});

// ---- Mutation helpers ----

function addTag(tag: Tag): void {
    if (currentTags.value.some((t) => t.id === tag.id)) return;
    pushRecent(tag);
    emit("update:tags", [...currentTags.value, tag]);
    open.value = false;
}

function removeTag(tag: Tag): void {
    emit("update:tags", currentTags.value.filter((t) => t.id !== tag.id));
}

function createTag(): void {
    const label = newLabel.value.trim();
    if (!label) return;
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tag: Tag = { id, label, color: newColor.value };
    pushRecent(tag);
    emit("update:tags", [...currentTags.value, tag]);
    newLabel.value = "";
    open.value = false;
}

// Focus the label input when the dropdown opens.
watch(open, (isOpen) => {
    if (isOpen) {
        nextTick(() => labelInput.value?.focus());
    }
});
</script>

<style scoped>
.tag-picker-wrap {
    position: relative;
    display: inline-block;
}

.tag-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
}

.tag-add-btn {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    height: 24px;
    padding: 0 9px 0 6px;
    border-radius: 999px;
    border: 1px dashed var(--adr-line-strong);
    background: transparent;
    color: var(--adr-ink-2);
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.14s, color 0.14s, background 0.14s;
}

.tag-add-btn:hover,
.tag-add-btn.open {
    border-color: var(--adr-teal);
    color: var(--adr-teal);
    background: var(--adr-teal-050);
}

.tag-add-btn .mdi {
    font-size: 14px;
}

/* Dropdown */
.tag-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 240px;
    background: var(--adr-surface);
    border: 1px solid var(--adr-line);
    border-radius: var(--adr-radius-md);
    box-shadow: var(--adr-shadow-pop);
    padding: 10px;
    z-index: 60;
}

.menu-section-label {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--adr-ink-3);
    margin: 0 0 6px;
}

.menu-tag-row {
    padding: 3px 4px;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    margin-bottom: 2px;
}

.menu-tag-row:hover {
    background: var(--adr-surface-2);
}

.menu-divider {
    border: 0;
    border-top: 1px solid var(--adr-line);
    margin: 8px 0;
}

.create-row {
    margin-bottom: 8px;
}

.new-tag-input {
    height: 34px;
    padding: 0 10px;
    font-size: 13px;
}

.palette-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 10px;
}

.swatch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.1s, border-color 0.1s;
    flex: 0 0 auto;
}

.swatch:hover {
    transform: scale(1.15);
}

.swatch.selected {
    border-color: var(--adr-ink);
    transform: scale(1.15);
}

.create-foot {
    display: flex;
    justify-content: flex-end;
}

.create-btn {
    height: 30px;
    padding: 0 14px;
    font-size: 12px;
}
</style>
