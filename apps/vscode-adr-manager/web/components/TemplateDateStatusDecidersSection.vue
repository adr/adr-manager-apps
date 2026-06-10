<template>
  <div class="metabar">
    <div class="meta-field">
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
            $emit('update:date', $event.target.value);
            $emit('validate');
          "
        />
      </span>
    </div>
    <div class="meta-field">
      <label>
        Status
        <HelpTooltip>The current status of the ADR.</HelpTooltip>
      </label>
      <span class="chip status" :data-tone="statusTone">
        <select
          class="chip-input status-select"
          :value="status.toLowerCase()"
          @input="
            $emit('update:status', $event.target.value.toLowerCase());
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
    <div v-if="templateVersion === '2.1.2'" class="meta-field">
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
            $emit('update:deciders', $event.target.value);
            $emit('update:decisionMakers', $event.target.value);
            $emit('validate');
          "
        />
      </span>
    </div>
    <template v-else>
      <div class="meta-field">
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
              $emit('update:decisionMakers', $event.target.value);
              $emit('update:deciders', $event.target.value);
              $emit('validate');
            "
          />
        </span>
      </div>
      <div class="meta-field">
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
              $emit('update:consulted', $event.target.value);
              $emit('validate');
            "
          />
        </span>
      </div>
      <div class="meta-field">
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
              $emit('update:informed', $event.target.value);
              $emit('validate');
            "
          />
        </span>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import HelpTooltip from "./HelpTooltip.vue";

const STATUS_TONES = ["proposed", "rejected", "accepted", "deprecated", "superseded"];

export default defineComponent({
  name: "TemplateDateStatusDecidersSection",
  components: {
    HelpTooltip
  },
  props: {
    date: String,
    status: String,
    deciders: String,
    decisionMakers: String,
    consulted: String,
    informed: String,
    templateVersion: {
      type: String,
      default: "2.1.2"
    }
  },
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
