<template>
    <BaseDialog :model-value="show" title="Remove Repository" icon="folder-remove" @update:model-value="emit('close')">
        <p>Are you sure you want to remove '{{ repoName }}'? Your changes will be deleted!</p>
        <p>You can always add it again using the 'Add repository' button.</p>
        <template #actions>
            <button type="button" data-cy="removeRepoBtn" class="btn btn-text-success" @click="emit('confirm')">
                Remove
            </button>
            <button type="button" class="btn btn-text-error" @click="emit('close')">Cancel</button>
        </template>
    </BaseDialog>
</template>

<script setup lang="ts">
import BaseDialog from "./BaseDialog.vue";

defineProps<{ show: boolean; repoName: string }>();

const emit = defineEmits<{
    close: [];
    confirm: [];
}>();
</script>
