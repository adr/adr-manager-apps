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
    /* display: none keeps hidden bubbles out of the scroll container's
       overflow area; opacity alone would still stretch it. */
    display: none;
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(45, 47, 55, 0.96);
    color: #fff;
    border: 1px solid transparent;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: normal;
    text-transform: none;
    white-space: pre-line;
    padding: 8px 11px;
    border-radius: 6px;
    width: max-content;
    max-width: 300px;
    box-shadow: var(--adr-shadow-pop);
    opacity: 0;
    pointer-events: none;
    transition:
        opacity 0.12s,
        display 0.12s allow-discrete;
    z-index: 50;
}

/* For icons flush against the pane's right edge: anchor the bubble's right
   edge to the icon instead of centering, so it never overflows the pane. */
.help.align-end .bubble {
    left: auto;
    right: 0;
    transform: none;
}

.help:hover .bubble,
.help:focus-visible .bubble {
    display: block;
    opacity: 1;
}

@starting-style {
    .help:hover .bubble,
    .help:focus-visible .bubble {
        opacity: 0;
    }
}
</style>
