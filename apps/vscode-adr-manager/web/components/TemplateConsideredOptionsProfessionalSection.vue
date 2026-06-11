<template>
  <div class="considered-options">
    <TemplateHeader
      :info-text="'List all considered options. Click the circle of an option to choose it, rearrange options by drag and drop. Expand an option to add a description and pros / cons.'"
    >
      <h2>Considered Options</h2>
    </TemplateHeader>
    <div class="options">
      <draggable :list="consideredOptions" :sort="true" handle=".opt-grip" @update="$emit('checkSelection', $event)">
        <OptionContainerProfessional
          v-for="(option, index) in consideredOptions"
          :key="option"
          v-model:title="option.title"
          v-model:description="option.description"
          v-model:pros="option.pros"
          v-model:neutrals="option.neutrals"
          v-model:cons="option.cons"
          :title-prop="option.title"
          :pros-prop="option.pros"
          :neutrals-prop="option.neutrals"
          :cons-prop="option.cons"
          :template-version="templateVersion"
          :field-visibility="fieldVisibility"
          :chosen="option.title === chosenOption && index === selectedIndex"
          @select-option="$emit('selectOption', index)"
          @delete-option="$emit('deleteOption', index)"
          @update:title="
            if (selectedIndex === index) $emit('selectOption', index);
            $emit('validate');
          "
          @update:description="$emit('validate')"
          @update:pros="$emit('validate')"
          @update:neutrals="$emit('validate')"
          @update:cons="$emit('validate')"
        ></OptionContainerProfessional>
      </draggable>
      <AddOptionButton @add-option="$emit('addOption')"></AddOptionButton>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import useValidate from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { VueDraggableNext } from "vue-draggable-next";
import TemplateHeader from "./TemplateHeader.vue";
import AddOptionButton from "./AddOptionButton.vue";
import OptionContainerProfessional from "./OptionContainerProfessional.vue";
import { DEFAULT_FIELD_VISIBILITY } from "@adr-manager/core";
import type { FieldVisibility } from "@adr-manager/core";

export default defineComponent({
  name: "TemplateConsideredOptionsProfessionalSection",
  components: {
    TemplateHeader,
    AddOptionButton,
    OptionContainerProfessional,
    draggable: VueDraggableNext
  },
  props: {
    consideredOptionsProp: Array as PropType<
      { title: string; description: string; pros: string[]; neutrals: string[]; cons: string[] }[]
    >,
    chosenOption: String,
    selectedIndex: Number,
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
      consideredOptions: this.consideredOptionsProp
    };
  },
  validations() {
    return {
      consideredOptions: {
        required,
        $lazy: true
      }
    };
  }
});
</script>
