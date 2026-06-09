<template>
    <div>
        <v-row class="pl-0 mx-0 my-1">
            <v-col class="mx-0 my-0 px-0 py-0">
                <label>Last Update:</label>
                <DatePickerMenu v-model="adr.date"></DatePickerMenu>
                <HelpIcon> The date of the last update </HelpIcon>
            </v-col>
            <v-col class="mx-0 my-0 px-0 py-0">
                <label>Status:</label>
                <v-menu v-model="showStatusDropdown" :close-on-content-click="false" location="bottom end">
                    <template #activator="{ props }">
                        <v-chip data-cy="statusPro" variant="outlined" :color="statusColor" v-bind="props">
                            {{ displayedStatus }}
                        </v-chip>
                    </template>
                    <v-list class="mx-0 px-0 py-0 my-0">
                        <v-list-item class="mx-0 px-0 py-0 my-0">
                            <v-text-field
                                ref="statustextfield"
                                density="compact"
                                variant="filled"
                                hide-details
                                class="mx-0 px-0 py-0 my-0"
                                placeholder="custom status"
                                v-model="adr.status"
                            ></v-text-field>
                        </v-list-item>
                        <v-list-item
                            v-for="(item, index) in statusSuggestions"
                            :key="index"
                            @click="selectStatus(item.name)"
                        >
                            <v-list-item-title v-text="item.name" />
                        </v-list-item>
                    </v-list>
                </v-menu>
                <HelpIcon> The current status of the ADR </HelpIcon>
            </v-col>
            <v-col class="mx-0 my-0 px-0 py-0">
                <label>Deciders:</label>
                <v-chip variant="outlined">
                    <div @click="focusDecidersTextField">
                        <v-icon class="mr-2">mdi-account-multiple</v-icon>
                        <input
                            data-cy="authorPro"
                            type="text"
                            ref="deciderstextfield"
                            v-autowidth="{ maxWidth: '960px', minWidth: '60px', comfortZone: 0 }"
                            v-model="adr.deciders"
                        />
                    </div>
                </v-chip>
                <HelpIcon> Everyone involved in the decision, e.g., separated with commas. </HelpIcon>
            </v-col>
        </v-row>

        <v-row class="pl-0 mx-0 my-4">
            <v-col class="mx-0 my-0 px-0 py-0 align-self-center tech-story-label">
                <h5>Technical Story:</h5>
            </v-col>
            <v-col class="my-0 py-0">
                <EditorMadrCodemirror data-cy="technicalStoryPro" v-model="adr.technicalStory" />
            </v-col>
            <HelpIcon> Technical context of the ADR, e.g., a ticket or issue URL </HelpIcon>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import DatePickerMenu from "./DatePickerMenu.vue";
import EditorMadrCodemirror from "./EditorMadrCodemirror.vue";
import HelpIcon from "./HelpIcon.vue";
import { vAutowidth } from "@/directives/autowidth";
import type { ArchitecturalDecisionRecord } from "@/plugins/classes";

interface StatusPreset {
    name: string;
    color?: string;
}

const props = defineProps<{ adr: ArchitecturalDecisionRecord }>();

const showStatusDropdown = ref(false);
const statusPresets: StatusPreset[] = [
    { name: "proposed" },
    { name: "rejected", color: "red" },
    { name: "accepted", color: "success" },
    { name: "deprecated" },
    { name: "superseded" }
];

const statusField = useTemplateRef<{ focus: () => void }>("statustextfield");
const decidersField = useTemplateRef<HTMLInputElement>("deciderstextfield");

const displayedStatus = computed(() =>
    props.adr.status && props.adr.status !== "" ? props.adr.status.toUpperCase() : "No status"
);

const statusColor = computed<string | undefined>(() => {
    const status = statusPresets.find((item) => item.name === props.adr.status);
    if (status) {
        return status.color;
    }
    if (props.adr.status.trim() === "") {
        return "grey";
    }
    return undefined;
});

const statusSuggestions = computed(() => statusPresets.filter((item) => item.name !== props.adr.status));

// Focus the status text field shortly after the menu opens (immediate focus does not work).
watch(showStatusDropdown, (open) => {
    if (open) {
        setTimeout(() => statusField.value?.focus(), 100);
    }
});

function selectStatus(name: string): void {
    props.adr.status = name;
    showStatusDropdown.value = false;
}

function focusDecidersTextField(): void {
    decidersField.value?.focus();
}
</script>

<style scoped>
label {
    font-weight: bold;
    margin-right: 5px;
}

/* Keeps the "Technical Story:" label column narrow so the editor gets the rest of the row. */
.tech-story-label {
    max-width: 150px;
}
</style>
