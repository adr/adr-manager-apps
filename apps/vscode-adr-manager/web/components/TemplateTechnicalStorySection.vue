<template>
  <div class="tech-story" :class="{ 'field-highlight': highlightedFields.has('technicalStory') }">
    <div class="subhead">
      <h4>Technical Story</h4>
      <HelpTooltip>Technical context of the ADR, e.g. a ticket or issue URL.</HelpTooltip>
    </div>
    <textarea
      id="auto-grow-technical-story"
      class="field"
      placeholder="e.g. JIRA-1234, or an issue URL…"
      spellcheck="true"
      :value="technicalStory"
      @input="
        updateHeight();
        $emit('update:technicalStory', ($event.target as HTMLTextAreaElement).value);
        $emit('validate');
      "
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import HelpTooltip from "./HelpTooltip.vue";
import type { FieldKey } from "@adr-manager/core";

export default defineComponent({
  name: "TemplateTechnicalStorySection",
  components: {
    HelpTooltip
  },
  props: {
    technicalStory: {
      type: String,
      default: ""
    },
    highlightedFields: {
      type: Object as PropType<Set<FieldKey>>,
      default: () => new Set<FieldKey>()
    }
  },
  emits: ["update:technicalStory", "validate"],
  mounted() {
    this.updateHeight();
  },
  methods: {
    /**
     * Updated the height of the textarea based on the input.
     */
    updateHeight() {
      this.$nextTick(() => {
        const ts = document.getElementById("auto-grow-technical-story")!;
        ts.style.height = "auto";
        ts.style.height = `${ts.scrollHeight}px`;
      });
    }
  }
});
</script>

<style scoped>
.tech-story {
  margin-top: 16px;
}

.field-highlight {
  border-left: 3px solid var(--adr-warning);
  background: color-mix(in srgb, var(--adr-warning) 10%, var(--adr-surface));
  border-radius: 0 4px 4px 0;
  padding-left: 8px;
}

#auto-grow-technical-story {
  overflow-y: hidden;
}
</style>
