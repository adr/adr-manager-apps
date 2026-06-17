<template>
    <div>
        <div class="section-head">
            <h3>Considered Options</h3>
            <HelpTooltip v-if="professional">
                List all considered options. Expand an option to add a description and pros / cons.
            </HelpTooltip>
            <HelpTooltip v-else>
                List all considered options. Only write a concise description. You can add a more detailed description
                in Professional mode.
            </HelpTooltip>
        </div>

        <ModeSwitchAlert v-if="isModeTooLow">
            Some options have a more detailed description that is not displayed in Basic mode.
        </ModeSwitchAlert>

        <div class="options" :data-cy="professional ? 'consOptPro' : 'consOptBasic'">
            <div
                v-for="(option, index) in adr.consideredOptions"
                :key="option.id"
                class="opt-card"
                :class="{ chosen: isChosen(option) }"
                @dragover.prevent
                @drop="moveOption(index)"
            >
                <div class="opt-head">
                    <span
                        class="opt-grip"
                        draggable="true"
                        @dragstart="draggedIndex = index"
                        @dragend="draggedIndex = null"
                    >
                        <span class="mdi mdi-drag-vertical" aria-hidden="true"></span>
                    </span>
                    <button
                        type="button"
                        class="opt-choose"
                        :data-cy="isChosen(option) ? 'checkConsOptAdr' : 'chooseConsOptAdr'"
                        title="Mark as chosen option"
                        @click="choose(option)"
                    >
                        <span
                            class="mdi"
                            :class="isChosen(option) ? 'mdi-check-decagram' : 'mdi-checkbox-blank-circle-outline'"
                            aria-hidden="true"
                        ></span>
                    </button>
                    <input
                        :ref="(el) => setTitleRef(option.id, el)"
                        v-model="option.title"
                        class="opt-title-input"
                        placeholder="Option title…"
                    />
                    <span v-if="isChosen(option)" class="chosen-tag">chosen</span>
                    <div class="opt-actions">
                        <button
                            v-if="professional"
                            type="button"
                            class="icon-btn"
                            :title="isExpanded(option) ? 'Collapse' : 'Expand details'"
                            @click="toggleExpansion(option)"
                        >
                            <span
                                class="mdi"
                                :class="isExpanded(option) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                                aria-hidden="true"
                            ></span>
                        </button>
                        <button
                            type="button"
                            class="icon-btn danger"
                            data-cy="removeConsOptAdr"
                            title="Remove option"
                            @click="removeOption(option)"
                        >
                            <span class="mdi mdi-delete-outline" aria-hidden="true"></span>
                        </button>
                    </div>
                </div>

                <div v-if="professional && isExpanded(option)" class="opt-body">
                    <template v-if="fieldVisibility.optionDescription">
                        <div class="subhead">
                            <h4>Description</h4>
                            <HelpTooltip>
                                Describe the option in free form, e.g. by giving examples or a pointer to more
                                information.
                            </HelpTooltip>
                        </div>
                        <AutoGrowTextarea
                            v-model="option.description"
                            data-cy="descriptionConsOpt"
                            placeholder="Describe this option…"
                        />
                    </template>
                    <div v-if="fieldVisibility.optionProsAndCons" class="opt-proscons">
                        <div>
                            <div class="subhead">
                                <h4>Good, because…</h4>
                                <HelpTooltip>Give arguments supporting this option.</HelpTooltip>
                            </div>
                            <MadrListEditor
                                data-cy="goodConsOpt"
                                :list="option.pros"
                                placeholder="a supporting argument…"
                                :tone="{ kind: 'good', label: 'Good' }"
                            />
                        </div>
                        <div v-if="template.optionArgumentKinds.includes('neutral')">
                            <div class="subhead">
                                <h4>Neutral, because…</h4>
                                <span class="ver-tag">4.0</span>
                                <HelpTooltip>
                                    Arguments that are neither clearly for nor against this option.
                                </HelpTooltip>
                            </div>
                            <MadrListEditor
                                data-cy="neutralConsOpt"
                                :list="option.neutrals"
                                placeholder="a neutral argument…"
                                :tone="{ kind: 'neutral', label: 'Neutral' }"
                            />
                        </div>
                        <div>
                            <div class="subhead">
                                <h4>Bad, because…</h4>
                                <HelpTooltip>Give arguments against using this option.</HelpTooltip>
                            </div>
                            <MadrListEditor
                                data-cy="badConsOpt"
                                :list="option.cons"
                                placeholder="an argument against…"
                                :tone="{ kind: 'bad', label: 'Bad' }"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div class="opt-card opt-card-add">
                <div class="opt-head">
                    <span class="opt-grip dimmed"><span class="mdi mdi-plus" aria-hidden="true"></span></span>
                    <span class="opt-choose dimmed">
                        <span class="mdi mdi-checkbox-blank-circle-outline" aria-hidden="true"></span>
                    </span>
                    <input
                        data-cy="considerOptTextAdr"
                        class="opt-title-input"
                        :value="draft"
                        placeholder="Add a considered option…"
                        @input="addOption(($event.target as HTMLInputElement).value)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { ComponentPublicInstance } from "vue";
import AutoGrowTextarea from "./AutoGrowTextarea.vue";
import HelpTooltip from "./HelpTooltip.vue";
import MadrListEditor from "./MadrListEditor.vue";
import ModeSwitchAlert from "./ModeSwitchAlert.vue";
import { createShortTitle } from "@/plugins/classes";
import { matchOptionTitleMoreRelaxed } from "@/plugins/parser";
import { DEFAULT_FIELD_VISIBILITY, getMadrTemplateAdapter } from "@adr-manager/core";
import type { ArchitecturalDecisionRecord } from "@/plugins/classes";
import type { MadrTemplateVersion, FieldVisibility } from "@adr-manager/core";
import type { Option } from "@/types/adr";
import type { Mode } from "@/types/store";

const props = withDefaults(
    defineProps<{
        adr: ArchitecturalDecisionRecord;
        mode: Mode;
        templateVersion: MadrTemplateVersion;
        fieldVisibility?: FieldVisibility;
    }>(),
    { fieldVisibility: () => ({ ...DEFAULT_FIELD_VISIBILITY }) }
);

const draft = ref("");
const expandedIds = ref<number[]>([]);
const draggedIndex = ref<number | null>(null);
const titleRefs = new Map<number, HTMLInputElement>();

const professional = computed(() => props.mode === "professional");
const template = computed(() => getMadrTemplateAdapter(props.templateVersion));

const isModeTooLow = computed(
    () =>
        props.mode === "basic" &&
        props.adr.consideredOptions.some(
            (option) =>
                option.description.length > 0 ||
                option.pros.length > 0 ||
                option.neutrals.length > 0 ||
                option.cons.length > 0
        )
);

function setTitleRef(id: number, el: Element | ComponentPublicInstance | null): void {
    if (el instanceof HTMLInputElement) {
        titleRefs.set(id, el);
    } else {
        titleRefs.delete(id);
    }
}

function isExpanded(option: Option): boolean {
    return expandedIds.value.includes(option.id);
}

function toggleExpansion(option: Option): void {
    if (isExpanded(option)) {
        expandedIds.value = expandedIds.value.filter((id) => id !== option.id);
    } else {
        expandedIds.value.push(option.id);
    }
}

function addOption(title: string): void {
    draft.value = title;
    if (title.trim() === "") {
        return;
    }
    const option = props.adr.addOption({ title });
    draft.value = "";
    if (professional.value) {
        expandedIds.value.push(option.id);
    }
    nextTick(() => titleRefs.get(option.id)?.focus());
}

function removeOption(option: Option): void {
    const index = props.adr.consideredOptions.indexOf(option);
    if (index >= 0) {
        props.adr.consideredOptions.splice(index, 1);
    }
}

function moveOption(targetIndex: number): void {
    const from = draggedIndex.value;
    if (from === null || from === targetIndex) {
        return;
    }
    const [moved] = props.adr.consideredOptions.splice(from, 1);
    if (moved) {
        props.adr.consideredOptions.splice(targetIndex, 0, moved);
    }
    draggedIndex.value = null;
}

function isChosen(option: Option): boolean {
    const chosen = props.adr.decisionOutcome.chosenOption;
    return chosen !== "" && matchOptionTitleMoreRelaxed(option.title, chosen);
}

function choose(option: Option): void {
    props.adr.decisionOutcome.chosenOption = createShortTitle(option.title);
}
</script>

<style scoped>
.options {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.opt-card {
    border: 1px solid var(--adr-line);
    border-radius: 8px;
    background: var(--adr-surface);
    overflow: hidden;
    transition:
        border-color 0.12s,
        box-shadow 0.12s;
}

.opt-card:hover {
    box-shadow: var(--adr-shadow-1);
}

.opt-card.chosen {
    background: var(--adr-success-050);
    border-color: #c5e1a5;
}

.opt-card-add {
    border-style: dashed;
}

.opt-head {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 48px;
    padding: 0 6px 0 4px;
}

.opt-grip {
    flex: 0 0 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--adr-ink-3);
    cursor: grab;
    opacity: 0;
}

.opt-card:hover .opt-grip {
    opacity: 1;
}

.opt-grip.dimmed {
    opacity: 0.4;
}

.opt-choose {
    flex: 0 0 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--adr-ink-3);
    border: 0;
    background: transparent;
    padding: 0;
}

.opt-choose .mdi {
    font-size: 21px;
}

.opt-choose.dimmed {
    opacity: 0.25;
}

.opt-card.chosen .opt-choose {
    color: var(--adr-success);
}

.opt-title-input {
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    font-family: var(--adr-font-input);
    font-size: 14.5px;
    font-weight: 500;
    color: var(--adr-ink);
    padding: 12px 6px;
}

.opt-title-input::placeholder {
    color: var(--adr-ink-3);
}

.opt-card.chosen .opt-title-input {
    font-weight: 700;
}

.opt-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
}

.opt-card:hover .opt-actions,
.opt-card:focus-within .opt-actions {
    opacity: 1;
}

.chosen-tag {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.4px;
    color: var(--adr-success);
    text-transform: uppercase;
    padding: 0 6px;
}

.opt-body {
    padding: 4px 16px 16px 64px;
    border-top: 1px dashed var(--adr-line);
}

.opt-proscons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 28px;
}

@media (max-width: 1180px) {
    .opt-proscons {
        grid-template-columns: 1fr;
    }
}
</style>
