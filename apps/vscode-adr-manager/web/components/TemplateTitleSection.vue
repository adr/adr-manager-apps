<template>
  <div class="title-section">
    <div class="title-wrap">
      <input
        v-model="v$['title'].$model"
        type="text"
        class="title-input"
        :class="{ invalid: v$['title'].$error }"
        placeholder="Decision title"
        spellcheck="true"
        @input="
          $emit('update:title', ($event.target as HTMLInputElement).value);
          $emit('validate');
        "
      />
      <HelpTooltip class="align-end">
        Describe the solved problem and the solution concisely. The title is also used as the file name, so keep it
        short and avoid special characters.
      </HelpTooltip>
    </div>
    <p v-for="error of v$['title'].$errors" :key="error.$uid" class="error-message">{{ error.$message }}</p>
    <div v-if="fileName" class="title-hint">
      <i class="codicon codicon-info"></i>
      Changing the title changes the file name: <code>{{ fileName }}</code>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import useValidate from "@vuelidate/core";
import { required, helpers } from "@vuelidate/validators";
import HelpTooltip from "./HelpTooltip.vue";

const noInvalidCharacters = (value: string) => {
  return !value.match(/[?*:\"<>|/\\]/);
};

export default defineComponent({
  name: "TemplateTitleSection",
  components: {
    HelpTooltip
  },
  props: {
    titleProp: String,
    fileName: String
  },
  setup() {
    return {
      v$: useValidate()
    };
  },
  data() {
    return {
      title: this.titleProp
    };
  },
  /**
   * Revalidates on mount so prefilled values enable the save button without
   * marking pristine fields as erroneous.
   */
  mounted() {
    this.$emit("validate");
  },
  validations() {
    return {
      title: {
        required: helpers.withMessage("Title is required", required),
        noInvalidCharacters: helpers.withMessage(
          'Title must not include the following characters: ? * : " < > | / \\',
          noInvalidCharacters
        ),
        $lazy: true
      }
    };
  }
});
</script>

<style scoped>
.title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-input {
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  font-family: inherit;
  font-size: var(--adr-text-h1);
  font-weight: 600;
  color: var(--adr-ink);
  padding: 6px 2px;
  letter-spacing: -0.02em;
  border-bottom: 2px solid var(--adr-line);
  transition: border-color 0.15s;
}

.title-input::placeholder {
  color: var(--adr-ink-3);
  font-weight: 400;
}

.title-input:focus {
  border-bottom-color: var(--adr-focus);
}

.title-input.invalid {
  border-bottom-color: var(--adr-error);
}

.title-hint {
  font-size: 12px;
  color: var(--adr-ink-3);
  margin: 7px 2px 0;
}

.title-hint .codicon {
  font-size: 14px;
  margin-right: 4px;
  vertical-align: text-bottom;
}

.title-hint code {
  font-family: var(--adr-font-mono);
  background: var(--adr-code-bg);
  border-radius: 4px;
  padding: 1px 5px;
}
</style>
