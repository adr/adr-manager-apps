<template>
  <div class="decision-outcome">
    <TemplateHeader :info-text="'Select the chosen option by clicking its circle in the list above, and explain why.'">
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
            updateHeight('explanation');
            $emit('update:explanation', ($event.target as HTMLTextAreaElement).value);
            $emit('validate');
          "
        />
        <p v-for="error of v$['decisionOutcome'].explanation.$errors" :key="error.$uid" class="error-message">
          {{ error.$message }}
        </p>
      </div>
    </div>
    <template v-if="templateVersion === '4.0.0'">
      <div class="v4-block">
        <div class="subhead">
          <h4>Consequences</h4>
          <span class="ver-tag">4.0</span>
          <HelpTooltip>Good / Neutral / Bad consequences of the decision, one combined list in MADR 4.0.0.</HelpTooltip>
        </div>
        <ConsequenceListEditor :list="consequences" @changed="$emit('updateArray')"></ConsequenceListEditor>
      </div>
      <div class="v4-block">
        <div class="subhead">
          <h4>Confirmation</h4>
          <span class="ver-tag">4.0</span>
          <HelpTooltip>
            How is implementation / compliance with this decision confirmed? E.g. a review or an ArchUnit test.
          </HelpTooltip>
        </div>
        <textarea
          id="auto-grow-confirmation"
          class="field"
          placeholder="How will this decision be confirmed?…"
          spellcheck="true"
          :value="confirmation"
          @input="
            updateHeight('confirmation');
            $emit('update:confirmation', ($event.target as HTMLTextAreaElement).value);
            $emit('updateArray');
          "
        />
      </div>
    </template>
    <div v-else class="outcome-cols">
      <div>
        <div class="subhead">
          <h4>Positive Consequences</h4>
          <HelpTooltip>e.g. improvement of a quality attribute, follow-up decisions required, …</HelpTooltip>
        </div>
        <draggable
          class="list"
          :list="decisionOutcome.positiveConsequences"
          :sort="true"
          handle=".positive-consequences-grabber"
          @update="
            updateHeight('positives');
            checkMove('positiveConsequences', $event);
          "
        >
          <div v-for="(_, index) in positiveConsequencesWithBlank" :key="index" class="list-row">
            <span
              class="gutter"
              :class="decisionOutcome.positiveConsequences[index] === '' ? 'dimmed' : 'positive-consequences-grabber'"
            >
              <i
                class="codicon"
                :class="decisionOutcome.positiveConsequences[index] === '' ? 'codicon-add' : 'codicon-gripper'"
              ></i>
            </span>
            <textarea
              v-model="decisionOutcome.positiveConsequences[index]"
              class="field auto-grow-positive-consequence"
              placeholder="a positive consequence…"
              spellcheck="true"
              @input="
                updateArray('positiveConsequences', ($event.target as HTMLTextAreaElement).value, index, 'positives')
              "
            />
            <button
              v-if="decisionOutcome.positiveConsequences[index] !== ''"
              type="button"
              class="row-del"
              title="Remove"
              @click="updateArray('positiveConsequences', '', index, 'positives')"
            >
              <i class="codicon codicon-trash"></i>
            </button>
          </div>
        </draggable>
      </div>
      <div>
        <div class="subhead">
          <h4>Negative Consequences</h4>
          <HelpTooltip>e.g. afflicted quality attributes, follow-up decisions required, …</HelpTooltip>
        </div>
        <draggable
          class="list"
          :list="decisionOutcome.negativeConsequences"
          :sort="true"
          handle=".negative-consequences-grabber"
          @update="
            updateHeight('negatives');
            checkMove('negativeConsequences', $event);
          "
        >
          <div v-for="(_, index) in negativeConsequencesWithBlank" :key="index" class="list-row">
            <span
              class="gutter"
              :class="decisionOutcome.negativeConsequences[index] === '' ? 'dimmed' : 'negative-consequences-grabber'"
            >
              <i
                class="codicon"
                :class="decisionOutcome.negativeConsequences[index] === '' ? 'codicon-add' : 'codicon-gripper'"
              ></i>
            </span>
            <textarea
              v-model="decisionOutcome.negativeConsequences[index]"
              class="field auto-grow-negative-consequence"
              placeholder="a negative consequence…"
              spellcheck="true"
              @input="
                updateArray('negativeConsequences', ($event.target as HTMLTextAreaElement).value, index, 'negatives')
              "
            />
            <button
              v-if="decisionOutcome.negativeConsequences[index] !== ''"
              type="button"
              class="row-del"
              title="Remove"
              @click="updateArray('negativeConsequences', '', index, 'negatives')"
            >
              <i class="codicon codicon-trash"></i>
            </button>
          </div>
        </draggable>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import useVuelidate from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import { VueDraggableNext } from "vue-draggable-next";
import ConsequenceListEditor from "./ConsequenceListEditor.vue";
import HelpTooltip from "./HelpTooltip.vue";
import TemplateHeader from "./TemplateHeader.vue";
import { createShortTitle } from "../../src/plugins/utils";

export default defineComponent({
  name: "TemplateDecisionOutcomeProfessionalSection",
  components: {
    ConsequenceListEditor,
    HelpTooltip,
    TemplateHeader,
    draggable: VueDraggableNext
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
    },
    consequencesProp: {
      type: Array as PropType<{ kind: string; text: string }[]>,
      default: () => []
    },
    confirmation: {
      type: String,
      default: ""
    },
    templateVersion: {
      type: String,
      default: "2.1.2"
    }
  },
  setup() {
    return {
      v$: useVuelidate()
    };
  },
  data() {
    return {
      decisionOutcome: this.decisionOutcomeProp,
      consequences: this.consequencesProp
    };
  },
  computed: {
    /**
     * Computes the short title of the option that has been chosen by the user.
     */
    chosenOptionText() {
      return this.decisionOutcome.chosenOption !== "" ? createShortTitle(this.decisionOutcome.chosenOption) : "none";
    },
    /**
     * Computes a new positive consequences array with a blank entry at the end of the array such that
     * a blank input field is rendered for the user to enter a new consequence in.
     */
    positiveConsequencesWithBlank() {
      const positiveConsequencesWithBlank = this.decisionOutcome.positiveConsequences;
      positiveConsequencesWithBlank.push("");
      return positiveConsequencesWithBlank;
    },
    /**
     * Computes a new negative consequences array with a blank entry at the end of the array such that
     * a blank input field is rendered for the user to enter a new consequence in.
     */
    negativeConsequencesWithBlank() {
      const negativeConsequencesWithBlank = this.decisionOutcome.negativeConsequences;
      negativeConsequencesWithBlank.push("");
      return negativeConsequencesWithBlank;
    }
  },
  /**
   * Sizes the textareas to prefilled content and revalidates without marking
   * pristine fields as erroneous.
   */
  mounted() {
    this.updateHeight("explanation");
    this.updateHeight("confirmation");
    this.updateHeight("positives");
    this.updateHeight("negatives");
    this.$emit("validate");
  },
  methods: {
    /**
     * Prevents the user to drag an item below an empty input field that is reserved for new inputs.
     * @param evt The event fired upon causing an update with a drag
     */
    checkMove(array: string, evt: any) {
      if (array === "positiveConsequences") {
        if (this.decisionOutcome.positiveConsequences[evt.newIndex - 1] === "") {
          this.decisionOutcome.positiveConsequences[evt.newIndex - 1] =
            this.decisionOutcome.positiveConsequences[evt.newIndex];
          this.decisionOutcome.positiveConsequences.splice(evt.newIndex, 1);
          this.decisionOutcome.positiveConsequences = this.decisionOutcome.positiveConsequences.filter(
            (positive) => positive !== ""
          );
        }
      } else if (array === "negativeConsequences") {
        if (this.decisionOutcome.negativeConsequences[evt.newIndex - 1] === "") {
          this.decisionOutcome.negativeConsequences[evt.newIndex - 1] =
            this.decisionOutcome.negativeConsequences[evt.newIndex];
          this.decisionOutcome.negativeConsequences.splice(evt.newIndex, 1);
          this.decisionOutcome.negativeConsequences = this.decisionOutcome.negativeConsequences.filter(
            (negative) => negative !== ""
          );
        }
      }
    },
    /**
     * Updates the list of positive/negative consequences.
     */
    updateArray(name: string, text: string, index: number, heightKey: string) {
      if (name === "positiveConsequences") {
        this.decisionOutcome.positiveConsequences.splice(index, 1, text);
        this.decisionOutcome.positiveConsequences = this.decisionOutcome.positiveConsequences.filter(
          (positive) => positive !== ""
        );
        this.$emit("update:positiveConsequences", this.decisionOutcome.positiveConsequences);
      } else if (name === "negativeConsequences") {
        this.decisionOutcome.negativeConsequences.splice(index, 1, text);
        this.decisionOutcome.negativeConsequences = this.decisionOutcome.negativeConsequences.filter(
          (negative) => negative !== ""
        );
        this.$emit("update:negativeConsequences", this.decisionOutcome.negativeConsequences);
      }
      this.$emit("updateArray");
      this.updateHeight(heightKey);
    },
    /**
     * Updated the height of the textarea based on the input.
     */
    updateHeight(key: string) {
      switch (key) {
        case "explanation": {
          this.$nextTick(() => {
            const explanation = document.getElementById("auto-grow-explanation")!;
            explanation.style.height = "auto";
            explanation.style.height = `${explanation.scrollHeight}px`;
          });
          break;
        }
        case "confirmation": {
          this.$nextTick(() => {
            const confirmation = document.getElementById("auto-grow-confirmation");
            if (confirmation) {
              confirmation.style.height = "auto";
              confirmation.style.height = `${confirmation.scrollHeight}px`;
            }
          });
          break;
        }
        case "positives": {
          this.$nextTick(() => {
            const positives = document.querySelectorAll(".auto-grow-positive-consequence") as NodeListOf<HTMLElement>;
            positives.forEach((positive) => {
              positive.style.height = "auto";
              positive.style.height = `${positive.scrollHeight}px`;
            });
          });
          break;
        }
        case "negatives": {
          this.$nextTick(() => {
            const negatives = document.querySelectorAll(".auto-grow-negative-consequence") as NodeListOf<HTMLElement>;
            negatives.forEach((negative) => {
              negative.style.height = "auto";
              negative.style.height = `${negative.scrollHeight}px`;
            });
          });
          break;
        }
      }
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

#auto-grow-explanation,
#auto-grow-confirmation,
.auto-grow-positive-consequence,
.auto-grow-negative-consequence {
  overflow-y: hidden;
}

.v4-block {
  margin-top: 18px;
}

.outcome-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 28px;
  margin-top: 16px;
}

@media (max-width: 820px) {
  .outcome-cols {
    grid-template-columns: 1fr;
  }
}
</style>
