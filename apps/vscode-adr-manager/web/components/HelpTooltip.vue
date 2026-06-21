<template>
  <span ref="anchorEl" class="help" tabindex="0" @pointerenter="show" @pointerleave="hide" @focus="show" @blur="hide">
    <i class="codicon codicon-question"></i>
    <Teleport to="body">
      <span v-if="open" ref="bubbleEl" class="help-bubble" :style="pos"><slot></slot></span>
    </Teleport>
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "HelpTooltip",
  data() {
    return {
      open: false,
      pos: { top: "0px", left: "0px" }
    };
  },
  beforeUnmount() {
    window.removeEventListener("scroll", this.place, true);
    window.removeEventListener("resize", this.place);
  },
  methods: {
    async show() {
      this.open = true;
      await this.$nextTick();
      this.place();
      window.addEventListener("scroll", this.place, true);
      window.addEventListener("resize", this.place);
    },
    hide() {
      this.open = false;
      window.removeEventListener("scroll", this.place, true);
      window.removeEventListener("resize", this.place);
    },
    place() {
      const anchor = this.$refs["anchorEl"] as HTMLElement | undefined;
      const bubble = this.$refs["bubbleEl"] as HTMLElement | undefined;
      if (!anchor || !bubble) {
        return;
      }
      const a = anchor.getBoundingClientRect();
      const margin = 8;
      const centre = a.left + a.width / 2;
      const left = Math.max(
        margin,
        Math.min(centre - bubble.offsetWidth / 2, window.innerWidth - bubble.offsetWidth - margin)
      );
      this.pos = { top: `${a.bottom + margin}px`, left: `${left}px` };
    }
  }
});
</script>
