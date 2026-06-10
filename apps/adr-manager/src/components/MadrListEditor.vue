<template>
    <div class="list">
        <div
            v-for="(row, index) in rows"
            :key="row.id"
            class="list-row"
            @dragover.prevent
            @drop="moveRow(index)"
            @mouseenter="hoveredId = row.id"
            @mouseleave="hoveredId = null"
        >
            <span class="gutter" draggable="true" @dragstart="draggedIndex = index" @dragend="draggedIndex = null">
                <span class="mdi mdi-drag-vertical" aria-hidden="true"></span>
            </span>
            <span v-if="tone" class="tone-label" :class="`tone-${tone.kind}`">{{ tone.label }}</span>
            <input
                :ref="(el) => setRowRef(row.id, el)"
                data-cy="listItemInput"
                class="field"
                :value="row.text"
                :placeholder="placeholder"
                @input="updateRow(index, ($event.target as HTMLInputElement).value)"
                @blur="removeRowIfEmpty(index)"
            />
            <button
                type="button"
                class="row-del"
                title="Remove"
                tabindex="-1"
                @click="removeRow(index)"
                @mousedown.prevent
            >
                <span class="mdi mdi-delete-outline" aria-hidden="true"></span>
            </button>
        </div>

        <div class="list-row list-add">
            <span class="gutter"><span class="mdi mdi-plus" aria-hidden="true"></span></span>
            <span v-if="tone" class="tone-label" :class="`tone-${tone.kind}`">{{ tone.label }}</span>
            <input
                data-cy="listAddInput"
                class="field"
                :value="draft"
                :placeholder="placeholder"
                @input="commitDraft(($event.target as HTMLInputElement).value)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";

interface ListRow {
    id: number;
    text: string;
}

interface ToneLabel {
    kind: "good" | "neutral" | "bad";
    label: string;
}

const props = defineProps<{ list: string[]; placeholder?: string; tone?: ToneLabel }>();

let idCounter = 0;
const nextId = (): number => ++idCounter;

const rows = ref<ListRow[]>(props.list.map((text) => ({ id: nextId(), text })));
const draft = ref("");
const hoveredId = ref<number | null>(null);
const draggedIndex = ref<number | null>(null);
const rowRefs = new Map<number, HTMLInputElement>();

function setRowRef(id: number, el: Element | ComponentPublicInstance | null): void {
    if (el instanceof HTMLInputElement) {
        rowRefs.set(id, el);
    } else {
        rowRefs.delete(id);
    }
}

// The bound list is mutated in place so the change reaches the shared ADR record.
function writeBack(): void {
    props.list.length = rows.value.length;
    rows.value.forEach((row, index) => {
        props.list[index] = row.text;
    });
}

watch(
    () => [...props.list],
    (newList) => {
        if (newList.length === rows.value.length && rows.value.every((row, index) => row.text === newList[index])) {
            return;
        }
        rows.value = newList.map((text, index) => {
            const existing = rows.value[index];
            return existing && existing.text === text ? existing : { id: nextId(), text };
        });
    }
);

function updateRow(index: number, text: string): void {
    const row = rows.value[index];
    if (row) {
        row.text = text;
        writeBack();
    }
}

function commitDraft(text: string): void {
    draft.value = text;
    if (text.trim() === "") {
        return;
    }
    const row: ListRow = { id: nextId(), text };
    rows.value.push(row);
    draft.value = "";
    writeBack();
    void nextTick(() => rowRefs.get(row.id)?.focus());
}

function removeRow(index: number): void {
    rows.value.splice(index, 1);
    writeBack();
}

function removeRowIfEmpty(index: number): void {
    if (rows.value[index]?.text.trim() === "") {
        removeRow(index);
    }
}

function moveRow(targetIndex: number): void {
    const from = draggedIndex.value;
    if (from === null || from === targetIndex) {
        return;
    }
    const [moved] = rows.value.splice(from, 1);
    if (moved) {
        rows.value.splice(targetIndex, 0, moved);
        writeBack();
    }
    draggedIndex.value = null;
}
</script>

<style scoped>
.list {
    display: flex;
    flex-direction: column;
}

.list-row {
    display: flex;
    align-items: flex-start;
    border-radius: 6px;
}

.list-row:hover {
    background: var(--adr-surface-1);
}

.gutter {
    flex: 0 0 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    color: var(--adr-ink-3);
    cursor: grab;
    opacity: 0;
    min-height: 40px;
}

.list-row:hover .gutter {
    opacity: 1;
}

.gutter .mdi {
    font-size: 18px;
}

.list-row .field {
    background: transparent;
    border: 0;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    padding: 9px 8px;
    box-shadow: none;
}

.list-row .field:hover {
    background: transparent;
    border-color: transparent;
    border-bottom-color: var(--adr-field-border);
}

.list-row .field:focus {
    background: var(--adr-surface-1);
    box-shadow: none;
    border-bottom: 2px solid var(--adr-teal);
}

.row-del {
    flex: 0 0 34px;
    align-self: center;
    display: flex;
    justify-content: center;
    opacity: 0;
    color: var(--adr-ink-3);
    cursor: pointer;
    border: 0;
    background: transparent;
    padding: 0;
}

.list-row:hover .row-del {
    opacity: 1;
}

.row-del:hover {
    color: var(--adr-error);
}

.row-del .mdi {
    font-size: 18px;
}

.list-add .gutter {
    opacity: 0.5;
}

.list-add .gutter .mdi {
    font-size: 16px;
}
</style>
