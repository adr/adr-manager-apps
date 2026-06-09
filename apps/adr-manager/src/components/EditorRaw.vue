<template>
    <v-card class="text-left overflow-y-auto" height="100%">
        <EditorMadrCodemirror
            data-cy="markdownText"
            :model-value="modelValue"
            :line-numbers="true"
            :field="false"
            @update:model-value="onInput"
        />
    </v-card>
</template>

<script setup lang="ts">
import EditorMadrCodemirror from "./EditorMadrCodemirror.vue";
import { debounce } from "@/utils/debounce";

defineProps<{ modelValue: string }>();
const emit = defineEmits<{
    "update:modelValue": [string];
    input: [string];
}>();

const onInput = debounce((value: string) => {
    emit("update:modelValue", value);
    emit("input", value);
}, 300);
</script>

<style scoped></style>
