<template>
    <div ref="wrap" class="verselect">
        <button type="button" data-cy="versionSelect" class="verselect-btn" @click="open = !open">
            <span class="mdi mdi-file-tree-outline" aria-hidden="true"></span>
            <span class="vlabel">MADR {{ modelValue }}</span>
            <span class="ver-pill">TEMPLATE</span>
            <span class="mdi mdi-menu-down" aria-hidden="true"></span>
        </button>
        <div v-if="open" class="menu">
            <div
                v-for="version in VERSIONS"
                :key="version.id"
                data-cy="versionOption"
                class="menu-item"
                :class="{ sel: modelValue === version.id }"
                @click="select(version.id)"
            >
                <span class="mi-radio"></span>
                <div>
                    <div class="mi-title">
                        {{ version.label }}
                        <small>{{ version.sub }}</small>
                    </div>
                    <div class="mi-desc">{{ version.desc }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { useClickOutside } from "@/composables/useClickOutside";
import type { MadrTemplateVersion } from "@adr-manager/core";

interface VersionEntry {
    id: MadrTemplateVersion;
    label: string;
    sub: string;
    desc: string;
}

const VERSIONS: VersionEntry[] = [
    {
        id: "4.0.0",
        label: "MADR 4.0.0",
        sub: "latest",
        desc: "Decision-makers / consulted / informed, combined Consequences, Confirmation, neutral arguments and a More Information section."
    },
    {
        id: "2.1.2",
        label: "MADR 2.1.2",
        sub: "classic",
        desc: "The classic template: deciders, Technical Story, separate Positive / Negative Consequences and Links."
    }
];

defineProps<{ modelValue: MadrTemplateVersion }>();
const emit = defineEmits<{ "update:modelValue": [MadrTemplateVersion] }>();

const open = ref(false);
const wrap = useTemplateRef<HTMLElement>("wrap");
useClickOutside(wrap, () => (open.value = false));

function select(version: MadrTemplateVersion): void {
    emit("update:modelValue", version);
    open.value = false;
}
</script>

<style scoped>
.verselect {
    position: relative;
}

.verselect-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 38px;
    padding: 0 10px 0 13px;
    background: var(--adr-surface);
    border: 1px solid var(--adr-line-strong);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    color: var(--adr-ink);
    white-space: nowrap;
}

.verselect-btn:hover {
    background: var(--adr-surface-2);
}

.verselect-btn .vlabel {
    font-weight: 500;
}

.verselect-btn .mdi {
    font-size: 18px;
    color: var(--adr-ink-2);
}

.verselect .menu {
    left: 0;
    right: auto;
}

.mi-title small {
    font-weight: 600;
    color: var(--accent-600);
    margin-left: 6px;
}
</style>
