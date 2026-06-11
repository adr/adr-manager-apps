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
    <TemplateDateStatusDecidersSection
      :key="dataFetched"
      v-model:date="date"
      v-model:status="status"
      v-model:deciders="deciders"
      v-model:decision-makers="decisionMakers"
      v-model:consulted="consulted"
      v-model:informed="informed"
      :template-version="templateVersion"
      :field-visibility="fieldVisibility"
      @validate="validateAll"
    ></TemplateDateStatusDecidersSection>
    <hr class="divider" />
    <TemplateContextAndProblemStatementSection
      ref="contextAndProblemStatement"
      :key="dataFetched"
      v-model:context-and-problem-statement="contextAndProblemStatement"
      :context-and-problem-statement-prop="contextAndProblemStatement"
      @validate="validate('contextAndProblemStatement')"
    ></TemplateContextAndProblemStatementSection>
    <TemplateTechnicalStorySection
      v-if="templateVersion === '2.1.2' && fieldVisibility.technicalStory"
      :key="dataFetched"
      v-model:technical-story="technicalStory"
      @validate="validateAll"
    ></TemplateTechnicalStorySection>
    <hr class="divider" />
    <TemplateDecisionDriversSection
      v-if="fieldVisibility.decisionDrivers"
      :key="dataFetched"
      v-model:decision-drivers="decisionDrivers"
      :decision-drivers-prop="decisionDrivers"
      @update:decision-drivers="validateAll"
    ></TemplateDecisionDriversSection>
    <hr v-if="fieldVisibility.decisionDrivers" class="divider" />
    <TemplateConsideredOptionsProfessionalSection
      ref="consideredOptions"
      :key="dataFetched"
      v-model:considered-options="consideredOptions"
      v-model:chosen-option="decisionOutcome.chosenOption"
      v-model:selected-index="selectedIndex"
      :considered-options-prop="consideredOptions"
      :template-version="templateVersion"
      :field-visibility="fieldVisibility"
      @add-option="addOption"
      @select-option="selectOption"
      @delete-option="deleteOption"
      @check-selection="checkSelection"
      @validate="
        validate('consideredOptions');
        validate('chosenOption');
      "
    ></TemplateConsideredOptionsProfessionalSection>
    <hr class="divider" />
    <TemplateDecisionOutcomeProfessionalSection
      ref="decisionOutcome"
      :key="dataFetched"
      v-model:explanation="decisionOutcome.explanation"
      v-model:positive-consequences="decisionOutcome.positiveConsequences"
      v-model:negative-consequences="decisionOutcome.negativeConsequences"
      v-model:confirmation="confirmation"
      :decision-outcome-prop="decisionOutcome"
      :consequences-prop="consequences"
      :template-version="templateVersion"
      :field-visibility="fieldVisibility"
      @validate="validate('explanation')"
      @update-array="validateAll"
    ></TemplateDecisionOutcomeProfessionalSection>
    <hr class="divider" />
    <TemplateLinksSection
      v-if="templateVersion === '2.1.2' && fieldVisibility.links"
      :key="dataFetched"
      v-model:links="links"
      :links-prop="links"
      @update:links="validateAll"
    ></TemplateLinksSection>
    <TemplateMoreInformationSection
      v-else-if="templateVersion !== '2.1.2' && fieldVisibility.moreInformation"
      :key="dataFetched"
      v-model:more-information="moreInformation"
      @validate="validateAll"
    ></TemplateMoreInformationSection>
  </div>
</template>

<script lang="ts">
// Mixin defining all methods, variables etc. to hold the data of an ADR
import adrData from "../mixins/adr-data";

import { defineComponent, PropType } from "vue";
import vscode from "../mixins/vscode-api-mixin";
import TemplateDateStatusDecidersSection from "./TemplateDateStatusDecidersSection.vue";
import TemplateTitleSection from "./TemplateTitleSection.vue";
import TemplateTechnicalStorySection from "./TemplateTechnicalStorySection.vue";
import TemplateContextAndProblemStatementSection from "./TemplateContextAndProblemStatementSection.vue";
import TemplateDecisionDriversSection from "./TemplateDecisionDriversSection.vue";
import TemplateConsideredOptionsProfessionalSection from "./TemplateConsideredOptionsProfessionalSection.vue";
import TemplateDecisionOutcomeProfessionalSection from "./TemplateDecisionOutcomeProfessionalSection.vue";
import TemplateLinksSection from "./TemplateLinksSection.vue";
import TemplateMoreInformationSection from "./TemplateMoreInformationSection.vue";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldVisibility } from "@adr-manager/core";

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
    TemplateLinksSection,
    TemplateMoreInformationSection
  },
  mixins: [vscode, adrData],
  props: {
    fieldVisibility: {
      type: Object as PropType<FieldVisibility>,
      default: () => ({ ...DEFAULT_FIELD_VISIBILITY })
    }
  }
});
</script>
