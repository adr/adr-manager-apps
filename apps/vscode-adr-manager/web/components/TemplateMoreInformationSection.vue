<template>
  <div class="more-information" :class="{ 'field-highlight': highlightedFields.has('moreInformation') }">
    <TemplateHeader
      :info-text="'Additional evidence, team agreement, when to revisit, and links to related decisions. Replaces \'Links\' from MADR 2.1.2.'"
      optional
      version-tag="4.0"
    >
      <h2>More Information</h2>
    </TemplateHeader>
    <textarea
      id="auto-grow-more-information"
      class="field"
      placeholder="Related decisions, team agreement, when/how to revisit…"
      spellcheck="true"
      :value="moreInformation"
      @input="
        updateHeight();
        $emit('update:moreInformation', ($event.target as HTMLTextAreaElement).value);
        $emit('validate');
      "
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import TemplateHeader from "./TemplateHeader.vue";
import type { FieldKey } from "@adr-manager/core";

export default defineComponent({
  name: "TemplateMoreInformationSection",
  components: {
    TemplateHeader
  },
  props: {
    moreInformation: {
      type: String,
      default: ""
    },
    highlightedFields: {
      type: Object as PropType<Set<FieldKey>>,
      default: () => new Set<FieldKey>()
    }
  },
  emits: ["update:moreInformation", "validate"],
  mounted() {
    this.updateHeight();
  },
  methods: {
    /**
     * Updated the height of the textarea based on the input.
     */
    updateHeight() {
      this.$nextTick(() => {
        const moreInformation = document.getElementById("auto-grow-more-information")!;
        moreInformation.style.height = "auto";
        moreInformation.style.height = `${moreInformation.scrollHeight}px`;
      });
    }
  }
});
</script>

<style scoped>
#auto-grow-more-information {
  min-height: 68px;
  overflow-y: hidden;
}

.field-highlight {
  border-left: 3px solid var(--adr-warning);
  background: color-mix(in srgb, var(--adr-warning) 10%, var(--adr-surface));
  border-radius: 0 4px 4px 0;
  padding-left: 8px;
}
</style>
