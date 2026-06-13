<template>
  <div id="add">
    <header class="toolbar">
      <button type="button" class="icon-btn" title="Back to ADR overview" @click="sendMessage('main')">
        <i class="codicon codicon-arrow-left"></i>
      </button>
      <div class="brand">
        <img src="../assets/logo-badge.png" alt="" />
        <span class="word">Add<span> ADR</span></span>
      </div>
      <VersionSelect v-model="templateVersion"></VersionSelect>
      <span class="spacer"></span>
      <button type="button" class="icon-btn" title="Show editor tips" @click="startTour">
        <i class="codicon codicon-question"></i>
      </button>
      <span class="seg-label">Editor mode</span>
      <div class="seg" data-tour="mode-toggle">
        <button type="button" @click="switchToBasicTemplate">Basic</button>
        <button type="button" class="on">Professional</button>
      </div>
      <FieldVisibilityPanel
        :template-version="templateVersion"
        :field-visibility="fieldVisibility"
        @set-field-visibility="setFieldVisibility"
      ></FieldVisibilityPanel>
      <button
        type="button"
        class="btn btn-primary"
        data-tour="editor-primary"
        :disabled="!validated"
        @click="createAdr('createProfessionalAdr')"
      >
        <i class="codicon codicon-check"></i>
        Create ADR
      </button>
    </header>

    <div class="editor-inner">
      <AdrTagSection
        :tags="tags"
        :recent-tags="recentTags"
        @update:tags="tags = $event"
        @update:recent-tags="updateRecentTags($event)"
      ></AdrTagSection>
      <MadrTemplateProfessional
        :template-version="templateVersion"
        :field-visibility="fieldVisibility"
        @send-input="getInput"
        @validated="enableButton"
        @invalidated="disableButton"
      ></MadrTemplateProfessional>
    </div>

    <TourOverlay v-model:active="tourActive" :steps="tourSteps" @closed="onTourClosed"></TourOverlay>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MadrTemplateProfessional from "../components/MadrTemplateProfessional.vue";
import AdrTagSection from "../components/AdrTagSection.vue";
import TourOverlay from "../components/TourOverlay.vue";
import VersionSelect from "../components/VersionSelect.vue";
import FieldVisibilityPanel from "../components/FieldVisibilityPanel.vue";
import vscode from "../mixins/vscode-api-mixin";
import saveAdr from "../mixins/save-adr";
import createTourMixin from "../mixins/tour";
import { buildEditorTourSteps } from "../tour/editor-steps";

export default defineComponent({
  components: {
    MadrTemplateProfessional,
    AdrTagSection,
    TourOverlay,
    VersionSelect,
    FieldVisibilityPanel
  },
  mixins: [vscode, saveAdr, createTourMixin("editor")],
  data() {
    return {
      tourSteps: buildEditorTourSteps()
    };
  },
  methods: {
    /**
     * Switches to the basic MADR template, hiding the professional fields while keeping the current
     * user inputs.
     */
    switchToBasicTemplate() {
      this.sendMessage(
        "switchAddViewProfessionalToBasic",
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
          relevantFiles: this.relevantFiles,
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
