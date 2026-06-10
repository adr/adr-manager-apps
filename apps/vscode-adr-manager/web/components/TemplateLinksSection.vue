<template>
  <div class="links">
    <TemplateHeader :info-text="'Add references, e.g. to related ADRs.'" optional>
      <h2>Links</h2>
    </TemplateHeader>
    <draggable
      class="list"
      :list="links"
      :sort="true"
      handle=".links-grabber"
      @update="
        updateHeight();
        checkMove;
      "
    >
      <div v-for="(link, index) in linksWithBlank" :key="index" class="list-row">
        <span class="gutter" :class="links[index] === '' ? 'dimmed' : 'links-grabber'">
          <i class="codicon" :class="links[index] === '' ? 'codicon-add' : 'codicon-gripper'"></i>
        </span>
        <textarea
          v-model="links[index]"
          class="field auto-grow-link"
          placeholder="a link or reference, e.g. Refined by ADR-0005…"
          spellcheck="true"
          @input="updateArray($event.target.value, index)"
        />
        <button v-if="links[index] !== ''" type="button" class="row-del" title="Remove" @click="updateArray('', index)">
          <i class="codicon codicon-trash"></i>
        </button>
      </div>
    </draggable>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { VueDraggableNext } from "vue-draggable-next";
import TemplateHeader from "./TemplateHeader.vue";

export default defineComponent({
  name: "TemplateLinksSection",
  components: {
    TemplateHeader,
    draggable: VueDraggableNext
  },
  props: {
    linksProp: {
      type: Array as PropType<string[]>,
      default: []
    }
  },
  data() {
    return {
      links: this.linksProp
    };
  },
  computed: {
    /**
     * Computes a new links array with a blank entry at the end of the array such that
     * a blank input field is rendered for the user to enter a new link in.
     */
    linksWithBlank() {
      const linksWithBlank = this.links;
      linksWithBlank.push("");
      return linksWithBlank;
    }
  },
  mounted() {
    this.updateHeight();
  },
  methods: {
    /**
     * Prevents the user to drag an item below an empty input field that is reserved for new inputs.
     * @param evt The event fired upon causing an update with a drag
     */
    checkMove(evt: any) {
      if (this.links[evt.newIndex - 1] === "") {
        this.links[evt.newIndex - 1] = this.links[evt.newIndex];
        this.links.splice(evt.newIndex, 1);
        this.links = this.links.filter((link) => link !== "");
      }
    },
    /**
     * Updates the list of links.
     */
    updateArray(text: string, index: number) {
      this.links.splice(index, 1, text);
      this.links = this.links.filter((link) => link !== "");
      this.$emit("update:links", this.links);
      this.updateHeight();
    },
    /**
     * Updated the height of the textarea based on the input.
     */
    updateHeight() {
      this.$nextTick(() => {
        const links = document.querySelectorAll(".auto-grow-link") as NodeListOf<HTMLElement>;
        links.forEach((link) => {
          link.style.height = "auto";
          link.style.height = `${link.scrollHeight}px`;
        });
      });
    }
  }
});
</script>

<style scoped>
.auto-grow-link {
  overflow-y: hidden;
}
</style>
