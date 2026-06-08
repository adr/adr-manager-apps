<template>
    <v-card
        class="editor text-left d-flex flex-column px-0 pb-2 h-100"
        id="editor-convert"
        data-cy="convertEditor"
    >
        <v-card-title> Sorry, there were issues while parsing the ADR. </v-card-title>
        <div>
            If you want to use the MADR-Editor, our parser will generate the markdown on the right-hand side. You can
            edit your raw Markdown to make sure that no important content is lost while parsing. <br />
            Note, that we only support MADRs matching the template at
            <a href="https://github.com/adr/madr/blob/master/template/template.md" target="_blank">
                https://github.com/adr/madr/blob/master/template/template.md
            </a>
        </div>

        <div class="d-flex text-center">
            <h5 class="flex-grow-1 text-center">Your ADR</h5>
            <h5 class="flex-grow-1 text-center">Result</h5>
        </div>
        <div ref="host" class="flex-grow-1 overflow-auto"></div>

        <v-btn data-cy="acceptDiv" color="success" @click="accept"> Accept </v-btn>
    </v-card>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { MergeView } from "@codemirror/merge";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { adr2md, md2adr } from "@/plugins/parser";
import { debounce } from "@/utils/debounce";

const props = withDefaults(defineProps<{ raw?: string }>(), { raw: "" });
const emit = defineEmits<{ accept: [string] }>();

const host = useTemplateRef<HTMLDivElement>("host");
let merge: MergeView | null = null;
let mergeMd = props.raw;

const baseExt = [markdown(), syntaxHighlighting(defaultHighlightStyle), EditorView.lineWrapping];

function rightDoc(): string {
    return adr2md(md2adr(mergeMd));
}

const scheduleRight = debounce(() => {
    if (!merge) {
        return;
    }
    const next = rightDoc();
    const cur = merge.b.state.doc.toString();
    if (next !== cur) {
        merge.b.dispatch({ changes: { from: 0, to: cur.length, insert: next } });
    }
}, 300);

onMounted(() => {
    if (!host.value) {
        return;
    }
    merge = new MergeView({
        a: {
            doc: mergeMd,
            extensions: [
                ...baseExt,
                EditorView.updateListener.of((u) => {
                    if (u.docChanged) {
                        mergeMd = u.state.doc.toString();
                        scheduleRight();
                    }
                })
            ]
        },
        b: {
            doc: rightDoc(),
            extensions: [...baseExt, EditorState.readOnly.of(true)]
        },
        highlightChanges: true,
        gutter: true,
        parent: host.value
    });
});

// Re-seed the editable side when the source markdown changes (the slice clones the string).
watch(
    () => props.raw,
    (newRaw) => {
        mergeMd = (" " + newRaw).slice(1);
        if (merge) {
            const a = merge.a.state.doc.toString();
            merge.a.dispatch({ changes: { from: 0, to: a.length, insert: mergeMd } });
            scheduleRight();
        }
    }
);

onBeforeUnmount(() => {
    scheduleRight.cancel();
    merge?.destroy();
    merge = null;
});

function accept(): void {
    emit("accept", rightDoc());
}
</script>

<style scoped></style>
