<template>
    <span data-cy="tag-chip" class="tag-chip" :style="{ '--tag-color': tag.color }" :data-tag-label="tag.label">
        <span class="tag-dot" aria-hidden="true"></span>
        <span class="tag-label">{{ tag.label }}</span>
        <button
            v-if="removable"
            type="button"
            data-cy="tag-remove"
            class="tag-remove"
            :aria-label="`Remove tag ${tag.label}`"
            @click.stop="emit('remove')"
        >
            <span class="mdi mdi-close" aria-hidden="true"></span>
        </button>
    </span>
</template>

<script setup lang="ts">
import type { Tag } from "@/types/adr";

defineProps<{
    tag: Tag;
    removable?: boolean;
}>();

const emit = defineEmits<{ remove: [] }>();
</script>

<style scoped>
.tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 8px 0 7px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--tag-color) 35%, transparent);
    background: color-mix(in srgb, var(--tag-color) 12%, transparent);
    color: color-mix(in srgb, var(--tag-color) 80%, #000);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    user-select: none;
}

.tag-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--tag-color);
    flex: 0 0 auto;
}

.tag-label {
    line-height: 1;
}

.tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    color: inherit;
    padding: 0;
    opacity: 0.6;
    margin-left: 1px;
}

.tag-remove:hover {
    opacity: 1;
    background: color-mix(in srgb, var(--tag-color) 25%, transparent);
}

.tag-remove .mdi {
    font-size: 11px;
}
</style>
