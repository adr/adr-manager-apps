<template>
    <div class="list">
        <div v-for="(consequence, index) in list" :key="index" class="list-row">
            <span class="gutter"><span class="mdi mdi-drag-vertical" aria-hidden="true"></span></span>
            <button
                type="button"
                class="tone-label"
                :class="`tone-${consequence.kind}`"
                title="Click to change tone"
                @click="cycleTone(consequence)"
            >
                {{ consequence.kind }}
            </button>
            <input
                :ref="(el) => setRowRef(index, el)"
                v-model="consequence.text"
                data-cy="consequenceInput"
                class="field"
                placeholder="a consequence of the decision…"
                @blur="removeIfEmpty(index)"
            />
            <button
                type="button"
                class="row-del"
                title="Remove"
                tabindex="-1"
                @click="remove(index)"
                @mousedown.prevent
            >
                <span class="mdi mdi-delete-outline" aria-hidden="true"></span>
            </button>
        </div>

        <div class="list-row list-add">
            <span class="gutter"><span class="mdi mdi-plus" aria-hidden="true"></span></span>
            <span class="tone-label tone-good">good</span>
            <input
                data-cy="consequenceAddInput"
                class="field"
                :value="draft"
                placeholder="add a consequence…"
                @input="commitDraft(($event.target as HTMLInputElement).value)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import type { ComponentPublicInstance } from "vue";
import type { Consequence, ConsequenceKind } from "@adr-manager/core";

const TONES: ConsequenceKind[] = ["good", "neutral", "bad"];

const props = defineProps<{ list: Consequence[] }>();

const draft = ref("");
const rowRefs = new Map<number, HTMLInputElement>();

function setRowRef(index: number, el: Element | ComponentPublicInstance | null): void {
    if (el instanceof HTMLInputElement) {
        rowRefs.set(index, el);
    } else {
        rowRefs.delete(index);
    }
}

function cycleTone(consequence: Consequence): void {
    const next = (TONES.indexOf(consequence.kind) + 1) % TONES.length;
    consequence.kind = TONES[next] ?? "good";
}

function commitDraft(text: string): void {
    draft.value = text;
    if (text.trim() === "") {
        return;
    }
    props.list.push({ kind: "good", text });
    draft.value = "";
    const newIndex = props.list.length - 1;
    void nextTick(() => rowRefs.get(newIndex)?.focus());
}

function remove(index: number): void {
    props.list.splice(index, 1);
}

function removeIfEmpty(index: number): void {
    if (props.list[index]?.text.trim() === "") {
        remove(index);
    }
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
    opacity: 0;
    min-height: 40px;
}

.list-row:hover .gutter {
    opacity: 1;
}

.gutter .mdi {
    font-size: 18px;
}

button.tone-label {
    border: 0;
    cursor: pointer;
    font-family: inherit;
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
