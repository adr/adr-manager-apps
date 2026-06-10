<template>
    <textarea
        ref="host"
        class="field"
        :rows="minRows"
        :value="modelValue"
        :placeholder="placeholder"
        @input="onInput"
    ></textarea>
</template>

<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef, watch } from "vue";

const props = withDefaults(defineProps<{ modelValue: string; placeholder?: string; minRows?: number }>(), {
    placeholder: "",
    minRows: 1
});

const emit = defineEmits<{ "update:modelValue": [string] }>();

const host = useTemplateRef<HTMLTextAreaElement>("host");

function resize(): void {
    const el = host.value;
    if (!el) {
        return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, props.minRows * 24 + 20)}px`;
}

function onInput(event: Event): void {
    emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
    resize();
}

onMounted(resize);
watch(
    () => props.modelValue,
    () => void nextTick(resize)
);
</script>
