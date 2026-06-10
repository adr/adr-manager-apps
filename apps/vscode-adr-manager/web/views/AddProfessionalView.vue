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
      <span class="seg-label">Editor mode</span>
      <div class="seg">
        <button type="button" @click="switchToBasicTemplate">Basic</button>
        <button type="button" class="on">Professional</button>
      </div>
      <button type="button" class="btn btn-primary" :disabled="!validated" @click="createAdr('createProfessionalAdr')">
        <i class="codicon codicon-check"></i>
        Create ADR
      </button>
    </header>

    <div class="editor-inner">
      <MadrTemplateProfessional
        :template-version="templateVersion"
        @send-input="getInput"
        @validated="enableButton"
        @invalidated="disableButton"
      ></MadrTemplateProfessional>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MadrTemplateProfessional from "../components/MadrTemplateProfessional.vue";
import VersionSelect from "../components/VersionSelect.vue";
import vscode from "../mixins/vscode-api-mixin";
import saveAdr from "../mixins/save-adr";

export default defineComponent({
  components: {
    MadrTemplateProfessional,
    VersionSelect
  },
  mixins: [vscode, saveAdr],
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
          decisionMakers: this.decisionMakers,
          consulted: this.consulted,
          informed: this.informed,
          consequences: this.consequences,
          confirmation: this.confirmation,
          moreInformation: this.moreInformation,
          templateVersion: this.templateVersion,
          fullPath: this.fullPath
        })
      );
    }
  }
});
</script>
