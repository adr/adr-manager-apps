<template>
  <div class="section-head">
    <slot></slot>
    <span v-if="optional" class="opt">optional</span>
    <span v-if="versionTag" class="ver-tag">{{ versionTag }}</span>
    <HelpTooltip>{{ infoText }}</HelpTooltip>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HelpTooltip from "./HelpTooltip.vue";

export default defineComponent({
  name: "TemplateHeader",
  components: {
    HelpTooltip
  },
  props: {
    infoText: {
      type: String,
      required: true
    },
    optional: {
      type: Boolean,
      default: false
    },
    versionTag: {
      type: String,
      default: ""
    }
  }
});
</script>
