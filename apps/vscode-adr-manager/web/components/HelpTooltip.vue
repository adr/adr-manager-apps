<template>
  <span class="help" tabindex="0">
    <i class="codicon codicon-question"></i>
    <span class="bubble"><slot></slot></span>
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "HelpTooltip"
});
</script>
