<template>
    <div class="md-render" data-cy="markdownPreview" v-html="compiledMarkdown"></div>
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
.md-render {
    font-size: 14px;
    color: var(--adr-ink);
    text-align: left;
}

.md-render :deep(h1) {
    font-size: 24px;
    font-weight: 500;
    margin: 0 0 14px;
    color: var(--adr-navy);
}

.md-render :deep(h2) {
    font-size: 18px;
    font-weight: 500;
    margin: 26px 0 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--adr-line);
}

.md-render :deep(h3) {
    font-size: 15px;
    font-weight: 700;
    margin: 18px 0 6px;
    color: var(--adr-ink);
}

.md-render :deep(p) {
    margin: 0 0 12px;
}

.md-render :deep(ul) {
    margin: 0 0 12px;
    padding-left: 22px;
}

.md-render :deep(li) {
    margin: 3px 0;
}

.md-render :deep(code) {
    background: var(--adr-code-bg);
    border-radius: 4px;
    padding: 1px 5px;
    font-family: var(--adr-font-mono);
    font-size: 12.5px;
}

.md-render :deep(a) {
    color: var(--accent-600);
    text-decoration: none;
}

.md-render :deep(a:hover) {
    text-decoration: underline;
}
</style>
