<template>
  <button type="button" class="opt-card opt-card-add" @click="$emit('addOption')">
    <span class="opt-head">
      <span class="opt-grip dimmed"><i class="codicon codicon-add"></i></span>
      <span class="add-label">Add a considered option…</span>
    </span>
  </button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "AddOptionButton",
  emits: ["addOption"]
});
</script>

<style scoped>
.opt-card-add {
  display: block;
  width: 100%;
  font: inherit;
  text-align: left;
  padding: 0;
  color: var(--adr-ink-3);
}

.opt-head {
  width: 100%;
}

.add-label {
  font-size: 14.5px;
  padding: 12px 6px;
}
</style>
