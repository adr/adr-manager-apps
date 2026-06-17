<template>
    <div ref="wrap" class="fvp" data-tour="field-visibility">
        <button type="button" data-cy="fieldsBtn" class="btn btn-ghost fvp-btn" @click="open = !open">
            <span class="mdi mdi-tune-variant" aria-hidden="true"></span>
            Fields
        </button>
        <div v-if="open" data-cy="fvp-panel" class="menu fvp-panel">
            <div class="fvp-title">Visible fields</div>
            <label v-for="item in visibleFields" :key="item.key" :data-cy="'fvp-toggle-' + item.key" class="fvp-row">
                <span class="fvp-label">{{ item.label }}</span>
                <span class="fvp-switch" :class="{ on: store.fieldVisibility[item.key] }">
                    <input
                        type="checkbox"
                        :checked="store.fieldVisibility[item.key]"
                        @change="store.setFieldVisibility(item.key, ($event.target as HTMLInputElement).checked)"
                    />
                    <span class="fvp-thumb" aria-hidden="true"></span>
                </span>
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { useClickOutside } from "@/composables/useClickOutside";
import { store } from "@/plugins/store";
import { getMadrTemplateAdapter } from "@adr-manager/core";
import type { MadrTemplateVersion } from "@adr-manager/core";

const props = defineProps<{ templateVersion: MadrTemplateVersion }>();

const open = ref(false);
const wrap = useTemplateRef<HTMLElement>("wrap");
useClickOutside(wrap, () => (open.value = false));

const visibleFields = computed(() => getMadrTemplateAdapter(props.templateVersion).fields);
</script>

<style scoped>
.fvp {
    position: relative;
}

.fvp-panel {
    min-width: 220px;
    padding: 8px 0;
}

.fvp-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--adr-ink-3);
    padding: 2px 14px 8px;
}

.fvp-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 6px 14px;
    cursor: pointer;
    border-radius: 6px;
    margin: 0 6px;
}

.fvp-row:hover {
    background: var(--adr-surface-2);
}

.fvp-label {
    font-size: 13px;
    color: var(--adr-ink);
    user-select: none;
}

.fvp-switch {
    position: relative;
    width: 34px;
    height: 18px;
    flex-shrink: 0;
}

.fvp-switch input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
}

.fvp-thumb {
    position: absolute;
    inset: 0;
    background: var(--adr-line-strong);
    border-radius: 9px;
    transition: background 0.18s;
}

.fvp-thumb::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.18s;
}

.fvp-switch.on .fvp-thumb {
    background: var(--accent);
}

.fvp-switch.on .fvp-thumb::after {
    transform: translateX(16px);
}
</style>
