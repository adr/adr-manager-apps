<template>
    <div class="editor-inner">
        <div class="title-wrap">
            <input v-model="adr.title" data-cy="titleAdr" class="title-input" placeholder="Decision title" autofocus />
            <HelpTooltip class="align-end">
                Describe the solved problem and the solution concisely. The title is also used as the file name, so keep
                it short and avoid special characters.
            </HelpTooltip>
        </div>
        <div v-if="fileName" class="title-hint">
            <span class="mdi mdi-information-outline" aria-hidden="true"></span>
            Changing the title changes the file name: <code>{{ fileName }}</code>
        </div>

        <MadrMetaBar
            v-if="mode === 'professional'"
            :adr="adr"
            :template-version="templateVersion"
            :field-visibility="fieldVisibility"
        />

        <ModeSwitchAlert v-if="isModeTooLow">
            Some fields of this ADR are not displayed in the current mode.
        </ModeSwitchAlert>

        <hr class="divider" />

        <div class="section-head">
            <h3>Context and Problem Statement</h3>
            <HelpTooltip>
                Describe the context and problem statement, e.g. in free form using two to three sentences. You may want
                to articulate the problem in form of a question.
            </HelpTooltip>
        </div>
        <AutoGrowTextarea
            v-model="adr.contextAndProblemStatement"
            data-cy="contextAdr"
            :min-rows="3"
            placeholder="Describe the context and the problem this decision addresses…"
        />

        <div
            v-if="mode === 'professional' && templateVersion === '2.1.2' && fieldVisibility.technicalStory"
            class="tech-story"
        >
            <div class="subhead">
                <h4>Technical Story</h4>
                <HelpTooltip>
                    Technical context of the ADR, e.g. a ticket or issue URL. Removed in MADR 4.0.0, fold this into the
                    context above.
                </HelpTooltip>
            </div>
            <input
                v-model="adr.technicalStory"
                data-cy="technicalStoryPro"
                class="field"
                placeholder="e.g. JIRA-1234, or an issue URL…"
            />
        </div>

        <template v-if="mode === 'professional' && fieldVisibility.decisionDrivers">
            <hr class="divider" />
            <div class="section-head">
                <h3>Decision Drivers</h3>
                <span class="opt">optional</span>
                <HelpTooltip>
                    Decision Drivers are competing forces or facing concerns that influence the decision.
                </HelpTooltip>
            </div>
            <MadrListEditor
                data-cy="decisionDriversPro"
                :list="adr.decisionDrivers"
                placeholder="a decision driver, e.g. a force or concern…"
            />
        </template>

        <hr class="divider" />

        <MadrConsideredOptions
            :adr="adr"
            :mode="mode"
            :template-version="templateVersion"
            :field-visibility="fieldVisibility"
        />

        <hr class="divider" />

        <MadrDecisionOutcome
            :adr="adr"
            :mode="mode"
            :template-version="templateVersion"
            :field-visibility="fieldVisibility"
        />

        <template v-if="mode === 'professional' && templateVersion === '2.1.2' && fieldVisibility.links">
            <hr class="divider" />
            <div class="section-head">
                <h3>Links</h3>
                <span class="opt">optional</span>
                <HelpTooltip>Add references, e.g. to related ADRs.</HelpTooltip>
            </div>
            <MadrListEditor
                data-cy="linkPro"
                :list="adr.links"
                placeholder="a link or reference, e.g. Refined by ADR-0005…"
            />
        </template>

        <template v-if="mode === 'professional' && templateVersion === '4.0.0' && fieldVisibility.moreInformation">
            <hr class="divider" />
            <div class="section-head">
                <h3>More Information</h3>
                <span class="opt">optional</span>
                <span class="ver-tag">4.0</span>
                <HelpTooltip>
                    Additional evidence, team agreement, when to revisit, and links to related decisions. Replaces
                    "Links" from MADR 2.1.2.
                </HelpTooltip>
            </div>
            <AutoGrowTextarea
                v-model="adr.moreInformation"
                data-cy="moreInformationPro"
                :min-rows="2"
                placeholder="Related decisions, team agreement, when/how to revisit…"
            />
        </template>

        <template v-if="mode === 'professional' && fieldVisibility.relevantFiles">
            <hr class="divider" />
            <div class="section-head" data-cy="relevantFilesSection">
                <h3>Relevant Files</h3>
                <span class="opt">optional</span>
                <HelpTooltip>
                    Link the repository files this decision affects, so future readers can jump from the ADR straight to
                    the implementation.
                </HelpTooltip>
            </div>
            <MadrRelevantFiles :adr="adr" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AutoGrowTextarea from "./AutoGrowTextarea.vue";
import HelpTooltip from "./HelpTooltip.vue";
import MadrConsideredOptions from "./MadrConsideredOptions.vue";
import MadrDecisionOutcome from "./MadrDecisionOutcome.vue";
import MadrListEditor from "./MadrListEditor.vue";
import MadrMetaBar from "./MadrMetaBar.vue";
import MadrRelevantFiles from "./MadrRelevantFiles.vue";
import ModeSwitchAlert from "./ModeSwitchAlert.vue";
import type { ArchitecturalDecisionRecord } from "@/plugins/classes";
import type { MadrTemplateVersion } from "@adr-manager/core";
import type { Mode } from "@/types/store";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldVisibility } from "@adr-manager/core";

const props = withDefaults(
    defineProps<{
        adr: ArchitecturalDecisionRecord;
        mode: Mode;
        templateVersion?: MadrTemplateVersion;
        fileName?: string;
        fieldVisibility?: FieldVisibility;
    }>(),
    {
        templateVersion: "2.1.2",
        fileName: "",
        fieldVisibility: () => ({ ...DEFAULT_FIELD_VISIBILITY })
    }
);

function minimumRequiredMode(adr: ArchitecturalDecisionRecord): Mode {
    const hasProfessionalData =
        adr.decisionDrivers.length > 0 ||
        adr.links.length > 0 ||
        adr.relevantFiles.length > 0 ||
        adr.moreInformation !== "" ||
        adr.confirmation !== "" ||
        adr.consequences.some((consequence) => consequence.text.trim() !== "") ||
        adr.consulted !== "" ||
        adr.informed !== "";
    return hasProfessionalData ? "professional" : "basic";
}

const isModeTooLow = computed(() => props.mode === "basic" && minimumRequiredMode(props.adr) !== "basic");
</script>

<style scoped>
.editor-inner {
    max-width: 860px;
    margin: 0 auto;
    padding: 28px 40px 120px;
}

.title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
}

.title-input {
    flex: 1 1 auto;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    font-family: var(--adr-font-input);
    font-size: 28px;
    font-weight: 600;
    color: var(--adr-navy);
    padding: 6px 2px;
    letter-spacing: -0.02em;
    border-bottom: 2px solid var(--adr-line);
    transition: border-color 0.15s;
}

.title-input::placeholder {
    color: var(--adr-ink-3);
    font-weight: 400;
}

.title-input:focus {
    border-bottom-color: var(--adr-teal);
}

.title-hint {
    font-size: 12px;
    color: var(--adr-ink-3);
    margin: 7px 2px 0;
}

.title-hint .mdi {
    font-size: 14px;
    margin-right: 4px;
}

.title-hint code {
    font-family: var(--adr-font-mono);
    background: var(--adr-code-bg);
    border-radius: 4px;
    padding: 1px 5px;
}

.tech-story {
    margin-top: 16px;
}
</style>
