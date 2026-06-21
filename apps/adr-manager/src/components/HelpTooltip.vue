<template>
    <span
        ref="anchorEl"
        class="help"
        tabindex="0"
        @pointerenter="show"
        @pointerleave="hide"
        @focus="show"
        @blur="hide"
    >
        <span class="mdi mdi-help-circle-outline" aria-hidden="true"></span>
        <Teleport to="body">
            <span v-if="open" ref="bubbleEl" class="help-bubble" :style="pos"><slot /></span>
        </Teleport>
    </span>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";

const anchorEl = ref<HTMLElement>();
const bubbleEl = ref<HTMLElement>();
const open = ref(false);
const pos = reactive({ top: "0px", left: "0px" });

async function show() {
    open.value = true;
    await nextTick();
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
}

function hide() {
    open.value = false;
    window.removeEventListener("scroll", place, true);
    window.removeEventListener("resize", place);
}

function place() {
    const anchor = anchorEl.value;
    const bubble = bubbleEl.value;
    if (!anchor || !bubble) {
        return;
    }
    const a = anchor.getBoundingClientRect();
    const margin = 8;
    const centre = a.left + a.width / 2;
    const left = Math.max(
        margin,
        Math.min(centre - bubble.offsetWidth / 2, window.innerWidth - bubble.offsetWidth - margin)
    );
    pos.top = `${a.bottom + margin}px`;
    pos.left = `${left}px`;
}
</script>

<style scoped>
.help {
    display: inline-flex;
    cursor: help;
    color: var(--adr-ink-3);
}

.help .mdi {
    font-size: 17px;
}

.help:hover {
    color: var(--accent);
}

.help-bubble {
    position: fixed;
    background: rgba(45, 47, 55, 0.96);
    color: #fff;
    border: 1px solid transparent;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-line;
    padding: 8px 11px;
    border-radius: 6px;
    width: max-content;
    max-width: 300px;
    box-shadow: var(--adr-shadow-pop);
    pointer-events: none;
    z-index: 10000;
}
</style>
