<template>
    <v-card class="d-flex flex-column">
        <v-card-text class="px-0 py-0 my-0 position-relative h-100">
            <v-window v-model="tab" class="position-absolute h-100 w-100">
                <v-window-item value="MADR Editor" class="h-100">
                    <splitpanes class="mx-auto default-theme">
                        <pane class="h-100">
                            <v-card-text class="mx-auto mx-0 my-0 px-0 py-0 h-100">
                                <EditorMadr class="mx-auto mx-0 my-0 px-0 py-0 h-100" :value="adr" @input="updateAdrToMd" />
                            </v-card-text>
                        </pane>
                        <pane class="mx-auto overflow-y-auto" v-if="alwaysShowMarkdownPreview">
                            <v-card class="mx-auto">
                                <MarkdownPreview :value="dValue" />
                            </v-card>
                        </pane>
                    </splitpanes>
                </v-window-item>

                <v-window-item data-cy="convert" value="Convert" class="h-100">
                    <EditorConvert :raw="dValue" @accept="acceptAfterDiff" />
                </v-window-item>

                <v-window-item data-cy="markdownPreview" value="Markdown Preview" class="mx-auto overflow-y-auto h-100">
                    <MarkdownPreview :value="dValue" />
                </v-window-item>

                <v-window-item data-cy="editorRaw" value="Raw Markdown" class="h-100">
                    <splitpanes class="default-theme">
                        <pane class="mx-auto overflow-y-hidden">
                            <EditorRaw v-model="dValue" @input="updateMdToAdr" class="raw-editor" />
                        </pane>
                        <pane v-if="alwaysShowMarkdownPreview" class="mx-auto overflow-y-auto">
                            <v-card>
                                <MarkdownPreview :value="dValue" />
                            </v-card>
                        </pane>
                    </splitpanes>
                </v-window-item>
            </v-window>
        </v-card-text>

        <v-toolbar density="compact" color="primary" theme="dark" class="my-0 py-0 flex-grow-0">
            <v-spacer></v-spacer>
            <v-tabs v-model="tab" density="compact" class="pt-0 mt-0 align-self-end">
                <v-tab v-for="(item, i) in displayedTabs" :key="i" :value="item">
                    {{ item }}
                </v-tab>
            </v-tabs>
        </v-toolbar>
    </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ArchitecturalDecisionRecord } from "@/plugins/classes";
import { md2adr, adr2md } from "@/plugins/parser";
import { store } from "@/plugins/store";

import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";

import EditorMadr from "./EditorMadr.vue";
import EditorConvert from "./EditorConvert.vue";
import EditorRaw from "./EditorRaw.vue";
import MarkdownPreview from "./EditorMarkdownPreview.vue";
import type { AdrFile } from "@/types/adr";

// Aliases so the existing kebab-case template tags keep working.
const splitpanes = Splitpanes;
const pane = Pane;

const emit = defineEmits<{
    input: [string];
    "adr-file": [ArchitecturalDecisionRecord];
}>();

const adr = ref<ArchitecturalDecisionRecord>(new ArchitecturalDecisionRecord());
const dValue = ref("# Default ADR Editor heading");
const tab = ref("MADR Editor");
const tabs = ["MADR Editor", "Markdown Preview", "Raw Markdown"];
const alwaysShowMarkdownPreview = ref(false);

const editingAllowed = computed(
    () =>
        tab.value === "MADR Editor" ||
        (typeof dValue.value === "string" && adr2md(md2adr(dValue.value)) === dValue.value)
);

const displayedTabs = computed(() =>
    !editingAllowed.value ? tabs.map((val) => (val === "MADR Editor" ? "Convert" : val)) : tabs
);

// Initial open (replaces the Options API created() hook).
if (store.currentlyEditedAdr) {
    openAdrFile(store.currentlyEditedAdr);
} else {
    adr.value = new ArchitecturalDecisionRecord();
    dValue.value = adr2md(adr.value);
}

// Replaces the old store.$on("open-adr", openAdrFile) subscription.
watch(
    () => store.currentlyEditedAdr,
    (adrFile) => {
        if (adrFile) {
            openAdrFile(adrFile);
        }
    }
);

watch(dValue, (newValue) => {
    store.updateMdOfCurrentAdr(newValue);
    emit("input", newValue);
});

function openAdrFile(adrFile: AdrFile): void {
    const md = adrFile.editedMd;
    dValue.value = md;
    const tmpAdr = md2adr(md);
    const originalWithoutWhitespace = dValue.value.replace(/[ \r\n]/g, "").replace(/- /g, "* ");
    const roundtrippedWithoutWhiteSpace = adr2md(tmpAdr)
        .replace(/[ \r\n]/g, "")
        .replace(/- /g, "* ");
    if (originalWithoutWhitespace === roundtrippedWithoutWhiteSpace) {
        adr.value = tmpAdr;
        if (tab.value === "Convert") {
            tab.value = "MADR Editor";
        }
    } else if (tab.value === "MADR Editor") {
        tab.value = "Convert";
    }
}

function updateAdrToMd(updated: ArchitecturalDecisionRecord): void {
    if (tab.value === "MADR Editor") {
        dValue.value = adr2md(updated);
        emit("adr-file", updated);
    }
}

function updateMdToAdr(md: string): void {
    if (tab.value !== "MADR Editor") {
        adr.value = md2adr(md);
    }
}

function acceptAfterDiff(md: string): void {
    console.log("Accept in Editor - Switching Tab.");
    updateMdToAdr(md);
    tab.value = "MADR Editor";
}
</script>

<style scoped>
/* The raw-markdown editor fills its pane (was an inline max/min-width + height). */
.raw-editor {
    max-width: 100%;
    min-width: 100%;
    height: 100%;
}
</style>
