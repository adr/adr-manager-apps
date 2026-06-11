<template>
  <div class="template">
    <TemplateTitleSection
      ref="title"
      :key="Number(dataFetched)"
      v-model:title="title"
      :title-prop="title"
      :file-name="fileName"
      @validate="validate('title')"
    ></TemplateTitleSection>
    <hr class="divider" />
    <TemplateContextAndProblemStatementSection
      ref="contextAndProblemStatement"
      :key="Number(dataFetched)"
      v-model:context-and-problem-statement="contextAndProblemStatement"
      :context-and-problem-statement-prop="contextAndProblemStatement"
      @validate="validate('contextAndProblemStatement')"
    ></TemplateContextAndProblemStatementSection>
    <hr class="divider" />
    <TemplateConsideredOptionsBasicSection
      ref="consideredOptions"
      :key="Number(dataFetched)"
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
      :key="Number(dataFetched)"
      v-model:explanation="decisionOutcome.explanation"
      :decision-outcome-prop="decisionOutcome"
      @validate="validate('explanation')"
    ></TemplateDecisionOutcomeBasicSection>
  </div>
</template>

<script lang="ts">
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
