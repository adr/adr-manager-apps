<template>
    <div class="convert" data-cy="convertEditor">
        <h2 class="convert-title">Sorry, there were issues while parsing the ADR.</h2>
        <p class="convert-note">
            If you want to use the MADR editor, our parser will generate the markdown on the right-hand side. You can
            edit your raw Markdown to make sure that no important content is lost while parsing. <br />
            Note, that we only support MADRs matching the template at
            <a href="https://github.com/adr/madr/blob/master/template/template.md" target="_blank">
                https://github.com/adr/madr/blob/master/template/template.md
            </a>
        </p>

        <div class="convert-heads">
            <h4>Your ADR</h4>
            <h4>Result</h4>
        </div>
        <div ref="host" class="convert-diff"></div>

        <button type="button" data-cy="acceptDiv" class="btn btn-primary accept-btn" @click="accept">
            <span class="mdi mdi-check" aria-hidden="true"></span>
            Accept
        </button>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { MergeView } from "@codemirror/merge";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { parseMadr, serializeMadr, DEFAULT_MADR_VERSION } from "@/plugins/parser";
import { debounce } from "@/utils/debounce";
import type { MadrTemplateVersion } from "@adr-manager/core";

const props = withDefaults(defineProps<{ raw?: string; templateVersion?: MadrTemplateVersion }>(), {
    raw: "",
    templateVersion: DEFAULT_MADR_VERSION
});
const emit = defineEmits<{ accept: [string] }>();

const host = useTemplateRef<HTMLDivElement>("host");
let merge: MergeView | null = null;
let mergeMd = props.raw;

const baseExtensions = [markdown(), syntaxHighlighting(defaultHighlightStyle), EditorView.lineWrapping];

function rightDoc(): string {
    return serializeMadr(parseMadr(mergeMd, props.templateVersion), props.templateVersion);
}

const scheduleRight = debounce(() => {
    if (!merge) {
        return;
    }
    const next = rightDoc();
    const current = merge.b.state.doc.toString();
    if (next !== current) {
        merge.b.dispatch({ changes: { from: 0, to: current.length, insert: next } });
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
                ...baseExtensions,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        mergeMd = update.state.doc.toString();
                        scheduleRight();
                    }
                })
            ]
        },
        b: {
            doc: rightDoc(),
            extensions: [...baseExtensions, EditorState.readOnly.of(true)]
        },
        highlightChanges: true,
        gutter: true,
        parent: host.value
    });
});

watch(
    () => props.raw,
    (newRaw) => {
        mergeMd = newRaw;
        if (merge) {
            const current = merge.a.state.doc.toString();
            if (current !== newRaw) {
                merge.a.dispatch({ changes: { from: 0, to: current.length, insert: newRaw } });
            }
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

<style scoped>
.convert {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px 32px;
    text-align: left;
}

.convert-title {
    margin: 0 0 8px;
    font-size: var(--adr-text-h2);
    font-weight: 500;
    color: var(--adr-navy);
}

.convert-note {
    margin: 0 0 18px;
    font-size: var(--adr-text-sm);
    color: var(--adr-ink-2);
}

.convert-heads {
    display: flex;
}

.convert-heads h4 {
    flex: 1 1 50%;
    text-align: center;
    margin: 0 0 6px;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--adr-ink-2);
}

.convert-diff {
    flex: 1 1 auto;
    overflow: auto;
    border: 1px solid var(--adr-line);
    border-radius: var(--adr-radius-md);
    background: var(--adr-surface);
    margin-bottom: 16px;
}

.accept-btn {
    align-self: flex-end;
}
</style>
