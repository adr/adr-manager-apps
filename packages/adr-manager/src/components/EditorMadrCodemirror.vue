<template>
    <div ref="host" class="cm-host"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers as cmLineNumbers } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";

const props = withDefaults(
    defineProps<{
        modelValue: string;
        lineNumbers?: boolean;
    }>(),
    { lineNumbers: false }
);

const emit = defineEmits<{
    "update:modelValue": [string];
    blur: [];
    focus: [];
}>();

const host = useTemplateRef<HTMLDivElement>("host");
let view: EditorView | null = null;

const theme = EditorView.theme({
    "&": { backgroundColor: "transparent" },
    ".cm-content": { fontFamily: "Arial, monospace", fontSize: "11pt" }
});

function buildExtensions() {
    return [
        history(),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        EditorView.lineWrapping,
        // CM6 does not capture Tab by default, so Tab moves focus (matching the old extraKeys config).
        keymap.of([...defaultKeymap, ...historyKeymap]),
        props.lineNumbers ? cmLineNumbers() : [],
        theme,
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
    /* Matches the original `grey lighten-3` Vuetify card the CodeMirror used to sit in. */
    background-color: #eeeeee;
}
</style>
