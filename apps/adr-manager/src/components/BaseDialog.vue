<template>
    <teleport to="body">
        <div v-if="show" class="dialog-backdrop" @mousedown.self="show = false" @keydown.esc="show = false">
            <div class="dialog-card" role="dialog" aria-modal="true" :style="{ maxWidth: `${width}px` }">
                <header class="dialog-head">
                    <span class="dialog-avatar">
                        <span class="mdi" :class="`mdi-${icon}`" aria-hidden="true"></span>
                    </span>
                    <h2>{{ title }}</h2>
                    <slot name="header-extra" />
                </header>
                <div class="dialog-body">
                    <slot />
                </div>
                <footer class="dialog-actions">
                    <slot name="actions" />
                </footer>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
const show = defineModel<boolean>({ default: false });

withDefaults(defineProps<{ title: string; icon: string; width?: number }>(), { width: 600 });
</script>

<style scoped>
.dialog-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(1, 0, 37, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 70;
    padding: 24px;
}

.dialog-card {
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    background: var(--adr-surface);
    border-radius: var(--adr-radius-md);
    box-shadow: var(--adr-shadow-pop);
    overflow: hidden;
}

.dialog-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--adr-line);
}

.dialog-head h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: var(--adr-navy);
    white-space: nowrap;
}

.dialog-avatar {
    width: 35px;
    height: 35px;
    flex: 0 0 35px;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.dialog-avatar .mdi {
    font-size: 19px;
}

.dialog-body {
    padding: 16px 20px;
    overflow-y: auto;
    font-size: var(--adr-text-sm);
    color: var(--adr-ink);
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 10px 16px;
    border-top: 1px solid var(--adr-line);
}
</style>
