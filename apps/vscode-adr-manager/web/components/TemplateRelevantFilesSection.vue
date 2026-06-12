<template>
  <div class="relevant-files">
    <TemplateHeader
      :info-text="'Link the files this decision affects, so future readers can jump from the ADR straight to the implementation.'"
      optional
    >
      <h2>Relevant Files</h2>
    </TemplateHeader>
    <ul v-if="relevantFilesProp.length > 0" class="file-rows">
      <li v-for="(path, index) in relevantFilesProp" :key="path" class="file-row" data-testid="relevantFileRow">
        <i class="codicon codicon-file" aria-hidden="true"></i>
        <button
          type="button"
          class="file-link"
          :title="`Open ${path} in the editor`"
          data-testid="relevantFileLink"
          @click="$emit('open', path)"
        >
          {{ path }}
        </button>
        <span
          v-if="statusProp[path] === false"
          class="missing-badge"
          title="File not found in workspace"
          data-testid="relevantFileMissing"
        >
          <i class="codicon codicon-warning" aria-hidden="true"></i>
          not found
        </span>
        <button
          type="button"
          class="row-del"
          title="Remove"
          data-testid="relevantFileRemove"
          @click="$emit('remove', index)"
        >
          <i class="codicon codicon-trash"></i>
        </button>
      </li>
    </ul>
    <p v-else class="hint">No files linked yet.</p>
    <button type="button" class="btn btn-outline" data-testid="relevantFilesPick" @click="$emit('pick')">
      <i class="codicon codicon-new-file" aria-hidden="true"></i>
      Add files…
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import TemplateHeader from "./TemplateHeader.vue";

export default defineComponent({
  name: "TemplateRelevantFilesSection",
  components: {
    TemplateHeader
  },
  props: {
    relevantFilesProp: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    // Existence per linked path. A missing key means "not checked yet" and shows no warning.
    statusProp: {
      type: Object as PropType<Record<string, boolean>>,
      default: () => ({})
    }
  },
  emits: ["pick", "open", "remove"]
});
</script>

<style scoped>
.file-rows {
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: var(--adr-radius-sm);
}

.file-row:hover {
  background: var(--adr-surface-2);
}

.file-row > .codicon-file {
  color: var(--adr-ink-3);
  flex: 0 0 auto;
}

.file-link {
  border: 0;
  background: transparent;
  padding: 0;
  font-family: var(--adr-font-mono);
  font-size: var(--adr-text-sm);
  color: var(--adr-blue);
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.file-link:hover {
  text-decoration: underline;
}

.missing-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--adr-error);
  font-size: var(--adr-text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  flex: 0 0 auto;
}

.file-row .row-del {
  margin-left: auto;
  display: flex;
  justify-content: center;
  opacity: 0;
  color: var(--adr-ink-3);
  cursor: pointer;
  border: 0;
  background: transparent;
  padding: 0;
}

.file-row:hover .row-del {
  opacity: 1;
}

.file-row .row-del:hover {
  color: var(--adr-error);
}

.hint {
  margin: 0 0 8px;
  color: var(--adr-ink-3);
  font-size: var(--adr-text-sm);
}
</style>
