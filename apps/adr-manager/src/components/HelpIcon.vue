<template>
    <v-tooltip location="bottom">
        <template #activator="{ props }">
            <v-icon class="mx-1 help-icon" v-bind="props">mdi-help-circle-outline</v-icon>
        </template>
        <div class="help-tooltip">
            <slot />
        </div>
    </v-tooltip>
</template>

<script setup lang="ts"></script>

<style scoped>
.help-tooltip {
    max-width: 400px;
}

.help-icon {
    color: rgba(0, 0, 0, 0.54);
}
</style>
