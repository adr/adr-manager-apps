<template>
  <article class="adr-card" :class="{ broken: looksLikeAdr && !adr.adr.conforming }">
    <div
      class="adr-row"
      role="button"
      tabindex="0"
      :title="adr.adr.conforming ? 'Open in ADR Manager' : 'Open in ADR Manager to convert'"
      @click="open"
      @keydown.enter="open"
    >
      <span v-if="isAdr" class="adr-number">
        <i class="codicon codicon-checklist adr-kind-icon" title="Architectural decision record"></i>
        <template v-if="hasNumber">{{ getAdrNumber }}</template>
      </span>
      <i v-else class="codicon codicon-file adr-file-icon" title="Markdown file — not yet an ADR"></i>
      <div class="adr-text">
        <span class="adr-title">{{ displayTitle }}</span>
        <span class="adr-path">{{ adr.relativePath }}</span>
      </div>
      <span v-if="statusTone" class="chip status small" :data-tone="statusTone">{{ adr.adr.status }}</span>
      <div class="adr-actions">
        <button
          type="button"
          class="icon-btn"
          title="Open Markdown file"
          data-tour="adr-edit"
          @click.stop="$emit('requestEdit')"
          @keydown.enter.stop
        >
          <i class="codicon codicon-go-to-file"></i>
        </button>
        <button
          type="button"
          class="icon-btn danger"
          title="Delete ADR"
          data-tour="adr-delete"
          @click.stop="$emit('requestDelete')"
          @keydown.enter.stop
        >
          <i class="codicon codicon-trash"></i>
        </button>
      </div>
    </div>
    <ul v-if="looksLikeAdr && !adr.adr.conforming" class="parse-errors">
      <li v-for="(error, index) in adr.adr.parseErrors" :key="index">
        <i class="codicon codicon-error"></i>
        Parsing error at line {{ error.line }}, position {{ error.charPosition }}: {{ error.message }}
      </li>
    </ul>
  </article>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { matchesMadrTitleFormat } from "../../src/plugins/utils";

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
     * Whether the file is an actual ADR, decided by whether its content parses as a valid MADR
     * (not by its file name). The NNNN- prefix is only MADR's ordering convention, so a well-formed
     * ADR with any name still counts and a malformed NNNN- file does not.
     */
    isAdr() {
      return Boolean(this.adr.adr.conforming);
    },
    /**
     * True for the MADR file-name convention (NNNN-title.md). Drives the broken-ADR hints: a file
     * named like an ADR but not conforming is a broken ADR worth flagging, not just stray Markdown.
     */
    looksLikeAdr() {
      return Boolean(matchesMadrTitleFormat(this.adr.fileName));
    },
    hasNumber() {
      return /^\d{4}/.test(this.adr.fileName);
    },
    getAdrNumber() {
      return this.adr.fileName.substring(0, 4);
    },
    displayTitle() {
      return this.adr.adr.title || (this.isAdr ? "(No title)" : this.adr.fileName.replace(/\.md$/i, ""));
    },
    statusTone() {
      const status = (this.adr.adr.status ?? "").toLowerCase();
      return STATUS_TONES.includes(status) ? status : "";
    }
  },
  methods: {
    /**
     * Opens the ADR in ADR Manager. A conforming ADR lands in the structured editor; a malformed
     * one lands in the convert view. The raw Markdown file stays reachable via the separate
     * "Open Markdown file" action (requestEdit).
     */
    open() {
      this.$emit("requestView");
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--adr-font-mono);
  font-size: var(--adr-text-xs);
  font-weight: 600;
  color: var(--adr-ink-3);
}

.adr-kind-icon {
  font-size: 14px;
  color: var(--adr-ink-3);
}

.adr-file-icon {
  flex: 0 0 auto;
  font-size: 15px;
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

/* The tour reveals the actions while it points at them (class set by MainView).
   This rule must live in this component's scoped block to match. */
.adr-card.tour-reveal .adr-actions {
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
