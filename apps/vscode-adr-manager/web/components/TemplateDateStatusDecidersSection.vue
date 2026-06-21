<template>
  <div class="metabar">
    <div v-if="fieldVisibility.date" class="meta-field" :class="{ 'field-highlight': highlightedFields.has('date') }">
      <label>
        Last update
        <HelpTooltip>The date the decision was last updated (YYYY-MM-DD).</HelpTooltip>
      </label>
      <span class="chip">
        <i class="codicon codicon-calendar"></i>
        <input
          type="date"
          class="chip-input date-input"
          :value="date"
          @input="
            $emit('update:date', ($event.target as HTMLInputElement).value);
            $emit('validate');
          "
        />
      </span>
    </div>
    <div
      v-if="fieldVisibility.status"
      class="meta-field"
      :class="{ 'field-highlight': highlightedFields.has('status') }"
    >
      <label>
        Status
        <HelpTooltip>The current status of the ADR.</HelpTooltip>
      </label>
      <span class="chip status" :data-tone="statusTone">
        <select
          class="chip-input status-select"
          :value="(status ?? '').toLowerCase()"
          @input="
            $emit('update:status', ($event.target as HTMLSelectElement).value.toLowerCase());
            $emit('validate');
          "
        >
          <option value="" selected>no status</option>
          <option value="proposed">Proposed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="deprecated">Deprecated</option>
          <option value="superseded">Superseded</option>
        </select>
        <i class="codicon codicon-chevron-down"></i>
      </span>
    </div>
    <!-- Deciders and decision-makers name the same people, so editing either keeps both in sync. -->
    <div
      v-if="templateVersion === '2.1.2' && fieldVisibility.deciders"
      class="meta-field"
      :class="{ 'field-highlight': highlightedFields.has('deciders') }"
    >
      <label>
        Deciders
        <HelpTooltip>Everyone involved in the decision, e.g. separated with commas.</HelpTooltip>
      </label>
      <span class="chip">
        <i class="codicon codicon-organization"></i>
        <input
          type="text"
          class="chip-input people-input"
          placeholder="names…"
          spellcheck="true"
          :value="deciders"
          @input="
            $emit('update:deciders', ($event.target as HTMLInputElement).value);
            $emit('update:decisionMakers', ($event.target as HTMLInputElement).value);
            $emit('validate');
          "
        />
      </span>
    </div>
    <template v-else-if="templateVersion !== '2.1.2'">
      <div
        v-if="fieldVisibility.deciders"
        class="meta-field"
        :class="{ 'field-highlight': highlightedFields.has('deciders') }"
      >
        <label>
          Decision-makers
          <span class="ver-tag">4.0</span>
          <HelpTooltip>Everyone who makes the decision (renamed from "deciders" in MADR 4.0.0).</HelpTooltip>
        </label>
        <span class="chip">
          <i class="codicon codicon-organization"></i>
          <input
            type="text"
            class="chip-input people-input"
            placeholder="names…"
            spellcheck="true"
            :value="decisionMakers"
            @input="
              $emit('update:decisionMakers', ($event.target as HTMLInputElement).value);
              $emit('update:deciders', ($event.target as HTMLInputElement).value);
              $emit('validate');
            "
          />
        </span>
      </div>
      <div
        v-if="fieldVisibility.consulted"
        class="meta-field"
        :class="{ 'field-highlight': highlightedFields.has('consulted') }"
      >
        <label>
          Consulted
          <span class="ver-tag">4.0</span>
          <HelpTooltip>Subject-matter experts whose opinions are sought (two-way communication).</HelpTooltip>
        </label>
        <span class="chip">
          <i class="codicon codicon-comment-discussion"></i>
          <input
            type="text"
            class="chip-input people-input-sm"
            placeholder="names…"
            spellcheck="true"
            :value="consulted"
            @input="
              $emit('update:consulted', ($event.target as HTMLInputElement).value);
              $emit('validate');
            "
          />
        </span>
      </div>
      <div
        v-if="fieldVisibility.informed"
        class="meta-field"
        :class="{ 'field-highlight': highlightedFields.has('informed') }"
      >
        <label>
          Informed
          <span class="ver-tag">4.0</span>
          <HelpTooltip>People kept up-to-date on progress (one-way communication).</HelpTooltip>
        </label>
        <span class="chip">
          <i class="codicon codicon-megaphone"></i>
          <input
            type="text"
            class="chip-input people-input-sm"
            placeholder="names…"
            spellcheck="true"
            :value="informed"
            @input="
              $emit('update:informed', ($event.target as HTMLInputElement).value);
              $emit('validate');
            "
          />
        </span>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import HelpTooltip from "./HelpTooltip.vue";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldKey, FieldVisibility } from "@adr-manager/core";

const STATUS_TONES = ["proposed", "rejected", "accepted", "deprecated", "superseded"];

export default defineComponent({
  name: "TemplateDateStatusDecidersSection",
  components: {
    HelpTooltip
  },
  props: {
    date: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      default: ""
    },
    deciders: {
      type: String,
      default: ""
    },
    decisionMakers: {
      type: String,
      default: ""
    },
    consulted: {
      type: String,
      default: ""
    },
    informed: {
      type: String,
      default: ""
    },
    templateVersion: {
      type: String,
      default: "2.1.2"
    },
    fieldVisibility: {
      type: Object as PropType<FieldVisibility>,
      default: () => ({ ...DEFAULT_FIELD_VISIBILITY })
    },
    highlightedFields: {
      type: Object as PropType<Set<FieldKey>>,
      default: () => new Set<FieldKey>()
    }
  },
  emits: [
    "update:consulted",
    "update:date",
    "update:deciders",
    "update:decisionMakers",
    "update:informed",
    "update:status",
    "validate"
  ],
  computed: {
    statusTone() {
      const status = (this.status ?? "").toLowerCase();
      return STATUS_TONES.includes(status) ? status : "";
    }
  }
});
</script>

<style scoped>
.metabar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 26px;
  margin: 22px 0 6px;
}

.meta-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.meta-field.field-highlight {
  border-left: 3px solid var(--adr-warning);
  background: color-mix(in srgb, var(--adr-warning) 10%, var(--adr-surface));
  border-radius: 0 4px 4px 0;
  padding-left: 8px;
}

.meta-field > label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--adr-ink-2);
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.date-input {
  min-width: 120px;
}

.people-input {
  min-width: 160px;
}

.people-input-sm {
  min-width: 130px;
}

.chip.status .codicon {
  color: inherit;
}
</style>
