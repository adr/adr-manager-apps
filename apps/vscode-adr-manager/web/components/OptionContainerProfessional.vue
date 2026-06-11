<template>
  <div class="opt-card" :class="{ chosen }">
    <div class="opt-head">
      <span class="opt-grip"><i class="codicon codicon-gripper"></i></span>
      <button type="button" class="opt-choose" title="Mark as chosen option" @click="$emit('selectOption')">
        <i class="codicon" :class="chosen ? 'codicon-pass-filled' : 'codicon-circle-large-outline'"></i>
      </button>
      <input
        v-model="v$.title.$model"
        class="opt-title-input"
        :class="{ invalid: v$.title.$error }"
        placeholder="Option title…"
        spellcheck="true"
        @input="$emit('update:title', $event.target.value)"
      />
      <span v-if="chosen" class="chosen-tag">chosen</span>
      <div class="opt-actions">
        <button
          type="button"
          class="icon-btn"
          :title="isExpanded ? 'Collapse' : 'Expand details'"
          @click="toggleExpansion"
        >
          <i class="codicon" :class="isExpanded ? 'codicon-chevron-up' : 'codicon-chevron-down'"></i>
        </button>
        <button type="button" class="icon-btn danger" title="Remove option" @click="$emit('deleteOption')">
          <i class="codicon codicon-trash"></i>
        </button>
      </div>
    </div>
    <p v-for="error of v$.title.$errors" :key="error.$uid" class="error-message title-error">{{ error.$message }}</p>
    <div v-if="isExpanded" class="opt-body">
      <template v-if="fieldVisibility.optionDescription">
        <div class="subhead">
          <h4>Description</h4>
          <HelpTooltip>
            Describe the option in free form, e.g. by giving examples or a pointer to more information.
          </HelpTooltip>
        </div>
        <textarea
          class="field auto-grow-description"
          placeholder="Describe this option…"
          spellcheck="true"
          :value="description"
          @input="
            updateHeight('description');
            $emit('update:description', $event.target.value);
          "
        />
      </template>
      <div v-if="fieldVisibility.optionProsAndCons" class="opt-proscons">
        <div>
          <div class="subhead">
            <h4>Good, because…</h4>
            <HelpTooltip>Give arguments supporting this option.</HelpTooltip>
          </div>
          <draggable
            class="list"
            :list="pros"
            :sort="true"
            handle=".pros-grabber"
            @update="
              updateHeight('pros');
              checkMove('pros', $event);
            "
          >
            <div v-for="(pro, index) in prosWithBlank" :key="index" class="list-row">
              <span class="gutter" :class="pros[index] === '' ? 'dimmed' : 'pros-grabber'">
                <i class="codicon" :class="pros[index] === '' ? 'codicon-add' : 'codicon-gripper'"></i>
              </span>
              <span class="tone-label tone-good">Good</span>
              <textarea
                v-model="pros[index]"
                class="field auto-grow-pro"
                placeholder="a supporting argument…"
                spellcheck="true"
                @input="updateArray('pros', $event.target.value, index, 'pros')"
              />
              <button
                v-if="pros[index] !== ''"
                type="button"
                class="row-del"
                title="Remove"
                @click="updateArray('pros', '', index, 'pros')"
              >
                <i class="codicon codicon-trash"></i>
              </button>
            </div>
          </draggable>
        </div>
        <div v-if="templateVersion === '4.0.0'">
          <div class="subhead">
            <h4>Neutral, because…</h4>
            <span class="ver-tag">4.0</span>
            <HelpTooltip>Arguments that are neither clearly for nor against this option.</HelpTooltip>
          </div>
          <draggable
            class="list"
            :list="neutrals"
            :sort="true"
            handle=".neutrals-grabber"
            @update="
              updateHeight('neutrals');
              checkMove('neutrals', $event);
            "
          >
            <div v-for="(neutral, index) in neutralsWithBlank" :key="index" class="list-row">
              <span class="gutter" :class="neutrals[index] === '' ? 'dimmed' : 'neutrals-grabber'">
                <i class="codicon" :class="neutrals[index] === '' ? 'codicon-add' : 'codicon-gripper'"></i>
              </span>
              <span class="tone-label tone-neutral">Neutral</span>
              <textarea
                v-model="neutrals[index]"
                class="field auto-grow-neutral"
                placeholder="a neutral argument…"
                spellcheck="true"
                @input="updateArray('neutrals', $event.target.value, index, 'neutrals')"
              />
              <button
                v-if="neutrals[index] !== ''"
                type="button"
                class="row-del"
                title="Remove"
                @click="updateArray('neutrals', '', index, 'neutrals')"
              >
                <i class="codicon codicon-trash"></i>
              </button>
            </div>
          </draggable>
        </div>
        <div>
          <div class="subhead">
            <h4>Bad, because…</h4>
            <HelpTooltip>Give arguments against using this option.</HelpTooltip>
          </div>
          <draggable
            class="list"
            :list="cons"
            :sort="true"
            handle=".cons-grabber"
            @update="
              updateHeight('cons');
              checkMove('cons', $event);
            "
          >
            <div v-for="(con, index) in consWithBlank" :key="index" class="list-row">
              <span class="gutter" :class="cons[index] === '' ? 'dimmed' : 'cons-grabber'">
                <i class="codicon" :class="cons[index] === '' ? 'codicon-add' : 'codicon-gripper'"></i>
              </span>
              <span class="tone-label tone-bad">Bad</span>
              <textarea
                v-model="cons[index]"
                class="field auto-grow-con"
                placeholder="an argument against…"
                spellcheck="true"
                @input="updateArray('cons', $event.target.value, index, 'cons')"
              />
              <button
                v-if="cons[index] !== ''"
                type="button"
                class="row-del"
                title="Remove"
                @click="updateArray('cons', '', index, 'cons')"
              >
                <i class="codicon codicon-trash"></i>
              </button>
            </div>
          </draggable>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import useValidate from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import { VueDraggableNext } from "vue-draggable-next";
import HelpTooltip from "./HelpTooltip.vue";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldVisibility } from "@adr-manager/core";

export default defineComponent({
  name: "OptionContainerProfessional",
  components: {
    HelpTooltip,
    draggable: VueDraggableNext
  },
  props: {
    titleProp: String,
    description: String,
    chosen: {
      type: Boolean,
      default: false
    },
    prosProp: {
      type: Array as PropType<string[]>,
      default: []
    },
    neutralsProp: {
      type: Array as PropType<string[]>,
      default: []
    },
    consProp: {
      type: Array as PropType<string[]>,
      default: []
    },
    templateVersion: {
      type: String,
      default: "2.1.2"
    },
    fieldVisibility: {
      type: Object as PropType<FieldVisibility>,
      default: () => ({ ...DEFAULT_FIELD_VISIBILITY })
    }
  },
  setup() {
    return {
      v$: useValidate()
    };
  },
  data() {
    return {
      title: this.titleProp,
      isExpanded: false,
      pros: this.prosProp,
      neutrals: this.neutralsProp,
      cons: this.consProp
    };
  },
  computed: {
    prosWithBlank() {
      const prosWithBlank = this.pros;
      prosWithBlank.push("");
      return prosWithBlank;
    },
    neutralsWithBlank() {
      const neutralsWithBlank = this.neutrals;
      neutralsWithBlank.push("");
      return neutralsWithBlank;
    },
    consWithBlank() {
      const consWithBlank = this.cons;
      consWithBlank.push("");
      return consWithBlank;
    }
  },
  mounted() {
    this.v$.$touch();
  },
  methods: {
    /**
     * Expands or collapses the option details and refreshes the auto-grown textarea heights.
     */
    toggleExpansion() {
      this.isExpanded = !this.isExpanded;
      this.updateHeight("description");
      this.updateHeight("pros");
      this.updateHeight("neutrals");
      this.updateHeight("cons");
    },
    /**
     * Prevents the user to drag an item below an empty input field that is reserved for new inputs.
     * @param evt The event fired upon causing an update with a drag
     */
    checkMove(array: string, evt: any) {
      const list = this[array];
      if (list[evt.newIndex - 1] === "") {
        list[evt.newIndex - 1] = list[evt.newIndex];
        list.splice(evt.newIndex, 1);
        this[array] = list.filter((item) => item !== "");
      }
    },
    /**
     * Updates the list of pros/neutrals/cons.
     */
    updateArray(array: string, text: string, index: number, heightKey: string) {
      this[array].splice(index, 1, text);
      this[array] = this[array].filter((item) => item !== "");
      this.$emit(`update:${array}`, this[array]);
      this.updateHeight(heightKey);
    },
    /**
     * Updated the height of the textareas of the specified list based on their input.
     */
    updateHeight(key: string) {
      const selectors = {
        description: ".auto-grow-description",
        pros: ".auto-grow-pro",
        neutrals: ".auto-grow-neutral",
        cons: ".auto-grow-con"
      };
      this.$nextTick(() => {
        const elements = document.querySelectorAll(selectors[key]) as NodeListOf<HTMLElement>;
        elements.forEach((element) => {
          element.style.height = "auto";
          element.style.height = `${element.scrollHeight}px`;
        });
      });
    }
  },
  validations() {
    return {
      title: {
        required: helpers.withMessage("Option Title is required", required),
        $lazy: true
      }
    };
  }
});
</script>

<style scoped>
.title-error {
  padding: 0 16px 10px 64px;
  margin: 0;
}

.opt-body {
  padding: 4px 16px 16px 40px;
  border-top: 1px dashed var(--adr-line);
}

.auto-grow-description,
.auto-grow-pro,
.auto-grow-neutral,
.auto-grow-con {
  overflow-y: hidden;
}

.opt-proscons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 28px;
}

@media (max-width: 820px) {
  .opt-proscons {
    grid-template-columns: 1fr;
  }
}
</style>
