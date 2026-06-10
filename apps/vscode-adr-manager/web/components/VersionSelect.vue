<template>
  <div ref="wrap" class="verselect">
    <button type="button" class="verselect-btn" @click="open = !open">
      <i class="codicon codicon-list-tree"></i>
      <span class="vlabel">MADR {{ modelValue }}</span>
      <span class="ver-pill">TEMPLATE</span>
      <i class="codicon codicon-chevron-down"></i>
    </button>
    <div v-if="open" class="menu">
      <div
        v-for="version in versions"
        :key="version.id"
        class="menu-item"
        :class="{ sel: modelValue === version.id }"
        @click="select(version.id)"
      >
        <span class="mi-radio"></span>
        <div>
          <div class="mi-title">
            {{ version.label }}
            <small>{{ version.sub }}</small>
          </div>
          <div class="mi-desc">{{ version.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "VersionSelect",
  props: {
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ["update:modelValue"],
  data() {
    return {
      open: false,
      versions: [
        {
          id: "4.0.0",
          label: "MADR 4.0.0",
          sub: "latest",
          desc: "Decision-makers / consulted / informed, combined Consequences, Confirmation, neutral arguments and a More Information section."
        },
        {
          id: "2.1.2",
          label: "MADR 2.1.2",
          sub: "classic",
          desc: "The classic template: deciders, Technical Story, separate Positive / Negative Consequences and Links."
        }
      ]
    };
  },
  mounted() {
    document.addEventListener("click", this.onDocumentClick);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.onDocumentClick);
  },
  methods: {
    select(version: string) {
      this.$emit("update:modelValue", version);
      this.open = false;
    },
    onDocumentClick(event: MouseEvent) {
      if (!(this.$refs.wrap as HTMLElement).contains(event.target as Node)) {
        this.open = false;
      }
    }
  }
});
</script>

<style scoped>
.verselect {
  position: relative;
}

.verselect-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 10px 0 13px;
  background: var(--adr-surface);
  border: 1px solid var(--adr-line-strong);
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--adr-text-sm);
  color: var(--adr-ink);
  white-space: nowrap;
}

.verselect-btn:hover {
  background: var(--adr-surface-2);
}

.verselect-btn .vlabel {
  font-weight: 500;
}

.verselect-btn .codicon {
  font-size: 15px;
  color: var(--adr-ink-2);
}

.mi-title small {
  font-weight: 600;
  color: var(--accent-600);
  margin-left: 6px;
}

body.vscode-dark .mi-title small {
  color: color-mix(in srgb, var(--accent) 55%, var(--adr-ink));
}
</style>
