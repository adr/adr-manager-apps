<template>
  <div class="decision-drivers" :class="{ 'field-highlight': highlightedFields.has('decisionDrivers') }">
    <TemplateHeader
      :info-text="'Decision Drivers are competing forces or facing concerns that influence the decision.'"
      optional
    >
      <h2>Decision Drivers</h2>
    </TemplateHeader>
    <draggable
      class="list"
      :list="decisionDrivers"
      :sort="true"
      handle=".drivers-grabber"
      @update="
        updateHeight();
        checkMove($event);
      "
    >
      <div v-for="(_, index) in decisionDriversWithBlank" :key="index" class="list-row">
        <span class="gutter" :class="decisionDrivers[index] === '' ? 'dimmed' : 'drivers-grabber'">
          <i class="codicon" :class="decisionDrivers[index] === '' ? 'codicon-add' : 'codicon-gripper'"></i>
        </span>
        <textarea
          v-model="decisionDrivers[index]"
          class="field auto-grow-decision-driver"
          placeholder="a decision driver, e.g. a force or concern…"
          spellcheck="true"
          @input="updateArray(($event.target as HTMLTextAreaElement).value, index)"
        />
        <button
          v-if="decisionDrivers[index] !== ''"
          type="button"
          class="row-del"
          title="Remove"
          @click="updateArray('', index)"
        >
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
import type { FieldKey } from "@adr-manager/core";

export default defineComponent({
  name: "TemplateDecisionDriversSection",
  components: {
    TemplateHeader,
    draggable: VueDraggableNext
  },
  props: {
    decisionDriversProp: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    highlightedFields: {
      type: Object as PropType<Set<FieldKey>>,
      default: () => new Set<FieldKey>()
    }
  },
  emits: ["update:decisionDrivers"],
  data() {
    return {
      decisionDrivers: this.decisionDriversProp
    };
  },
  computed: {
    /**
     * Computes a new decision drivers array with a blank entry at the end of the array such that
     * a blank input field is rendered for the user to enter a new decision driver in.
     */
    decisionDriversWithBlank() {
      const decisionDriversWithBlank = this.decisionDrivers;
      decisionDriversWithBlank.push("");
      return decisionDriversWithBlank;
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
    checkMove(evt: { newIndex: number }) {
      if (this.decisionDrivers[evt.newIndex - 1] === "") {
        this.decisionDrivers[evt.newIndex - 1] = this.decisionDrivers[evt.newIndex];
        this.decisionDrivers.splice(evt.newIndex, 1);
        this.decisionDrivers = this.decisionDrivers.filter((driver) => driver !== "");
      }
    },
    /**
     * Updates the list of decision drivers/links.
     */
    updateArray(text: string, index: number) {
      this.decisionDrivers.splice(index, 1, text);
      this.decisionDrivers = this.decisionDrivers.filter((driver) => driver !== "");
      this.$emit("update:decisionDrivers", this.decisionDrivers);
      this.updateHeight();
    },
    /**
     * Updated the height of the textarea based on the input.
     */
    updateHeight() {
      this.$nextTick(() => {
        const decisionDrivers = document.querySelectorAll(".auto-grow-decision-driver")! as NodeListOf<HTMLElement>;
        decisionDrivers.forEach((driver) => {
          driver.style.height = "auto";
          driver.style.height = `${driver.scrollHeight}px`;
        });
      });
    }
  }
});
</script>

<style scoped>
.auto-grow-decision-driver {
  overflow-y: hidden;
}

.field-highlight {
  border-left: 3px solid var(--adr-warning);
  background: color-mix(in srgb, var(--adr-warning) 10%, var(--adr-surface));
  border-radius: 0 4px 4px 0;
  padding-left: 8px;
}
</style>
