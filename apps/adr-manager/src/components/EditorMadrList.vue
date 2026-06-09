<template>
    <v-list class="my-0 py-0" density="compact">
        <v-list-item class="align-self-center mx-0 px-0 d-flex" v-for="(item, idx) in displayedList" :key="item.id">
            <drop @dragenter="(event: DnDEvent) => moveItem(event.data.id, idx)" class="my-0 py-0 flex-grow-1">
                <v-card
                    flat
                    class="d-flex"
                    :class="{ 'drag-active': draggedItem === item }"
                    min-height="36px"
                    @mouseenter="hoveredItem = item"
                    @mouseleave="hoveredItem = null"
                >
                    <div class="align-center flex-shrink-0 flex-grow-0 my-0 py-0 mx-0 d-flex drag-gutter">
                        <drag
                            v-show="hoveredItem === item || draggedItem === item"
                            :data="item"
                            @dragstart="draggedItem = item"
                            @dragend="draggedItem = null"
                            class="flex-grow-1"
                        >
                            <template #drag-image>{{ item.content }}</template>
                            <v-icon> mdi-drag-vertical </v-icon>
                        </drag>
                        <v-icon v-show="hoveredItem !== item && draggedItem !== item"></v-icon>
                    </div>

                    <v-card flat class="flex-grow-1">
                        <EditorMadrCodemirror
                            :ref="(el: CmRefEl) => setCmRef(item.id, el)"
                            :model-value="list[idx] ?? ''"
                            @update:model-value="(value) => onItemInput(idx, value)"
                            @blur="removeItemIfEmptyAt(idx)"
                        />
                    </v-card>

                    <div v-show="hoveredItem === item" class="align-center flex-shrink-0 flex-grow-0">
                        <v-btn icon variant="text" density="comfortable" @click="removeItemAt(idx)">
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </div>
                </v-card>
            </drop>
        </v-list-item>

        <v-list-item class="align-self-center mx-0 px-0 d-flex" :key="-list.length - 2">
            <div class="align-center flex-shrink-0 flex-grow-0 my-0 py-0 drag-gutter"></div>
            <EditorMadrCodemirror class="flex-grow-1" :model-value="lastItem" @update:model-value="onLastInput" />
        </v-list-item>
    </v-list>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import type { ComponentPublicInstance } from "vue";
import EditorMadrCodemirror from "./EditorMadrCodemirror.vue";
import { Drag, Drop, type DnDEvent } from "vue-easy-dnd";

interface DisplayItem {
    content: string;
    id: number;
}
type CmInstance = InstanceType<typeof EditorMadrCodemirror>;
type CmRefEl = Element | ComponentPublicInstance | null;

const props = defineProps<{ list: string[] }>();

const lastItem = ref("");
const displayedList = ref<DisplayItem[]>([]);
const hoveredItem = ref<DisplayItem | null>(null);
const draggedItem = ref<DisplayItem | null>(null);
const cmRefs = new Map<number, CmInstance>();

function setCmRef(id: number, el: CmRefEl): void {
    if (el) {
        cmRefs.set(id, el as CmInstance);
    } else {
        cmRefs.delete(id);
    }
}

function nextId(): number {
    return Math.max(...displayedList.value.map((item) => item.id), 0) + 1;
}

// Keep the bound `list` array in sync with the internal (stably-keyed) displayedList.
watch(
    displayedList,
    (newDisplayedList) => {
        props.list.length = newDisplayedList.length;
        for (let i = 0; i < props.list.length; i++) {
            const entry = newDisplayedList[i];
            if (entry) {
                props.list[i] = entry.content;
            }
        }
    },
    { deep: true }
);

watch(
    () => props.list,
    (newList) => {
        if (displayedList.value.length > newList.length) {
            displayedList.value.length = newList.length;
        }
        for (let i = 0; i < newList.length; i++) {
            const content = newList[i] ?? "";
            const existing = displayedList.value[i];
            if (existing) {
                existing.content = content;
            } else {
                displayedList.value.push({ content, id: nextId() });
            }
        }
    },
    { deep: true }
);

onMounted(() => {
    displayedList.value = props.list.map((str, idx) => ({ content: str, id: idx }));
});

function onLastInput(val: string): void {
    lastItem.value = val;
    if (lastItem.value.trim() !== "") {
        addItem();
        const last = displayedList.value[displayedList.value.length - 1];
        if (last) {
            void nextTick(() => cmRefs.get(last.id)?.focus());
        }
    }
}

function addItem(): DisplayItem {
    const item: DisplayItem = { content: lastItem.value, id: nextId() };
    displayedList.value.push(item);
    lastItem.value = "";
    return item;
}

function onItemInput(idx: number, value: string): void {
    props.list[idx] = value;
}

function removeItemIfEmptyAt(idx: number): void {
    const entry = displayedList.value[idx];
    if (entry && entry.content.trim() === "") {
        removeItemAt(idx);
    }
}

function removeItemAt(idx: number): void {
    displayedList.value.splice(idx, 1);
}

function moveItem(id: number, newIndex: number): void {
    if (typeof newIndex === "number" && displayedList.value.find((el) => el.id === id)) {
        const oldIndex = displayedList.value.findIndex((el) => el.id === id);
        const item = displayedList.value[oldIndex];
        if (item) {
            displayedList.value.splice(oldIndex, 1);
            displayedList.value.splice(newIndex, 0, item);
        }
    }
}
</script>

<style scoped>
.v-list-item :deep(.v-list-item__content) {
    display: flex;
    flex: 1 1 auto;
    width: 100%;
}
</style>
