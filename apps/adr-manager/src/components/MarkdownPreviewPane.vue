<template>
    <aside class="pane-preview" data-tour="preview" :style="{ flexBasis: `${width}px`, width: `${width}px` }">
        <div class="prev-resize" title="Drag to resize, drag past the edge to close" @mousedown="startResize">
            <span class="grip"></span>
        </div>
        <div class="preview-bar">
            <span class="mdi mdi-file-document-outline bar-icon" aria-hidden="true"></span>
            <span class="ptitle">Preview</span>
            <span class="pfile">{{ fileName }}</span>
            <span class="spacer"></span>
            <button
                type="button"
                data-cy="previewTabRendered"
                class="ptab"
                :class="{ on: view === 'rendered' }"
                @click="view = 'rendered'"
            >
                Rendered
            </button>
            <button
                type="button"
                data-cy="previewTabRaw"
                class="ptab"
                :class="{ on: view === 'raw' }"
                @click="view = 'raw'"
            >
                Raw
            </button>
        </div>
        <div v-if="view === 'rendered'" class="preview-doc">
            <MarkdownPreview :value="markdown" />
        </div>
        <div v-else class="raw-wrap" data-cy="markdownText">
            <EditorRaw :model-value="markdown" @update:model-value="emit('raw-edit', $event)" />
        </div>
    </aside>
</template>

<script setup lang="ts">
import { ref } from "vue";
import EditorRaw from "./EditorRaw.vue";
import MarkdownPreview from "./MarkdownPreview.vue";
import { useResizablePanel } from "@/composables/useResizablePanel";

const MIN_WIDTH = 340;
const MAX_WIDTH = 760;
const CLOSE_BELOW = 300;
const DEFAULT_WIDTH = 480;

defineProps<{ markdown: string; fileName: string }>();

const emit = defineEmits<{
    "raw-edit": [string];
    close: [];
}>();

const view = ref<"rendered" | "raw">("rendered");

const { width, startResize } = useResizablePanel({
    storageKey: "previewWidth",
    min: MIN_WIDTH,
    max: MAX_WIDTH,
    defaultWidth: DEFAULT_WIDTH,
    handle: "left",
    collapseBelow: CLOSE_BELOW,
    onCollapse: () => emit("close")
});
</script>

<style scoped>
.pane-preview {
    flex: 0 0 auto;
    min-width: 0;
    overflow-y: auto;
    background: var(--adr-surface-1);
    border-left: 1px solid var(--adr-line);
    position: relative;
    display: flex;
    flex-direction: column;
}

.prev-resize {
    position: absolute;
    top: 0;
    left: -3px;
    bottom: 0;
    width: 7px;
    cursor: col-resize;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: center;
}

.prev-resize::after {
    content: "";
    position: absolute;
    left: 3px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: transparent;
    transition: background 0.14s;
}

.prev-resize:hover::after {
    background: var(--adr-teal);
}

.prev-resize .grip {
    width: 3px;
    height: 26px;
    border-radius: 3px;
    background: var(--adr-line-strong);
    opacity: 0;
    transition: opacity 0.14s;
}

.prev-resize:hover .grip {
    opacity: 1;
}

.preview-bar {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    flex: 0 0 44px;
    padding: 0 16px;
    background: var(--adr-surface-1);
    border-bottom: 1px solid var(--adr-line);
    z-index: 5;
}

.bar-icon {
    color: var(--adr-ink-3);
    font-size: 17px;
}

.ptitle {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--adr-ink-2);
}

.pfile {
    font-size: 12px;
    color: var(--adr-ink-3);
    font-family: var(--adr-font-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
    flex-shrink: 1;
    min-width: 0;
}

.ptab {
    font-size: 12px;
    font-weight: 600;
    color: var(--adr-ink-3);
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
    border: 0;
    background: transparent;
    font-family: inherit;
    white-space: nowrap;
}

.ptab.on {
    background: var(--adr-surface);
    color: var(--adr-ink);
    box-shadow: var(--adr-shadow-1);
}

.preview-doc {
    padding: 26px 30px 80px;
}

.raw-wrap {
    flex: 1 1 auto;
    min-height: 0;
    background: var(--adr-surface);
}
</style>
