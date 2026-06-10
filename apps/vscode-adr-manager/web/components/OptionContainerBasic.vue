<template>
  <div class="opt-card" :class="{ chosen }">
    <div class="opt-head">
      <span class="opt-grip"><i class="codicon codicon-gripper"></i></span>
      <button type="button" class="opt-choose" title="Mark as chosen option" @click="$emit('selectOption')">
        <i class="codicon" :class="chosen ? 'codicon-pass-filled' : 'codicon-circle-large-outline'"></i>
      </button>
      <span class="opt-title" @click="$emit('selectOption')">{{ shortTitle || "(untitled option)" }}</span>
      <span v-if="chosen" class="chosen-tag">chosen</span>
      <div class="opt-actions">
        <button type="button" class="icon-btn" title="Rename option" @click="$emit('editOption')">
          <i class="codicon codicon-edit"></i>
        </button>
        <button type="button" class="icon-btn danger" title="Remove option" @click="$emit('deleteOption')">
          <i class="codicon codicon-trash"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { createShortTitle } from "../../src/plugins/utils";

export default defineComponent({
  name: "OptionContainerBasic",
  props: {
    title: {
      type: String,
      default: ""
    },
    chosen: {
      type: Boolean,
      default: false
    }
  },
  emits: ["selectOption", "editOption", "deleteOption"],
  computed: {
    shortTitle() {
      return createShortTitle(this.title);
    }
  }
});
</script>

<style scoped>
.opt-title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--adr-ink);
  padding: 12px 6px;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.opt-card.chosen .opt-title {
  font-weight: 700;
}
</style>
