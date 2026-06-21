<template>
  <div class="hidden-fields-dialog" data-cy="hiddenFieldsDialog">
    <span class="codicon codicon-eye-closed dialog-icon" aria-hidden="true"></span>
    <div class="dialog-body">
      <p class="dialog-title">This ADR contains data in fields that are currently hidden.</p>
      <p class="dialog-note">
        One or more fields are toggled off in the field visibility settings, but this ADR has content in those fields.
        How would you like to open it?
      </p>
    </div>
    <div class="dialog-actions">
      <button
        type="button"
        data-cy="openWithFieldsVisible"
        class="btn btn-primary"
        @click="$emit('open-with-fields-visible')"
      >
        <span class="codicon codicon-eye" aria-hidden="true"></span>
        Show hidden fields
      </button>
      <button
        type="button"
        data-cy="openWithFieldsHidden"
        class="btn btn-secondary"
        @click="$emit('open-with-fields-hidden')"
      >
        <span class="codicon codicon-eye-closed" aria-hidden="true"></span>
        Open without hidden data
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "HiddenFieldsConvertDialog",
  emits: ["open-with-fields-visible", "open-with-fields-hidden"]
});
</script>

<style scoped>
.hidden-fields-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 32px;
  text-align: center;
  max-width: 520px;
  margin: 60px auto;
  border: 1px solid var(--adr-line);
  border-radius: 10px;
  background: var(--adr-surface);
}

.dialog-icon {
  font-size: 36px;
  color: var(--adr-warning);
}

.dialog-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--adr-ink);
  margin: 0;
}

.dialog-note {
  font-size: 13px;
  color: var(--adr-ink-2);
  line-height: 1.5;
  margin: 0;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
}
</style>
