<template>
    <div class="hidden-fields-dialog" data-cy="hiddenFieldsDialog">
        <span class="mdi mdi-eye-off dialog-icon" aria-hidden="true"></span>
        <h2 class="dialog-title">This ADR contains data in fields that are currently hidden.</h2>
        <p class="dialog-note">
            One or more fields are toggled off in the field visibility settings, but this ADR has content in those
            fields. How would you like to open it?
        </p>

        <div class="dialog-actions">
            <button
                type="button"
                data-cy="openWithFieldsVisible"
                class="btn btn-primary"
                @click="$emit('open-with-fields-visible')"
            >
                <span class="mdi mdi-eye" aria-hidden="true"></span>
                Show hidden fields
            </button>
            <button
                type="button"
                data-cy="openWithFieldsHidden"
                class="btn btn-secondary"
                @click="$emit('open-with-fields-hidden')"
            >
                <span class="mdi mdi-eye-off-outline" aria-hidden="true"></span>
                Open without hidden data
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
defineEmits<{
    "open-with-fields-visible": [];
    "open-with-fields-hidden": [];
}>();
</script>

<style scoped>
.hidden-fields-dialog {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 32px;
    text-align: center;
    gap: 16px;
}

.dialog-icon {
    font-size: 48px;
    color: var(--adr-ink-3);
}

.dialog-title {
    margin: 0;
    font-size: var(--adr-text-h2);
    font-weight: 500;
    color: var(--adr-navy);
}

.dialog-note {
    margin: 0;
    font-size: var(--adr-text-sm);
    color: var(--adr-ink-2);
    max-width: 480px;
}

.dialog-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
}
</style>
