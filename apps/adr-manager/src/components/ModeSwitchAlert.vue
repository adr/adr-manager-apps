<template>
    <div class="alert" role="alert">
        <span class="mdi mdi-alert" aria-hidden="true"></span>
        <span class="atext"><slot /></span>
        <button type="button" class="btn btn-outline" @click="store.setMode('professional')">
            Switch to professional
        </button>
    </div>
</template>

<script setup lang="ts">
import { store } from "@/plugins/store";
</script>
