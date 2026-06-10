<template>
    <div class="metabar">
        <div class="meta-field">
            <label>
                Last update
                <HelpTooltip>The date the decision was last updated (YYYY-MM-DD).</HelpTooltip>
            </label>
            <span class="chip">
                <span class="mdi mdi-calendar" aria-hidden="true"></span>
                <input v-model="adr.date" data-cy="dateAdr" type="date" class="chip-input date-input" />
            </span>
        </div>
        <div class="meta-field">
            <label>
                Status
                <HelpTooltip>The current status of the ADR.</HelpTooltip>
            </label>
            <MadrStatusChip v-model="adr.status" />
        </div>

        <div v-if="templateVersion === '2.1.2'" class="meta-field">
            <label>
                Deciders
                <HelpTooltip>Everyone involved in the decision, e.g. separated with commas.</HelpTooltip>
            </label>
            <span class="chip">
                <span class="mdi mdi-account-multiple" aria-hidden="true"></span>
                <input
                    data-cy="authorPro"
                    class="chip-input people-input"
                    placeholder="names…"
                    :value="adr.deciders"
                    @input="setDeciders(($event.target as HTMLInputElement).value)"
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
                    <span class="mdi mdi-account-multiple" aria-hidden="true"></span>
                    <input
                        data-cy="decisionMakersPro"
                        class="chip-input people-input"
                        placeholder="names…"
                        :value="adr.decisionMakers"
                        @input="setDecisionMakers(($event.target as HTMLInputElement).value)"
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
                    <span class="mdi mdi-account-voice" aria-hidden="true"></span>
                    <input
                        v-model="adr.consulted"
                        data-cy="consultedPro"
                        class="chip-input people-input-sm"
                        placeholder="names…"
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
                    <span class="mdi mdi-account-arrow-right" aria-hidden="true"></span>
                    <input
                        v-model="adr.informed"
                        data-cy="informedPro"
                        class="chip-input people-input-sm"
                        placeholder="names…"
                    />
                </span>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import HelpTooltip from "./HelpTooltip.vue";
import MadrStatusChip from "./MadrStatusChip.vue";
import type { ArchitecturalDecisionRecord } from "@/plugins/classes";
import type { MadrTemplateVersion } from "@adr-manager/core";

const props = defineProps<{ adr: ArchitecturalDecisionRecord; templateVersion: MadrTemplateVersion }>();

// Deciders and decision-makers name the same people, so editing either keeps both in sync.
function setDeciders(value: string): void {
    props.adr.deciders = value;
    props.adr.decisionMakers = value;
}

function setDecisionMakers(value: string): void {
    props.adr.decisionMakers = value;
    props.adr.deciders = value;
}
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
</style>
