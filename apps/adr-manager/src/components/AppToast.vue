<template>
    <div
        class="toast"
        :class="{ show: toast, 'toast-error': toast?.variant === 'error' }"
        role="status"
        aria-live="polite"
    >
        <span
            class="mdi"
            :class="toast?.variant === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle'"
            aria-hidden="true"
        ></span>
        {{ toast?.text }}
    </div>
</template>

<script setup lang="ts">
import { useToast } from "@/composables/useToast";

const { toast } = useToast();
</script>

<style scoped>
.toast {
    position: fixed;
    bottom: 44px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--adr-navy);
    color: #fff;
    font-size: 13px;
    padding: 11px 18px;
    border-radius: 8px;
    box-shadow: var(--adr-shadow-pop);
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s;
    z-index: 80;
    display: flex;
    align-items: center;
    gap: 9px;
}

.toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.toast .mdi {
    font-size: 18px;
    color: #9ccc65;
}

.toast-error {
    border-left: 3px solid var(--adr-error);
    max-width: min(520px, calc(100vw - 32px));
}

.toast-error .mdi {
    color: var(--adr-error);
}
</style>
