<template>
    <v-menu
        v-model="menu"
        :close-on-content-click="false"
        transition="scale-transition"
        location="bottom"
        max-width="290px"
        min-width="290px"
    >
        <template #activator="{ props }">
            <v-chip v-bind="props" variant="outlined">
                <v-icon class="mr-2">mdi-calendar</v-icon> {{ modelValue }}
            </v-chip>
        </template>
        <v-date-picker :model-value="date" hide-header @update:model-value="update"></v-date-picker>
    </v-menu>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = withDefaults(defineProps<{ modelValue?: string }>(), { modelValue: "" });
const emit = defineEmits<{ "update:modelValue": [string] }>();

const menu = ref(false);
const date = ref<Date>(new Date());

onMounted(() => {
    if (/\d{4}-\d{2}-\d{2}/.test(props.modelValue)) {
        date.value = new Date(props.modelValue);
    }
});

function update(value: unknown): void {
    menu.value = false;
    const picked = value instanceof Date ? value : new Date(String(value));
    if (!Number.isNaN(picked.getTime())) {
        date.value = picked;
        // The rest of the app stores dates as ISO yyyy-mm-dd strings.
        emit("update:modelValue", picked.toISOString().slice(0, 10));
    }
}
</script>
