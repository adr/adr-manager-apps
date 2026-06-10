<template>
  <div class="tech-story">
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
        $emit('update:technicalStory', $event.target.value);
        $emit('validate');
      "
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HelpTooltip from "./HelpTooltip.vue";

export default defineComponent({
  name: "TemplateTechnicalStorySection",
  components: {
    HelpTooltip
  },
  props: {
    technicalStory: String
  },
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

#auto-grow-technical-story {
  overflow-y: hidden;
}
</style>
