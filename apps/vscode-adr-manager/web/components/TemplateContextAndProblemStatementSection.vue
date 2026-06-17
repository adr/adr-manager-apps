<template>
  <div class="context-section">
    <TemplateHeader
      :info-text="'Describe the context and problem statement, e.g. in free form using two to three sentences or in the form of an illustrative story. You may want to articulate the problem in form of a question.'"
    >
      <h2>Context and Problem Statement</h2>
    </TemplateHeader>
    <textarea
      id="auto-grow-context-problem-statement"
      v-model="v$['contextAndProblemStatement'].$model"
      class="field"
      :class="{ invalid: v$['contextAndProblemStatement'].$error }"
      placeholder="Describe the context and the problem this decision addresses…"
      spellcheck="true"
      @input="
        updateHeight();
        $emit('update:contextAndProblemStatement', ($event.target as HTMLTextAreaElement).value);
        $emit('validate');
      "
    />
    <p v-for="error of v$['contextAndProblemStatement'].$errors" :key="error.$uid" class="error-message">
      {{ error.$message }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import useValidate from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import TemplateHeader from "./TemplateHeader.vue";

export default defineComponent({
  name: "TemplateContextAndProblemStatementSection",
  components: {
    TemplateHeader
  },
  props: {
    contextAndProblemStatementProp: {
      type: String,
      default: ""
    }
  },
  emits: ["update:contextAndProblemStatement", "validate"],
  setup() {
    return {
      v$: useValidate()
    };
  },
  data() {
    return {
      contextAndProblemStatement: this.contextAndProblemStatementProp
    };
  },
  /**
   * Sizes the textarea to prefilled content and revalidates without marking
   * pristine fields as erroneous.
   */
  mounted() {
    this.updateHeight();
    this.$emit("validate");
  },
  methods: {
    /**
     * Updated the height of the textarea based on the input.
     */
    updateHeight() {
      this.$nextTick(() => {
        const cps = document.getElementById("auto-grow-context-problem-statement")!;
        cps.style.height = "auto";
        cps.style.height = `${cps.scrollHeight}px`;
      });
    }
  },
  validations() {
    return {
      contextAndProblemStatement: {
        required: helpers.withMessage("Context and Problem Statement is required", required),
        $lazy: true
      }
    };
  }
});
</script>

<style scoped>
#auto-grow-context-problem-statement {
  min-height: 92px;
  overflow-y: hidden;
}
</style>
