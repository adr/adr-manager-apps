<template>
    <v-container fluid class="editor text-left d-flex flex-column mx-0" id="editor-madr">
        <v-sheet class="mx-auto mx-0 my-0 px-0 py-0 h-100 w-100">
            <v-container fluid class="mx-auto overflow-y-auto scroll px-8 h-100">
                <v-row class="my-0">
                    <v-text-field
                        data-cy="titleAdr"
                        class="title-field"
                        variant="filled"
                        density="compact"
                        placeholder="Title"
                        :autofocus="true"
                        hint="Changing the title changes the file name. Do not use special characters."
                        v-model="adr.title"
                    >
                        <template #append>
                            <HelpIcon>
                                This is the Title. <br />
                                It should describe the solved problem and the solution concisely. <br />
                                The title is also used as file name, so keep it short and avoid using special
                                characters.
                            </HelpIcon>
                        </template>
                    </v-text-field>
                </v-row>

                <v-alert v-if="isModeTooLow" border="start" type="warning" elevation="2" class="my-4 py-2">
                    <div class="d-flex my-0 py-0">
                        <span class="flex-grow-1 align-self-center my-0 py-0">
                            Some fields of this ADR are not displayed in the current mode.
                        </span>
                        <v-btn
                            color="white"
                            class="justify-self-end align-self-end my-0 py-0"
                            @click="switchToMinimumRequiredMode()"
                        >
                            Switch to {{ minimumRequiredModeForAdr(adr) }} Mode
                        </v-btn>
                    </div>
                </v-alert>

                <StatusDateDecidersStory v-if="mode !== 'basic'" class="mb-8" :adr="adr" />

                <v-divider class="my-0" />

                <v-row class="mt-8 mb-1 mx-0">
                    <h3 class="d-inline-flex">
                        Context and Problem Statement
                        <HelpIcon>
                            Describe the context and problem statement, e.g., in free form using two to three sentences.
                            <br />
                            You may want to articulate the problem in form of a question.
                        </HelpIcon>
                    </h3>
                </v-row>
                <v-card flat class="mb-8">
                    <codemirror data-cy="contextAdr" v-model="adr.contextAndProblemStatement" class="context-cm" />
                </v-card>

                <div v-if="mode === 'professional'">
                    <v-divider class="my-8" />
                    <v-row class="mx-0 my-1">
                        <h3 class="d-inline-flex">
                            Decision Drivers
                            <HelpIcon>
                                Decision Drivers are competing forces or facing concerns that influence the decision.
                            </HelpIcon>
                        </h3>
                    </v-row>
                    <GenericList :list="adr.decisionDrivers" />
                </div>

                <v-divider class="my-8" />

                <ConsideredOptions :adr="adr" :mode="mode" />

                <v-divider class="my-8" />
                <DecisionOutcome :adr="adr" :mode="mode" />

                <div v-if="mode === 'professional'">
                    <v-divider class="my-8" />
                    <v-row class="mx-0 mb-1">
                        <h3 class="d-inline-flex">
                            Links
                            <HelpIcon> Add references, e.g., to related ADRs </HelpIcon>
                        </h3>
                    </v-row>
                    <GenericList data-cy="linkPro" :list="adr.links" />
                </div>

                <div class="my-16"></div>
            </v-container>
        </v-sheet>
    </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { store } from "@/plugins/store";
import { ArchitecturalDecisionRecord } from "@/plugins/classes";
import codemirror from "./EditorMadrCodemirror.vue";
import StatusDateDecidersStory from "./EditorMadrStatusDateDecidersStory.vue";
import DecisionOutcome from "./EditorMadrDecisionOutcome.vue";
import ConsideredOptions from "./EditorMadrConsideredOptions.vue";
import HelpIcon from "./HelpIcon.vue";
import GenericList from "./EditorMadrList.vue";
import type { Mode } from "@/types/store";

const props = defineProps<{ value: ArchitecturalDecisionRecord }>();
const emit = defineEmits<{ input: [ArchitecturalDecisionRecord] }>();

const adr = ref<ArchitecturalDecisionRecord>(props.value);
watch(
    () => props.value,
    (value) => {
        adr.value = value;
    }
);
// Any deep edit (incl. from the sub-editors that mutate the shared ADR) propagates upward.
watch(adr, () => emit("input", adr.value), { deep: true });

const mode = computed<Mode>(() => store.mode);

function minimumRequiredModeForAdr(a: ArchitecturalDecisionRecord): Mode {
    if (a.decisionDrivers.length > 0 || a.links.length > 0) {
        return "professional";
    }
    return "basic";
}

const isModeTooLow = computed<boolean>(
    () => mode.value === "basic" && minimumRequiredModeForAdr(adr.value) !== "basic"
);

function switchToMinimumRequiredMode(): void {
    store.setMode(minimumRequiredModeForAdr(adr.value));
}
</script>

<style scoped>
/* The ADR title renders large, like the original 28px Roboto heading. */
.title-field :deep(input) {
    font-family: Roboto, sans-serif;
    font-size: 28px;
    font-weight: 500;
}

/* Give the context CodeMirror a sensible minimum height. */
.context-cm {
    min-height: 100px;
}
</style>
