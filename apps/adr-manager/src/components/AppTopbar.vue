<template>
    <header class="topbar">
        <button
            type="button"
            class="btn btn-ghost exp-toggle"
            title="Toggle repository panel"
            @click="emit('toggle-explorer')"
        >
            <span class="mdi" :class="showExplorer ? 'mdi-dock-left' : 'mdi-menu'" aria-hidden="true"></span>
        </button>
        <div class="brand">
            <img src="../assets/logo-badge.png" alt="ADR Manager" />
            <span class="word">ADR<span> Manager</span></span>
        </div>
        <MadrVersionSelect :model-value="templateVersion" @update:model-value="emit('set-version', $event)" />
        <span class="spacer"></span>
        <span class="seg-label">Editor mode</span>
        <div class="seg">
            <button
                type="button"
                data-cy="modeBasic"
                :class="{ on: mode === 'basic' }"
                @click="emit('set-mode', 'basic')"
            >
                Basic
            </button>
            <button
                type="button"
                data-cy="modeProfessional"
                :class="{ on: mode === 'professional' }"
                @click="emit('set-mode', 'professional')"
            >
                Professional
            </button>
        </div>
        <FieldVisibilityPanel v-if="mode === 'professional'" :template-version="templateVersion" />
        <button type="button" class="btn btn-ghost" title="Toggle live preview" @click="emit('toggle-preview')">
            <span
                class="mdi"
                :class="showPreview ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                aria-hidden="true"
            ></span>
        </button>
        <button
            type="button"
            class="btn btn-outline"
            title="Copy the markdown to the clipboard"
            @click="emit('copy-md')"
        >
            <span class="mdi mdi-content-copy" aria-hidden="true"></span>
            Copy MD
        </button>
        <button
            type="button"
            data-cy="commitTopbar"
            class="btn btn-primary"
            :disabled="!canCommit"
            @click="emit('commit')"
        >
            <span class="mdi mdi-source-commit" aria-hidden="true"></span>
            Commit
        </button>
        <button
            type="button"
            data-cy="disconnect"
            class="btn btn-ghost"
            title="Disconnect from GitHub"
            @click="emit('disconnect')"
        >
            <span class="mdi mdi-logout" aria-hidden="true"></span>
        </button>
    </header>
</template>

<script setup lang="ts">
import MadrVersionSelect from "./MadrVersionSelect.vue";
import type { MadrTemplateVersion } from "@adr-manager/core";
import type { Mode } from "@/types/store";
import FieldVisibilityPanel from "./FieldVisibilityPanel.vue";

defineProps<{
    mode: Mode;
    templateVersion: MadrTemplateVersion;
    showExplorer: boolean;
    showPreview: boolean;
    canCommit: boolean;
}>();

const emit = defineEmits<{
    "toggle-explorer": [];
    "toggle-preview": [];
    "set-mode": [Mode];
    "set-version": [MadrTemplateVersion];
    "copy-md": [];
    commit: [];
    disconnect: [];
}>();
</script>

<style scoped>
.topbar {
    height: 60px;
    flex: 0 0 60px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 18px;
    background: var(--adr-surface);
    border-bottom: 1px solid var(--adr-line);
    position: relative;
    z-index: 30;
}

.topbar .btn,
.seg button,
.seg-label {
    white-space: nowrap;
}

.exp-toggle {
    flex: 0 0 auto;
    padding: 0 10px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 11px;
    flex-shrink: 0;
}

.brand img {
    width: 32px;
    height: 32px;
    display: block;
}

.brand .word {
    font-size: 18px;
    font-weight: 700;
    color: var(--adr-navy);
    letter-spacing: 0.2px;
}

.brand .word span {
    font-weight: 400;
    color: var(--adr-ink-2);
}

.seg-label {
    font-size: 12px;
    color: var(--adr-ink-3);
    margin-right: 2px;
    align-self: center;
}

@media (max-width: 1180px) {
    .seg-label {
        display: none;
    }
}

.seg {
    display: inline-flex;
    background: var(--adr-surface-2);
    border-radius: 7px;
    padding: 3px;
    gap: 2px;
}

.seg button {
    border: 0;
    background: transparent;
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--adr-ink-2);
    padding: 6px 14px;
    border-radius: 5px;
    cursor: pointer;
    letter-spacing: 0.2px;
}

.seg button.on {
    background: var(--adr-surface);
    color: var(--adr-ink);
    box-shadow: var(--adr-shadow-1);
}
</style>
