<template>
  <article class="adr-card" :class="{ broken: !adr.adr.conforming }">
    <div
      class="adr-row"
      role="button"
      tabindex="0"
      :title="adr.adr.conforming ? 'Open in ADR Manager' : 'Open in text editor'"
      @click="open"
      @keydown.enter="open"
    >
      <span class="adr-number">{{ getAdrNumber }}</span>
      <div class="adr-text">
        <span class="adr-title">{{ adr.adr.title || "(No title)" }}</span>
        <span class="adr-path">{{ adr.relativePath }}</span>
      </div>
      <span v-if="statusTone" class="chip status small" :data-tone="statusTone">{{ adr.adr.status }}</span>
      <div class="adr-actions">
        <button
          type="button"
          class="icon-btn"
          title="Open Markdown file"
          @click.stop="$emit('requestEdit')"
          @keydown.enter.stop
        >
          <i class="codicon codicon-go-to-file"></i>
        </button>
        <button
          type="button"
          class="icon-btn danger"
          title="Delete ADR"
          @click.stop="$emit('requestDelete')"
          @keydown.enter.stop
        >
          <i class="codicon codicon-trash"></i>
        </button>
      </div>
    </div>
    <ul v-if="!adr.adr.conforming" class="parse-errors">
      <li v-for="(error, index) in adr.adr.parseErrors" :key="index">
        <i class="codicon codicon-error"></i>
        Parsing error at line {{ error.line }}, position {{ error.charPosition }}: {{ error.message }}
      </li>
    </ul>
  </article>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

const STATUS_TONES = ["proposed", "rejected", "accepted", "deprecated", "superseded"];

// Shape of one entry of the JSON-parsed ADR list sent by the extension host (see WebPanel.fetchAdrs).
type AdrListEntry = {
  adr: {
    title: string;
    status: string;
    conforming: boolean;
    parseErrors: { line: number; charPosition: number; message: string }[];
  };
  fullPath: string;
  relativePath: string;
  fileName: string;
};

export default defineComponent({
  name: "ADRContainer",
  props: {
    adr: {
      type: Object as PropType<AdrListEntry>,
      required: true
    }
  },
  emits: ["requestView", "requestEdit", "requestDelete"],
  computed: {
    /**
     * Returns the number of the ADR.
     */
    getAdrNumber() {
      return this.adr.fileName.substring(0, 4);
    },
    statusTone() {
      const status = (this.adr.adr.status ?? "").toLowerCase();
      return STATUS_TONES.includes(status) ? status : "";
    }
  },
  methods: {
    /**
     * Opens conforming ADRs in the ADR Manager editor and non-conforming ones
     * in the text editor so the parse errors can be fixed.
     */
    open() {
      if (this.adr.adr.conforming) {
        this.$emit("requestView");
      } else {
        this.$emit("requestEdit");
      }
    }
  }
});
</script>

<style scoped>
.adr-card {
  border: 1px solid var(--adr-line);
  border-radius: var(--adr-radius-md);
  background: var(--adr-surface);
  margin-bottom: 6px;
  transition:
    border-color 0.12s,
    box-shadow 0.12s;
}

.adr-card:hover {
  box-shadow: var(--adr-shadow-1);
}

.adr-card.broken {
  border-color: color-mix(in srgb, var(--adr-error) 55%, var(--adr-surface));
}

.adr-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 10px 14px;
  cursor: pointer;
}

.adr-number {
  flex: 0 0 auto;
  font-family: var(--adr-font-mono);
  font-size: var(--adr-text-xs);
  font-weight: 600;
  color: var(--adr-ink-3);
}

.adr-text {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.adr-title {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--adr-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.adr-path {
  font-family: var(--adr-font-mono);
  font-size: 11.5px;
  color: var(--adr-ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip.small {
  height: 24px;
  padding: 0 10px;
  font-size: 11px;
  flex: 0 0 auto;
  cursor: default;
}

.adr-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
  opacity: 0;
}

.adr-card:hover .adr-actions,
.adr-card:focus-within .adr-actions {
  opacity: 1;
}

.parse-errors {
  list-style: none;
  margin: 0;
  padding: 8px 14px 10px;
  border-top: 1px dashed var(--adr-line);
}

.parse-errors li {
  display: flex;
  align-items: baseline;
  gap: 7px;
  font-size: var(--adr-text-xs);
  color: var(--adr-error);
  padding: 2px 0;
}

.parse-errors .codicon {
  font-size: 13px;
  flex: 0 0 auto;
  align-self: center;
}
</style>
