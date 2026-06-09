<template>
    <v-sheet class="compiled-markdown" data-cy="markdownPreview" v-html="compiledMarkdown"></v-sheet>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";

const props = withDefaults(defineProps<{ value?: string }>(), { value: "" });

const compiledMarkdown = computed<string>(() => {
    const html = marked.parse(props.value);
    return typeof html === "string" ? html : "";
});
</script>

<style scoped>
div {
    text-align: left;
}
</style>
