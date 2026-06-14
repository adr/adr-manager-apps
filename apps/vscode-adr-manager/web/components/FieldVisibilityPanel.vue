<template>
  <div ref="wrap" class="fvp" data-tour="field-visibility">
    <button
      type="button"
      class="btn btn-ghost fvp-btn"
      data-cy="field-visibility-toggle"
      :aria-expanded="open"
      @click="open = !open"
    >
      <i class="codicon codicon-settings-gear"></i>
      Fields
    </button>
    <div v-if="open" class="fvp-panel" data-cy="field-visibility-panel">
      <div class="fvp-title">Visible fields</div>
      <label v-for="item in visibleFields" :key="item.key" class="fvp-row">
        <span class="fvp-label">{{ item.label }}</span>
        <span class="fvp-switch" :class="{ on: fieldVisibility[item.key as keyof FieldVisibility] }">
          <input
            type="checkbox"
            :data-cy="`field-visibility-${item.key}`"
            :aria-label="`Show ${item.label}`"
            :checked="fieldVisibility[item.key as keyof FieldVisibility]"
            @change="$emit('setFieldVisibility', item.key, ($event.target as HTMLInputElement).checked)"
          />
          <span class="fvp-thumb" aria-hidden="true"></span>
        </span>
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import type { FieldVisibility } from "@adr-manager/core";

interface FieldEntry {
  key: string;
  label: string;
}

const FIELDS_212: FieldEntry[] = [
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "deciders", label: "Deciders" },
  { key: "technicalStory", label: "Technical Story" },
  { key: "decisionDrivers", label: "Decision Drivers" },
  { key: "optionDescription", label: "Option Description" },
  { key: "optionProsAndCons", label: "Option Pros & Cons" },
  { key: "positiveConsequences", label: "Positive Consequences" },
  { key: "negativeConsequences", label: "Negative Consequences" },
  { key: "links", label: "Links" },
  { key: "relevantFiles", label: "Relevant Files" }
];

const FIELDS_400: FieldEntry[] = [
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "deciders", label: "Decision-makers" },
  { key: "consulted", label: "Consulted" },
  { key: "informed", label: "Informed" },
  { key: "decisionDrivers", label: "Decision Drivers" },
  { key: "optionDescription", label: "Option Description" },
  { key: "optionProsAndCons", label: "Option Pros & Cons" },
  { key: "consequences", label: "Consequences" },
  { key: "confirmation", label: "Confirmation" },
  { key: "moreInformation", label: "More Information" },
  { key: "relevantFiles", label: "Relevant Files" }
];

export default defineComponent({
  name: "FieldVisibilityPanel",
  props: {
    templateVersion: {
      type: String,
      default: "2.1.2"
    },
    fieldVisibility: {
      type: Object as PropType<FieldVisibility>,
      required: true
    }
  },
  emits: ["setFieldVisibility"],
  data() {
    return {
      open: false
    };
  },
  computed: {
    visibleFields(): FieldEntry[] {
      return this.templateVersion === "4.0.0" ? FIELDS_400 : FIELDS_212;
    }
  },
  mounted() {
    document.addEventListener("click", this.handleOutsideClick);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleOutsideClick);
  },
  methods: {
    handleOutsideClick(event: MouseEvent) {
      const wrap = this.$refs["wrap"] as HTMLElement | undefined;
      if (wrap && !wrap.contains(event.target as Node)) {
        this.open = false;
      }
    }
  }
});
</script>

<style scoped>
.fvp {
  position: relative;
}

.fvp-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  background: var(--adr-surface);
  border: 1px solid var(--adr-line);
  border-radius: 8px;
  box-shadow: var(--adr-shadow-pop);
  padding: 8px 0;
  z-index: 60;
}

.fvp-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--adr-ink-3);
  padding: 2px 14px 8px;
}

.fvp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 14px;
  cursor: pointer;
  border-radius: 6px;
  margin: 0 6px;
}

.fvp-row:hover {
  background: var(--adr-surface-2);
}

.fvp-label {
  font-size: 13px;
  color: var(--adr-ink);
  user-select: none;
}

.fvp-switch {
  position: relative;
  width: 34px;
  height: 18px;
  flex-shrink: 0;
}

.fvp-switch input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.fvp-thumb {
  position: absolute;
  inset: 0;
  background: var(--adr-line-strong);
  border-radius: 9px;
  transition: background 0.18s;
}

.fvp-thumb::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.18s;
}

.fvp-switch.on .fvp-thumb {
  background: var(--accent);
}

.fvp-switch.on .fvp-thumb::after {
  transform: translateX(16px);
}
</style>
