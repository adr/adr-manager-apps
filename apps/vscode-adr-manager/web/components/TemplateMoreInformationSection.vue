<template>
  <div class="more-information">
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
import { defineComponent } from "vue";
import TemplateHeader from "./TemplateHeader.vue";

export default defineComponent({
  name: "TemplateMoreInformationSection",
  components: {
    TemplateHeader
  },
  props: {
    moreInformation: {
      type: String,
      default: ""
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
</style>
