<template>
    <div>
        <v-tabs v-model="tab" class="mx-0 px-0 pt-0 mt-0 flex-grow-0" bg-color="transparent">
            <div class="align-self-center pr-4">Editor Mode:</div>
            <v-tooltip v-for="item in modes" :key="item.name" open-delay="500" location="bottom">
                <template #activator="{ props }">
                    <v-tab variant="text" v-bind="props" @click="setMode(item.name)">
                        {{ item.name }}
                    </v-tab>
                </template>
                <span>{{ item.tooltip }}</span>
            </v-tooltip>
        </v-tabs>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { store } from "@/plugins/store";
import type { Mode } from "@/types/store";

interface ModeItem {
    name: Mode;
    tooltip: string;
}

const modes: ModeItem[] = [
    { name: "basic", tooltip: "Only show required fields." },
    { name: "professional", tooltip: "Show all fields." }
];

const tab = ref(modes.findIndex((m) => m.name === store.mode));

// Replaces the old store.$on("set-mode", ...) event-bus subscription.
watch(
    () => store.mode,
    (mode) => {
        tab.value = modes.findIndex((m) => m.name === mode);
    }
);

function setMode(mode: Mode): void {
    store.setMode(mode);
}
</script>

<style scoped></style>
