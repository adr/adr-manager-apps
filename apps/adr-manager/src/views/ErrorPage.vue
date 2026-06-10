<template>
    <div class="error-page">
        <h2>Error 404</h2>
        <h3>page not found</h3>
        <router-link to="/">Back to the start page</router-link>
    </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.error-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--adr-ink);
}

.error-page h2 {
    margin: 0;
    font-size: 32px;
    font-weight: 600;
    color: var(--adr-navy);
}

.error-page h3 {
    margin: 0;
    font-weight: 400;
    color: var(--adr-ink-2);
}
</style>
