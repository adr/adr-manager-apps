<template>
  <div id="template">
    <TemplateTitleSection
      ref="title"
      :key="dataFetched"
      v-model:title="title"
      :title-prop="title"
      @validate="validate('title')"
    ></TemplateTitleSection>
    <TemplateDateStatusDecidersSection
      :key="dataFetched"
      v-model:date="date"
      v-model:status="status"
      v-model:deciders="deciders"
      @validate="validateAll"
    ></TemplateDateStatusDecidersSection>
    <TemplateTechnicalStorySection
      :key="dataFetched"
      v-model:technical-story="technicalStory"
      @validate="validateAll"
    ></TemplateTechnicalStorySection>
    <hr />
    <TemplateContextAndProblemStatementSection
      ref="contextAndProblemStatement"
      :key="dataFetched"
      v-model:context-and-problem-statement="contextAndProblemStatement"
      :context-and-problem-statement-prop="contextAndProblemStatement"
      @validate="validate('contextAndProblemStatement')"
    ></TemplateContextAndProblemStatementSection>
    <hr />
    <TemplateDecisionDriversSection
      :key="dataFetched"
      v-model:decision-drivers="decisionDrivers"
      :decision-drivers-prop="decisionDrivers"
      @update:decision-drivers="validateAll"
    ></TemplateDecisionDriversSection>
    <hr />
    <TemplateConsideredOptionsProfessionalSection
      ref="consideredOptions"
      :key="dataFetched"
      v-model:considered-options="consideredOptions"
      v-model:chosen-option="decisionOutcome.chosenOption"
      v-model:selected-index="selectedIndex"
      :considered-options-prop="consideredOptions"
      @add-option="addOption"
      @select-option="selectOption"
      @delete-option="deleteOption"
      @check-selection="checkSelection"
      @validate="
        validate('consideredOptions');
        validate('chosenOption');
      "
    ></TemplateConsideredOptionsProfessionalSection>
    <hr />
    <TemplateDecisionOutcomeProfessionalSection
      ref="decisionOutcome"
      :key="dataFetched"
      v-model:explanation="decisionOutcome.explanation"
      v-model:positive-consequences="decisionOutcome.positiveConsequences"
      v-model:negative-consequences="decisionOutcome.negativeConsequences"
      :decision-outcome-prop="decisionOutcome"
      @validate="validate('explanation')"
      @update-array="validateAll"
    ></TemplateDecisionOutcomeProfessionalSection>
    <hr />
    <TemplateLinksSection
      :key="dataFetched"
      v-model:links="links"
      :links-prop="links"
      @update:links="validateAll"
    ></TemplateLinksSection>
  </div>
</template>

<script lang="ts">
// Mixin defining all methods, variables etc. to hold the data of an ADR
import adrData from "../mixins/adr-data";

import { defineComponent } from "vue";
import vscode from "../mixins/vscode-api-mixin";
import TemplateDateStatusDecidersSection from "./TemplateDateStatusDecidersSection.vue";
import TemplateTitleSection from "./TemplateTitleSection.vue";
import TemplateTechnicalStorySection from "./TemplateTechnicalStorySection.vue";
import TemplateContextAndProblemStatementSection from "./TemplateContextAndProblemStatementSection.vue";
import TemplateDecisionDriversSection from "./TemplateDecisionDriversSection.vue";
import TemplateConsideredOptionsProfessionalSection from "./TemplateConsideredOptionsProfessionalSection.vue";
import TemplateDecisionOutcomeProfessionalSection from "./TemplateDecisionOutcomeProfessionalSection.vue";
import TemplateLinksSection from "./TemplateLinksSection.vue";

export default defineComponent({
  name: "MadrTemplateProfessional",
  components: {
    TemplateDateStatusDecidersSection,
    TemplateTitleSection,
    TemplateTechnicalStorySection,
    TemplateContextAndProblemStatementSection,
    TemplateDecisionDriversSection,
    TemplateConsideredOptionsProfessionalSection,
    TemplateDecisionOutcomeProfessionalSection,
    TemplateLinksSection
  },
  mixins: [vscode, adrData]
});
</script>

<style lang="scss" scoped>
@use "../static/mixins.scss" as *;

#template {
  width: 95%;
  height: auto;
  background: var(--vscode-textBlockQuote-background);
  border: 1.5px solid var(--vscode-input-foreground);
  margin: 1.5rem auto;
  padding: 1.5rem;
}

hr {
  margin-top: 2rem;
  margin-bottom: 2rem;
  border: 0.5px solid var(--vscode-input-foreground);
}
</style>
