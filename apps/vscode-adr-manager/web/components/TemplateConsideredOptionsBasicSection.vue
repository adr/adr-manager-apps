<template>
  <div class="considered-options">
    <TemplateHeader
      :info-text="'List all considered options. Click the circle of an option to choose it, rearrange options by drag and drop. Only write a concise title; you can add a detailed description in the Professional editor mode.'"
    >
      <h2>Considered Options</h2>
    </TemplateHeader>
    <div class="options">
      <draggable :list="consideredOptions" :sort="true" handle=".opt-grip" @update="$emit('checkSelection', $event)">
        <OptionContainerBasic
          v-for="(option, index) in consideredOptions"
          :key="index"
          :title="option.title"
          :chosen="option.title === chosenOption && index === selectedIndex"
          @select-option="$emit('selectOption', index)"
          @edit-option="$emit('editOption', { title: option.title, index: index })"
          @delete-option="$emit('deleteOption', index)"
        ></OptionContainerBasic>
      </draggable>
      <AddOptionButton @add-option="$emit('addOption')"></AddOptionButton>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import useValidate from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import TemplateHeader from "./TemplateHeader.vue";
import { VueDraggableNext } from "vue-draggable-next";
import OptionContainerBasic from "./OptionContainerBasic.vue";
import AddOptionButton from "./AddOptionButton.vue";

type ConsideredOption = {
  title: string;
  description: string;
  pros: string[];
  neutrals: string[];
  cons: string[];
};

export default defineComponent({
  name: "TemplateConsideredOptionsBasicSection",
  components: {
    TemplateHeader,
    OptionContainerBasic,
    AddOptionButton,
    draggable: VueDraggableNext
  },
  props: {
    consideredOptionsProp: Array as PropType<ConsideredOption[]>,
    chosenOption: String,
    selectedIndex: Number
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
