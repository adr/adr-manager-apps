<template>
  <div class="list">
    <div v-for="(consequence, index) in list" :key="index" class="list-row">
      <span class="gutter"><i class="codicon codicon-gripper"></i></span>
      <button
        type="button"
        class="tone-label"
        :class="`tone-${consequence.kind}`"
        title="Click to change tone"
        @click="cycleTone(consequence)"
      >
        {{ consequence.kind }}
      </button>
      <textarea
        :ref="(el) => setRowRef(index, el)"
        v-model="consequence.text"
        class="field auto-grow-consequence"
        placeholder="a consequence of the decision…"
        spellcheck="true"
        @input="onTextInput"
        @blur="removeIfEmpty(index)"
      />
      <button type="button" class="row-del" title="Remove" tabindex="-1" @click="remove(index)" @mousedown.prevent>
        <i class="codicon codicon-trash"></i>
      </button>
    </div>
    <div class="list-row">
      <span class="gutter dimmed"><i class="codicon codicon-add"></i></span>
      <span class="tone-label tone-good">good</span>
      <textarea
        :value="draft"
        class="field"
        placeholder="add a consequence…"
        spellcheck="true"
        @input="commitDraft(($event.target as HTMLTextAreaElement).value)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

interface Consequence {
  kind: string;
  text: string;
}

const TONES = ["good", "neutral", "bad"];

export default defineComponent({
  name: "ConsequenceListEditor",
  props: {
    list: {
      type: Array as PropType<Consequence[]>,
      required: true
    }
  },
  emits: ["changed"],
  data() {
    return {
      draft: "",
      rowRefs: [] as HTMLTextAreaElement[]
    };
  },
  mounted() {
    this.updateHeights();
  },
  methods: {
    setRowRef(index: number, el: unknown) {
      if (el instanceof HTMLTextAreaElement) {
        this.rowRefs[index] = el;
      }
    },
    cycleTone(consequence: Consequence) {
      const next = (TONES.indexOf(consequence.kind) + 1) % TONES.length;
      consequence.kind = TONES[next];
      this.$emit("changed");
    },
    commitDraft(text: string) {
      this.draft = text;
      if (text.trim() === "") {
        return;
      }
      this.list.push({ kind: "good", text });
      this.draft = "";
      this.$emit("changed");
      const newIndex = this.list.length - 1;
      this.$nextTick(() => {
        this.rowRefs[newIndex]?.focus();
        this.updateHeights();
      });
    },
    remove(index: number) {
      this.list.splice(index, 1);
      this.$emit("changed");
    },
    removeIfEmpty(index: number) {
      if (this.list[index]?.text.trim() === "") {
        this.remove(index);
      }
    },
    onTextInput() {
      this.$emit("changed");
      this.updateHeights();
    },
    updateHeights() {
      this.$nextTick(() => {
        const rows = document.querySelectorAll(".auto-grow-consequence") as NodeListOf<HTMLElement>;
        rows.forEach((row) => {
          row.style.height = "auto";
          row.style.height = `${row.scrollHeight}px`;
        });
      });
    }
  }
});
</script>

<style scoped>
.gutter {
  cursor: default;
}

button.tone-label {
  border: 0;
  cursor: pointer;
  font-family: inherit;
}

.auto-grow-consequence {
  overflow-y: hidden;
}
</style>
