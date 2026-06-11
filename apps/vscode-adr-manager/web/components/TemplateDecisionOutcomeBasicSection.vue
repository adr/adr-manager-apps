<template>
  <div class="decision-outcome">
    <TemplateHeader
      :info-text="'Select the chosen option by clicking its circle in the list above, and explain why. You can add consequences in the Professional editor mode.'"
    >
      <h2>Decision Outcome</h2>
    </TemplateHeader>
    <div class="chosen-row">
      <span class="lbl">Chosen option</span>
      <span class="chip chosen-chip" :class="{ none: !decisionOutcome.chosenOption }">
        <i
          class="codicon"
          :class="decisionOutcome.chosenOption ? 'codicon-pass-filled' : 'codicon-circle-large-outline'"
        ></i>
        {{ chosenOptionText }}
      </span>
      <p v-if="!decisionOutcome.chosenOption" class="hint">Choose one of the considered options above</p>
    </div>
    <div class="because-row">
      <span class="lbl">because</span>
      <div class="because-input">
        <textarea
          id="auto-grow-explanation"
          v-model="v$['decisionOutcome'].explanation.$model"
          class="field"
          :class="{ invalid: v$['decisionOutcome'].explanation.$error }"
          placeholder="justification for the chosen option…"
          spellcheck="true"
          @input="
            updateHeight();
            $emit('update:explanation', ($event.target as HTMLTextAreaElement).value);
            $emit('validate');
          "
        />
        <p v-for="error of v$['decisionOutcome'].explanation.$errors" :key="error.$uid" class="error-message">
          {{ error.$message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import useValidate from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import TemplateHeader from "./TemplateHeader.vue";
import { createShortTitle } from "../../src/plugins/utils";

export default defineComponent({
  name: "TemplateDecisionOutcomeBasicSection",
  components: {
    TemplateHeader
  },
  props: {
    decisionOutcomeProp: {
      type: Object as PropType<{
        chosenOption: string;
        explanation: string;
        positiveConsequences: string[];
        negativeConsequences: string[];
      }>,
      default: {
        chosenOption: "",
        explanation: "",
        positiveConsequences: [] as string[],
        negativeConsequences: [] as string[]
      }
    }
  },
  setup() {
    return {
      v$: useValidate()
    };
  },
  data() {
    return {
      decisionOutcome: this.decisionOutcomeProp
    };
  },
  computed: {
    chosenOptionText() {
      return this.decisionOutcome.chosenOption !== "" ? createShortTitle(this.decisionOutcome.chosenOption!) : "none";
    }
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
        const explanation = document.getElementById("auto-grow-explanation")!;
        explanation.style.height = "auto";
        explanation.style.height = `${explanation.scrollHeight}px`;
      });
    }
  },
  validations() {
    return {
      decisionOutcome: {
        chosenOption: {
          required,
          $lazy: true
        },
        explanation: {
          required: helpers.withMessage("Explanation is required", required),
          $lazy: true
        }
      }
    };
  }
});
</script>

<style scoped>
.chosen-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint {
  font-size: var(--adr-text-xs);
  color: var(--adr-ink-3);
}

.lbl {
  flex: 0 0 auto;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--adr-ink-2);
}

.chosen-chip {
  font-weight: 600;
  cursor: default;
}

.chosen-chip:not(.none) {
  border-color: var(--adr-success);
  color: var(--adr-success);
}

.chosen-chip:not(.none) .codicon {
  color: var(--adr-success);
}

.chosen-chip.none {
  border-style: dashed;
  color: var(--adr-ink-3);
}

.because-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 12px;
}

.because-row .lbl {
  padding-top: 10px;
}

.because-input {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

#auto-grow-explanation {
  overflow-y: hidden;
}
</style>
