<template>
    <div>
        <div class="section-head">
            <h3>Decision Outcome</h3>
            <HelpTooltip>
                Select the option you chose and explain why.
                <div v-if="mode === 'basic'">Note that you can add consequences in Professional mode.</div>
            </HelpTooltip>
        </div>

        <div ref="chosenWrap" class="select-wrap">
            <input
                v-model="adr.decisionOutcome.chosenOption"
                data-cy="decOutChooseAdr"
                class="field"
                placeholder="Chosen option"
                @focus="suggestionsOpen = true"
            />
            <span class="mdi mdi-menu-down caret" aria-hidden="true"></span>
            <div v-if="suggestionsOpen && optionTitles.length" class="menu suggestions">
                <div
                    v-for="title in optionTitles"
                    :key="title"
                    data-cy="chosenOptionItem"
                    class="menu-item"
                    :class="{ sel: adr.decisionOutcome.chosenOption === title }"
                    @click="selectOption(title)"
                >
                    <span class="mi-radio"></span>
                    <span class="mi-title">{{ title }}</span>
                </div>
            </div>
        </div>

        <div class="because-row">
            <span class="lbl">because</span>
            <AutoGrowTextarea
                v-model="adr.decisionOutcome.explanation"
                data-cy="decOutBecAdr"
                placeholder="justification for the chosen option…"
            />
        </div>

        <div
            v-if="
                mode === 'professional' &&
                !hasTemplateField('consequences') &&
                (fieldVisibility.positiveConsequences || fieldVisibility.negativeConsequences)
            "
            class="outcome-cols"
        >
            <div
                v-if="fieldVisibility.positiveConsequences"
                :class="{ 'field-highlight': highlightedFields.has('positiveConsequences') }"
            >
                <div class="subhead">
                    <h4>Positive Consequences</h4>
                    <HelpTooltip>
                        e.g. improvement of a quality attribute, follow-up decisions required, …
                    </HelpTooltip>
                </div>
                <MadrListEditor
                    data-cy="posConseqPro"
                    :list="adr.decisionOutcome.positiveConsequences"
                    placeholder="a positive consequence…"
                />
            </div>
            <div
                v-if="fieldVisibility.negativeConsequences"
                :class="{ 'field-highlight': highlightedFields.has('negativeConsequences') }"
            >
                <div class="subhead">
                    <h4>Negative Consequences</h4>
                    <HelpTooltip> e.g. afflicted quality attributes, follow-up decisions required, … </HelpTooltip>
                </div>
                <MadrListEditor
                    data-cy="negConseqPro"
                    :list="adr.decisionOutcome.negativeConsequences"
                    placeholder="a negative consequence…"
                />
            </div>
        </div>

        <template v-if="mode === 'professional' && hasTemplateField('consequences')">
            <div
                v-if="fieldVisibility.consequences"
                class="v4-block"
                :class="{ 'field-highlight': highlightedFields.has('consequences') }"
            >
                <div class="subhead">
                    <h4>Consequences</h4>
                    <span class="ver-tag">4.0</span>
                    <HelpTooltip>
                        Good / Neutral / Bad consequences of the decision. Press the (Good) label to switch it between
                        states.
                    </HelpTooltip>
                </div>
                <MadrConsequenceEditor data-cy="consequencesPro" :list="adr.consequences" />
            </div>
            <div
                v-if="hasTemplateField('confirmation') && fieldVisibility.confirmation"
                class="v4-block"
                :class="{ 'field-highlight': highlightedFields.has('confirmation') }"
            >
                <div class="subhead">
                    <h4>Confirmation</h4>
                    <span class="ver-tag">4.0</span>
                    <HelpTooltip>
                        How is implementation / compliance with this decision confirmed? e.g. a review or an ArchUnit
                        test.
                    </HelpTooltip>
                </div>
                <AutoGrowTextarea
                    v-model="adr.confirmation"
                    data-cy="confirmationPro"
                    placeholder="How will this decision be confirmed?…"
                />
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import AutoGrowTextarea from "./AutoGrowTextarea.vue";
import HelpTooltip from "./HelpTooltip.vue";
import MadrConsequenceEditor from "./MadrConsequenceEditor.vue";
import MadrListEditor from "./MadrListEditor.vue";
import { createShortTitle } from "@/plugins/classes";
import { useClickOutside } from "@/composables/useClickOutside";
import { DEFAULT_FIELD_VISIBILITY, getMadrTemplateAdapter, hasMadrTemplateField } from "@adr-manager/core";
import type { ArchitecturalDecisionRecord } from "@/plugins/classes";
import type { FieldKey, MadrTemplateVersion, FieldVisibility } from "@adr-manager/core";
import type { Mode } from "@/types/store";

const props = withDefaults(
    defineProps<{
        adr: ArchitecturalDecisionRecord;
        mode: Mode;
        templateVersion: MadrTemplateVersion;
        fieldVisibility?: FieldVisibility;
        highlightedFields?: ReadonlySet<FieldKey>;
    }>(),
    {
        fieldVisibility: () => ({ ...DEFAULT_FIELD_VISIBILITY }),
        highlightedFields: () => new Set<FieldKey>()
    }
);

const suggestionsOpen = ref(false);
const chosenWrap = useTemplateRef<HTMLElement>("chosenWrap");
useClickOutside(chosenWrap, () => (suggestionsOpen.value = false));

const optionTitles = computed(() =>
    props.adr.consideredOptions.map((option) => createShortTitle(option.title)).filter((title) => title !== "")
);
const template = computed(() => getMadrTemplateAdapter(props.templateVersion));

function hasTemplateField(key: keyof FieldVisibility): boolean {
    return hasMadrTemplateField(template.value, key);
}

function selectOption(title: string): void {
    props.adr.decisionOutcome.chosenOption = title;
    suggestionsOpen.value = false;
}
</script>

<style scoped>
.suggestions {
    left: 0;
    right: 0;
}

.v4-block {
    margin-top: 18px;
}

.field-highlight {
    border-left: 3px solid var(--adr-warning);
    background: var(--adr-warning-050);
    border-radius: 0 6px 6px 0;
    padding: 8px 14px 8px 11px;
    margin-left: -14px;
}

.because-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 12px;
}

.because-row .lbl {
    flex: 0 0 auto;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--adr-ink-2);
    padding-top: 10px;
}

.outcome-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 28px;
    margin-top: 16px;
}

@media (max-width: 1180px) {
    .outcome-cols {
        grid-template-columns: 1fr;
    }
}
</style>
