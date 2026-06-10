<template>
    <div ref="host" class="raw-editor"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import {
    Decoration,
    EditorView,
    ViewPlugin,
    keymap,
    lineNumbers,
    type DecorationSet,
    type ViewUpdate
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { debounce } from "@/utils/debounce";

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const host = useTemplateRef<HTMLDivElement>("host");
let view: EditorView | null = null;

const emitChange = debounce((value: string) => emit("update:modelValue", value), 300);

/* Token colors deliberately match the CodeMirror 5 default theme. */
const markdownHighlight = HighlightStyle.define([
    { tag: tags.heading, color: "#00f", fontWeight: "bold", textDecoration: "none" },
    { tag: tags.list, color: "#05a" },
    { tag: tags.quote, color: "#090" },
    { tag: tags.link, color: "#00c", textDecoration: "underline" },
    { tag: tags.url, color: "#00c" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strong, fontWeight: "bold" }
]);

/* Color whole list lines, not just the bullet, like the CodeMirror 5 default theme. */
const listLineDecoration = Decoration.line({ class: "cm-list-line" });
const listLines = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        constructor(v: EditorView) {
            this.decorations = buildListLines(v);
        }
        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = buildListLines(update.view);
            }
        }
    },
    { decorations: (plugin) => plugin.decorations }
);

function buildListLines(v: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of v.visibleRanges) {
        for (let pos = from; pos <= to; ) {
            const line = v.state.doc.lineAt(pos);
            if (/^\s*([*+-]|\d+\.)\s/.test(line.text)) {
                builder.add(line.from, line.from, listLineDecoration);
            }
            pos = line.to + 1;
        }
    }
    return builder.finish();
}

onMounted(() => {
    if (!host.value) {
        return;
    }
    view = new EditorView({
        state: EditorState.create({
            doc: props.modelValue,
            extensions: [
                history(),
                markdown(),
                syntaxHighlighting(markdownHighlight),
                listLines,
                EditorView.lineWrapping,
                keymap.of([...defaultKeymap, ...historyKeymap]),
                lineNumbers(),
                EditorView.theme({ "&": { backgroundColor: "transparent" } }),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        emitChange(update.state.doc.toString());
                    }
                })
            ]
        }),
        parent: host.value
    });
});

onBeforeUnmount(() => {
    emitChange.cancel();
    view?.destroy();
    view = null;
});

// Apply external value changes without feeding them back into the editor.
watch(
    () => props.modelValue,
    (value) => {
        if (!view) {
            return;
        }
        const current = view.state.doc.toString();
        if (value !== current) {
            view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
        }
    }
);
</script>

<style scoped>
.raw-editor {
    height: 100%;
    text-align: left;
    font-size: 13px;
}

.raw-editor :deep(.cm-editor) {
    height: 100%;
}

.raw-editor :deep(.cm-scroller) {
    line-height: 22px;
    font-family: var(--adr-font-mono);
}

.raw-editor :deep(.cm-gutters) {
    background-color: var(--adr-surface-1);
    border-right: 1px solid var(--adr-line);
    color: var(--adr-ink-3);
}

.raw-editor :deep(.cm-list-line) {
    color: #05a;
}
</style>
