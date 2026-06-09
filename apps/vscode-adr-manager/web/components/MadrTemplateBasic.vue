<template>
	<div id="template">
		<TemplateTitleSection
			ref="title"
			:key="dataFetched"
			v-model:title="title"
			:title-prop="title"
			@validate="validate('title')"
		></TemplateTitleSection>
		<hr />
		<TemplateContextAndProblemStatementSection
			ref="contextAndProblemStatement"
			:key="dataFetched"
			v-model:context-and-problem-statement="contextAndProblemStatement"
			:context-and-problem-statement-prop="contextAndProblemStatement"
			@validate="validate('contextAndProblemStatement')"
		></TemplateContextAndProblemStatementSection>
		<hr />
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
		<hr />
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
			TemplateDecisionOutcomeBasicSection,
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
		},
	});
</script>

<style lang="scss" scoped>
	@use "../static/mixins.scss" as *;

	#template {
		width: 95%;
		height: auto;
		background: var(--vscode-textBlockQuote-background);
		border: 1.5px solid var(--vscode-input-foreground);
		margin: 1.5rem auto 0.5rem auto;
		padding: 1.5rem;
	}

	hr {
		margin-top: 2rem;
		margin-bottom: 2rem;
		border: 0.5px solid var(--vscode-input-foreground);
	}
</style>
