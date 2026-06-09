<template>
    <v-menu
        v-model="menu"
        :close-on-content-click="false"
        transition="scale-transition"
        location="bottom"
        max-width="290px"
        min-width="290px"
    >
        <template #activator="{ props }">
            <v-chip v-bind="props" variant="outlined">
                <v-icon class="mr-2">mdi-calendar</v-icon> {{ modelValue }}
            </v-chip>
        </template>
        <v-sheet class="date-picker" rounded>
            <div class="date-picker-header">
                <v-btn icon="mdi-chevron-left" variant="text" density="comfortable" @click="shiftMonth(-1)"></v-btn>
                <div class="date-picker-header__value">{{ headerLabel }}</div>
                <v-btn icon="mdi-chevron-right" variant="text" density="comfortable" @click="shiftMonth(1)"></v-btn>
            </div>
            <v-date-picker-month
                :model-value="[date]"
                :month="month"
                :year="year"
                color="accent"
                @update:model-value="update"
                @update:month="month = Number($event)"
                @update:year="year = Number($event)"
            ></v-date-picker-month>
        </v-sheet>
    </v-menu>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const props = withDefaults(defineProps<{ modelValue?: string }>(), { modelValue: "" });
const emit = defineEmits<{ "update:modelValue": [string] }>();

const menu = ref(false);
const date = ref<Date>(new Date());
const month = ref(date.value.getMonth());
const year = ref(date.value.getFullYear());

onMounted(() => {
    if (/\d{4}-\d{2}-\d{2}/.test(props.modelValue)) {
        date.value = new Date(props.modelValue);
        month.value = date.value.getMonth();
        year.value = date.value.getFullYear();
    }
});

const headerLabel = computed(() =>
    new Date(year.value, month.value, 1).toLocaleString("en-US", { month: "long", year: "numeric" })
);

function shiftMonth(delta: number): void {
    const shifted = new Date(year.value, month.value + delta, 1);
    month.value = shifted.getMonth();
    year.value = shifted.getFullYear();
}

function update(value: unknown): void {
    menu.value = false;
    const list = Array.isArray(value) ? value : [value];
    const picked = list[list.length - 1];
    const pickedDate = picked instanceof Date ? picked : new Date(String(picked));
    if (!Number.isNaN(pickedDate.getTime())) {
        date.value = pickedDate;
        month.value = pickedDate.getMonth();
        year.value = pickedDate.getFullYear();
        // The rest of the app stores dates as ISO yyyy-mm-dd strings.
        emit("update:modelValue", pickedDate.toISOString().slice(0, 10));
    }
}
</script>

<style scoped>
.date-picker {
    width: 290px;
}

/* Replicates the Vuetify 2 `no-title` date picker header. */
.date-picker-header {
    display: flex;
    align-items: center;
    padding: 4px 16px;
    height: 48px;
}

.date-picker-header__value {
    flex: 1;
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.87);
}

.date-picker-header__value:hover {
    color: rgb(var(--v-theme-accent));
}

.date-picker :deep(.v-date-picker-month__weekday) {
    font-size: 12px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.38);
}

.date-picker :deep(.v-date-picker-month__day) {
    width: 32px;
    height: 32px;
}

.date-picker :deep(.v-date-picker-month__day .v-btn) {
    width: 32px;
    height: 32px;
    font-size: 12px;
    border-radius: 50%;
}

.date-picker :deep(.v-date-picker-month__day--selected .v-btn) {
    color: #fff;
}
</style>
