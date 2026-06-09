<template>
    <div ref="host" class="cm-host" :class="{ 'cm-field': field }"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import {
    Decoration,
    EditorView,
    ViewPlugin,
    keymap,
    lineNumbers as cmLineNumbers,
    type DecorationSet,
    type ViewUpdate
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const props = withDefaults(
    defineProps<{
        modelValue: string;
        lineNumbers?: boolean;
        field?: boolean;
    }>(),
    { lineNumbers: false, field: true }
);

const emit = defineEmits<{
    "update:modelValue": [string];
    blur: [];
    focus: [];
}>();

const host = useTemplateRef<HTMLDivElement>("host");
let view: EditorView | null = null;

/* Token colors of the CodeMirror 5 default theme used by the original app. */
const cm5Highlight = HighlightStyle.define([
    { tag: tags.heading, color: "#00f", fontWeight: "bold", textDecoration: "none" },
    { tag: tags.list, color: "#05a" },
    { tag: tags.quote, color: "#090" },
    { tag: tags.link, color: "#00c", textDecoration: "underline" },
    { tag: tags.url, color: "#00c" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strong, fontWeight: "bold" }
]);

/* CodeMirror 5 colored whole list lines (cm-variable-2), not just the bullet. */
const listLineDeco = Decoration.line({ class: "cm-list-line" });
const listLines = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;
        constructor(v: EditorView) {
            this.decorations = buildListLines(v);
        }
        update(u: ViewUpdate) {
            if (u.docChanged || u.viewportChanged) {
                this.decorations = buildListLines(u.view);
            }
        }
    },
    { decorations: (v) => v.decorations }
);

function buildListLines(v: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of v.visibleRanges) {
        for (let pos = from; pos <= to; ) {
            const line = v.state.doc.lineAt(pos);
            if (/^\s*([*+-]|\d+\.)\s/.test(line.text)) {
                builder.add(line.from, line.from, listLineDeco);
            }
            pos = line.to + 1;
        }
    }
    return builder.finish();
}

const fieldTheme = EditorView.theme({
    "&": { backgroundColor: "transparent" },
    ".cm-content": { fontFamily: "Arial, monospace", fontSize: "11pt" }
});

const rawTheme = EditorView.theme({
    "&": { backgroundColor: "transparent" }
});

function buildExtensions() {
    return [
        history(),
        markdown(),
        syntaxHighlighting(cm5Highlight),
        listLines,
        EditorView.lineWrapping,
        // CM6 does not capture Tab by default, so Tab moves focus (matching the old extraKeys config).
        keymap.of([...defaultKeymap, ...historyKeymap]),
        props.lineNumbers ? cmLineNumbers() : [],
        props.field ? fieldTheme : rawTheme,
        EditorView.updateListener.of((u) => {
            if (u.docChanged) {
                emit("update:modelValue", u.state.doc.toString());
            }
            if (u.focusChanged) {
                if (u.view.hasFocus) {
                    emit("focus");
                } else {
                    emit("blur");
                }
            }
        })
    ];
}

onMounted(() => {
    if (!host.value) {
        return;
    }
    view = new EditorView({
        state: EditorState.create({ doc: props.modelValue, extensions: buildExtensions() }),
        parent: host.value
    });
});

onBeforeUnmount(() => {
    view?.destroy();
    view = null;
});

// Apply external value changes (e.g. a parent reset) without feeding back into the editor.
watch(
    () => props.modelValue,
    (val) => {
        if (!view) {
            return;
        }
        const current = view.state.doc.toString();
        if (val !== current) {
            view.dispatch({ changes: { from: 0, to: current.length, insert: val } });
        }
    }
);

defineExpose({
    /** Focus the editor and place the cursor near the start (matches the old setCursor behaviour). */
    focus(): void {
        if (!view) {
            return;
        }
        view.focus();
        const line = view.state.doc.line(Math.min(2, view.state.doc.lines));
        view.dispatch({ selection: { anchor: Math.min(line.from + 1, line.to) } });
    }
});
</script>

<style scoped>
.cm-host {
    height: 100%;
    text-align: left;
}

/* Matches the original `grey lighten-3` Vuetify card the field CodeMirrors sat in. */
.cm-field {
    padding: 4px 0 4px 8px;
    background-color: #eeeeee;
}

.cm-host :deep(.cm-list-line) {
    color: #05a;
}
</style>
