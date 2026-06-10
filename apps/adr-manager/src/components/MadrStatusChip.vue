<template>
    <span ref="wrap" class="status-wrap">
        <button type="button" data-cy="statusPro" class="chip status" :data-tone="tone" @click="open = !open">
            {{ modelValue || "no status" }}
            <span class="mdi mdi-menu-down" aria-hidden="true"></span>
        </button>
        <div v-if="open" class="menu status-menu">
            <div class="custom-status">
                <input
                    class="field"
                    placeholder="custom status…"
                    :value="modelValue"
                    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
                />
            </div>
            <div
                v-for="preset in STATUS_PRESETS"
                :key="preset"
                data-cy="statusOption"
                class="menu-item"
                :class="{ sel: modelValue === preset }"
                @click="selectPreset(preset)"
            >
                <span class="mi-radio"></span>
                <span class="mi-title preset-name">{{ preset }}</span>
            </div>
        </div>
    </span>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import { useClickOutside } from "@/composables/useClickOutside";

const STATUS_PRESETS = ["proposed", "rejected", "accepted", "deprecated", "superseded"];

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const open = ref(false);
const wrap = useTemplateRef<HTMLElement>("wrap");
useClickOutside(wrap, () => (open.value = false));

const tone = computed(() => (STATUS_PRESETS.includes(props.modelValue) ? props.modelValue : ""));

function selectPreset(preset: string): void {
    emit("update:modelValue", preset);
    open.value = false;
}
</script>

<style scoped>
.status-wrap {
    position: relative;
    display: inline-block;
}

.status-menu {
    left: 0;
    right: auto;
    min-width: 200px;
}

.custom-status {
    padding: 4px 6px 8px;
}

.preset-name {
    text-transform: capitalize;
}
</style>
