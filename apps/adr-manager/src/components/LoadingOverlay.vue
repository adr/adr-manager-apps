<template>
    <teleport to="body">
        <div v-if="show" class="loading-backdrop">
            <span class="loading-spinner" role="progressbar" aria-label="Loading"></span>
        </div>
    </teleport>
</template>

<script setup lang="ts">
defineProps<{ show: boolean }>();
</script>

<style scoped>
.loading-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(1, 0, 37, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 90;
}

.loading-spinner {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    border: 4px solid rgba(255, 255, 255, 0.35);
    border-top-color: #fff;
    animation: loading-spin 0.9s linear infinite;
}

@keyframes loading-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>
