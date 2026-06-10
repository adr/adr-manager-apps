<template>
    <BaseDialog :model-value="show" title="Delete ADR" icon="delete" @update:model-value="emit('close')">
        <p>Are you sure you want to delete '{{ adrPath }}'?</p>
        <template #actions>
            <button type="button" data-cy="dialogDeleteAdrBtn" class="btn btn-text-success" @click="emit('confirm')">
                Delete
            </button>
            <button type="button" class="btn btn-text-error" @click="emit('close')">Cancel</button>
        </template>
    </BaseDialog>
</template>

<script setup lang="ts">
import BaseDialog from "./BaseDialog.vue";

defineProps<{ show: boolean; adrPath: string }>();

const emit = defineEmits<{
    close: [];
    confirm: [];
}>();
</script>
