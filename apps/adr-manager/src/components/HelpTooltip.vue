<template>
    <span class="help" tabindex="0">
        <span class="mdi mdi-help-circle-outline" aria-hidden="true"></span>
        <span class="bubble"><slot /></span>
    </span>
</template>

<script setup lang="ts"></script>

<style scoped>
.help {
    position: relative;
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

.help .bubble {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(45, 47, 55, 0.96);
    color: #fff;
    font-size: 12px;
    line-height: 1.5;
    padding: 8px 11px;
    border-radius: 6px;
    width: max-content;
    max-width: 280px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s;
    z-index: 50;
    font-weight: 400;
    text-transform: none;
    letter-spacing: normal;
}

.help:hover .bubble,
.help:focus-visible .bubble {
    opacity: 1;
}
</style>
