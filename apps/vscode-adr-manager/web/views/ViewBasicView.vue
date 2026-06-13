<template>
  <div id="view">
    <header class="toolbar">
      <button type="button" class="icon-btn" title="Back to ADR overview" @click="sendMessage('main')">
        <i class="codicon codicon-arrow-left"></i>
      </button>
      <div class="brand">
        <img src="../assets/logo-badge.png" alt="" />
        <span class="word">Edit<span> ADR</span></span>
      </div>
      <VersionSelect v-model="templateVersion"></VersionSelect>
      <span class="spacer"></span>
      <button type="button" class="btn btn-ghost" title="Open the Markdown file in the text editor" @click="openEditor">
        <i class="codicon codicon-go-to-file"></i>
        Open file
      </button>
      <button type="button" class="icon-btn" title="Show editor tips" @click="startTour">
        <i class="codicon codicon-question"></i>
      </button>
      <span class="seg-label">Editor mode</span>
      <div class="seg" data-tour="mode-toggle">
        <button type="button" class="on">Basic</button>
        <button type="button" @click="switchToProfessionalTemplate">Professional</button>
      </div>
      <button type="button" class="btn btn-primary" data-tour="editor-primary" :disabled="!validated" @click="saveAdr">
        <i class="codicon codicon-save"></i>
        Save ADR
      </button>
    </header>

    <div class="editor-inner">
      <div v-if="hasProfessionalFields" class="alert" role="alert">
        <i class="codicon codicon-warning"></i>
        <span class="atext">{{ missingFieldsNote }}</span>
        <button type="button" class="btn btn-outline" @click="switchToProfessionalTemplate">
          Switch to professional
        </button>
      </div>
      <AdrTagSection
        :tags="tags"
        :recent-tags="recentTags"
        @update:tags="tags = $event"
        @update:recent-tags="updateRecentTags($event)"
      ></AdrTagSection>
      <MadrTemplateBasic
        :template-version="templateVersion"
        @send-input="getInput"
        @validated="enableButton"
        @invalidated="disableButton"
      ></MadrTemplateBasic>
    </div>

    <TourOverlay v-model:active="tourActive" :steps="tourSteps" @closed="onTourClosed"></TourOverlay>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MadrTemplateBasic from "../components/MadrTemplateBasic.vue";
import AdrTagSection from "../components/AdrTagSection.vue";
import TourOverlay from "../components/TourOverlay.vue";
import VersionSelect from "../components/VersionSelect.vue";
import vscode from "../mixins/vscode-api-mixin";
import saveAdr from "../mixins/save-adr";
import createTourMixin from "../mixins/tour";
import { buildEditorTourSteps } from "../tour/editor-steps";

export default defineComponent({
  components: {
    MadrTemplateBasic,
    AdrTagSection,
    TourOverlay,
    VersionSelect
  },
  mixins: [vscode, saveAdr, createTourMixin("editor")],
  data() {
    return {
      tourSteps: buildEditorTourSteps()
    };
  },
  methods: {
    /**
     * Switches to the professional MADR template, revealing more fields while keeping the current
     * user inputs.
     */
    switchToProfessionalTemplate() {
      this.sendMessage(
        "switchViewingViewBasicToProfessional",
        JSON.stringify({
          yaml: this.yaml,
          title: this.title,
          date: this.date,
          status: this.status,
          deciders: this.deciders,
          technicalStory: this.technicalStory,
          contextAndProblemStatement: this.contextAndProblemStatement,
          decisionDrivers: this.decisionDrivers,
          consideredOptions: this.consideredOptions,
          decisionOutcome: this.decisionOutcome,
          links: this.links,
          decisionMakers: this.decisionMakers,
          consulted: this.consulted,
          informed: this.informed,
          consequences: this.consequences,
          confirmation: this.confirmation,
          moreInformation: this.moreInformation,
          templateVersion: this.templateVersion,
          fullPath: this.fullPath,
          tags: this.tags.map((t) => ({ ...t }))
        })
      );
    }
  }
});
</script>
