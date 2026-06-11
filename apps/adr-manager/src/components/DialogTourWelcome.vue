<template>
    <BaseDialog v-model="show" title="Welcome to ADR Manager" icon="compass-outline" :width="520">
        <p>
            ADR Manager helps you capture <strong>Architectural Decision Records</strong>: short Markdown documents that
            record an important design decision together with its context, the options that were considered and the
            consequences.
        </p>
        <p>
            Keeping ADRs next to your code preserves the reasoning behind your architecture. ADR Manager lets you
            create, edit and commit them in the MADR format straight to your Git repositories.
        </p>
        <p>Would you like a quick tour of the main features? You can replay it later from the help button.</p>
        <template #actions>
            <button type="button" class="btn btn-ghost" data-cy="tourDecline" @click="show = false">Maybe later</button>
            <button type="button" class="btn btn-primary" data-cy="tourAccept" @click="accept">Take the tour</button>
        </template>
    </BaseDialog>
</template>

<script setup lang="ts">
import BaseDialog from "./BaseDialog.vue";

const show = defineModel<boolean>({ default: false });

const emit = defineEmits<{ start: [] }>();

function accept(): void {
    show.value = false;
    emit("start");
}
</script>

<style scoped>
p {
    margin: 0 0 10px;
    line-height: 1.55;
}

p:last-of-type {
    margin-bottom: 0;
}
</style>
