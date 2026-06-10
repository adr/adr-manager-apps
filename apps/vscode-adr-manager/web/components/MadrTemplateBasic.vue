<template>
  <div class="template">
    <TemplateTitleSection
      ref="title"
      :key="dataFetched"
      v-model:title="title"
      :title-prop="title"
      :file-name="fileName"
      @validate="validate('title')"
    ></TemplateTitleSection>
    <hr class="divider" />
    <TemplateContextAndProblemStatementSection
      ref="contextAndProblemStatement"
      :key="dataFetched"
      v-model:context-and-problem-statement="contextAndProblemStatement"
      :context-and-problem-statement-prop="contextAndProblemStatement"
      @validate="validate('contextAndProblemStatement')"
    ></TemplateContextAndProblemStatementSection>
    <hr class="divider" />
    <TemplateConsideredOptionsBasicSection
      ref="consideredOptions"
      :key="dataFetched"
      v-model:considered-options="consideredOptions"
      v-model:chosen-option="decisionOutcome.chosenOption"
      v-model:selected-index="selectedIndex"
      :considered-options-prop="consideredOptions"
      @add-option="addOption"
      @select-option="selectOption"
      @edit-option="editOption"
      @delete-option="deleteOption"
      @check-selection="checkSelection"
    ></TemplateConsideredOptionsBasicSection>
    <hr class="divider" />
    <TemplateDecisionOutcomeBasicSection
      ref="decisionOutcome"
      :key="dataFetched"
      v-model:explanation="decisionOutcome.explanation"
      :decision-outcome-prop="decisionOutcome"
      @validate="validate('explanation')"
    ></TemplateDecisionOutcomeBasicSection>
  </div>
</template>

<script lang="ts">
// Mixin defining all methods, variables etc. to hold the data of an ADR
import adrData from "../mixins/adr-data";

import { defineComponent } from "vue";
import vscode from "../mixins/vscode-api-mixin";
import TemplateTitleSection from "./TemplateTitleSection.vue";
import TemplateContextAndProblemStatementSection from "./TemplateContextAndProblemStatementSection.vue";
import TemplateConsideredOptionsBasicSection from "./TemplateConsideredOptionsBasicSection.vue";
import TemplateDecisionOutcomeBasicSection from "./TemplateDecisionOutcomeBasicSection.vue";

export default defineComponent({
  name: "MadrTemplateBasic",
  components: {
    TemplateTitleSection,
    TemplateContextAndProblemStatementSection,
    TemplateConsideredOptionsBasicSection,
    TemplateDecisionOutcomeBasicSection
  },
  mixins: [vscode, adrData],
  mounted() {
    // add listeners to receive data from extension
    window.addEventListener("message", (event) => {
      const message = event.data;
      switch (message.command) {
        case "requestBasicOptionEdit": {
          if (message.newTitle) {
            const oldTitle = this.consideredOptions[message.index].title;
            this.consideredOptions[message.index].title = message.newTitle;
            if (this.decisionOutcome.chosenOption === oldTitle) {
              this.selectOption(message.index);
            }
          }
          this.validate("consideredOptions");
          this.validate("chosenOption");
          break;
        }
      }
    });
  }
});
</script>
