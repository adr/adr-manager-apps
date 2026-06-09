<template>
    <div data-cy="considerOptTextAdr">
        <v-row class="mx-0 my-1">
            <h3 class="d-inline-flex">
                Considered Options
                <HelpIcon v-if="mode === 'basic'">
                    List all considered options. <br />
                    Only write a concise description. You can add a more detailed description in Professional mode.
                </HelpIcon>
                <HelpIcon v-else>
                    List all considered options. <br />
                    Expand options by clicking on them.
                </HelpIcon>
            </h3>
        </v-row>
        <v-alert v-if="isModeTooLow" border="start" type="warning" elevation="2" class="my-4 py-2">
            <div class="d-flex my-0 py-0">
                <span class="flex-grow-1 align-self-center my-0 py-0">
                    Some options have a more detailed description that is not displayed in Basic Mode.
                </span>
                <v-btn
                    color="white"
                    class="justify-self-end align-self-end my-0 py-0"
                    @click="switchToProfessionalMode()"
                >
                    Switch to Professional Mode
                </v-btn>
            </div>
        </v-alert>

        <v-list v-if="mode === 'basic'" class="my-0 py-0">
            <v-list-item
                class="align-self-center mx-0 px-0 d-flex"
                v-for="(item, idx) in adr.consideredOptions"
                :key="item.id"
            >
                <drop @dragenter="(event: DnDEvent) => moveOption(event.data, idx)" class="my-0 py-0 flex-grow-1">
                    <v-card
                        flat
                        class="d-flex"
                        :class="{ 'drag-active': draggedOption === item, 'chosen-option': isChosenOption(item) }"
                        @mouseenter="hoveredOption = item"
                        @mouseleave="hoveredOption = null"
                    >
                        <div
                            data-cy="checkConsOptAdr"
                            class="align-center flex-shrink-0 flex-grow-0 my-0 py-0 mx-0 d-flex cm-gutter"
                        >
                            <drag
                                v-show="hoveredOption === item || draggedOption === item"
                                :data="item"
                                @dragstart="draggedOption = item"
                                @dragend="draggedOption = null"
                                class="flex-grow-1"
                            >
                                <template #drag-image>{{ item.title }}</template>
                                <v-icon> mdi-drag-vertical </v-icon>
                            </drag>
                            <v-icon
                                v-show="hoveredOption !== item && draggedOption !== item && isChosenOption(item)"
                                color="success"
                                class="pl-1"
                            >
                                mdi-check-decagram
                            </v-icon>
                            <v-icon
                                v-show="hoveredOption !== item && draggedOption !== item && !isChosenOption(item)"
                            ></v-icon>
                        </div>

                        <v-card flat class="flex-grow-1">
                            <EditorMadrCodemirror :ref="(el: CmRefEl) => setCmRef(item.id, el)" v-model="item.title" />
                        </v-card>

                        <div v-show="hoveredOption === item" class="align-center flex-shrink-0">
                            <v-btn icon variant="text" density="comfortable" @click="removeOption(item)">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </div>
                    </v-card>
                </drop>
            </v-list-item>

            <v-list-item class="align-self-center mx-0 px-0 d-flex" :key="adr.highestOptionId">
                <div class="align-center flex-shrink-0 flex-grow-0 my-0 py-0 cm-gutter"></div>
                <EditorMadrCodemirror :model-value="lastItem" @update:model-value="onLastInput" />
            </v-list-item>
        </v-list>

        <v-card data-cy="consOptPro" v-else flat>
            <div v-for="(item, i) in adr.consideredOptions" :key="item.id">
                <drop @dragenter="(event: DnDEvent) => moveOption(event.data, i)" class="my-0 py-0">
                    <v-card
                        flat
                        :class="[
                            'my-1',
                            expandedOptions.includes(item) ? 'mb-8' : '',
                            { 'drag-active': draggedOption === item }
                        ]"
                        @mouseenter="hoveredOption = item"
                        @mouseleave="hoveredOption = null"
                    >
                        <v-card
                            flat
                            class="d-flex"
                            :class="{ 'chosen-option': isChosenOption(item) }"
                            min-height="36px"
                        >
                            <div class="align-center flex-shrink-0 flex-grow-0 my-0 py-0 d-flex cm-gutter">
                                <div class="mx-0 px-0 flex-grow-1 flex-shrink-1 option-drag-col">
                                    <drag
                                        v-show="hoveredOption === item || draggedOption === item"
                                        :key="item.id"
                                        :data="item"
                                        @dragstart="draggedOption = item"
                                        @dragend="draggedOption = null"
                                    >
                                        <template #drag-image>{{ item.title }}</template>
                                        <v-icon> mdi-drag-vertical </v-icon>
                                    </drag>
                                    <v-icon
                                        data-cy="checkConsOptAdr"
                                        v-show="
                                            hoveredOption !== item && draggedOption !== item && isChosenOption(item)
                                        "
                                        color="success"
                                        class="pl-1"
                                    >
                                        mdi-check-decagram
                                    </v-icon>
                                    <v-icon
                                        v-show="
                                            hoveredOption !== item && draggedOption !== item && !isChosenOption(item)
                                        "
                                    ></v-icon>
                                </div>
                            </div>

                            <div class="flex-grow-1 d-flex">
                                <EditorMadrCodemirror
                                    v-if="editedOptions.includes(item)"
                                    :ref="(el: CmRefEl) => setCmRef(item.id, el)"
                                    :class="['my-0', 'py-0', 'mr-4']"
                                    v-model="item.title"
                                />
                                <button v-else class="flex-grow-1 text-left" @click="toggleExpansionOfOption(item)">
                                    <div v-if="!expandedOptions.includes(item)">
                                        <span v-text="item.title"></span>
                                    </div>
                                    <div v-else>
                                        <h6 class="mb-0" v-text="item.title"></h6>
                                    </div>
                                </button>
                            </div>

                            <div
                                v-show="hoveredOption === item || editedOptions.includes(item)"
                                class="align-center flex-shrink-0 flex-grow-0 my-0 py-0 position-absolute"
                            >
                                <v-btn
                                    icon
                                    variant="text"
                                    class="mx-0 px-0 flex-grow-0 flex-shrink-0"
                                    @click="toggleEditingOfOption(item)"
                                >
                                    <v-icon v-if="editedOptions.includes(item)">mdi-check</v-icon>
                                    <v-icon v-else>mdi-pencil</v-icon>
                                </v-btn>
                                <v-btn icon variant="text" class="mx-1" @click="removeOption(item)">
                                    <v-icon>mdi-delete</v-icon>
                                </v-btn>
                            </div>

                            <div class="align-center flex-shrink-0 flex-grow-0 my-0 py-0 d-flex cm-gutter">
                                <v-btn
                                    v-show="!expandedOptions.includes(item)"
                                    variant="text"
                                    class="mx-0 px-0 flex-grow-1 flex-shrink-1 btn-tight"
                                    @click="expandedOptions.push(item)"
                                >
                                    <v-icon>mdi-chevron-down</v-icon>
                                </v-btn>
                                <v-btn
                                    v-show="expandedOptions.includes(item)"
                                    variant="text"
                                    class="mx-0 px-0 flex-grow-1 flex-shrink-1 btn-tight"
                                    @click="expandedOptions = expandedOptions.filter((val) => val !== item)"
                                >
                                    <v-icon>mdi-chevron-up</v-icon>
                                </v-btn>
                            </div>
                        </v-card>

                        <v-expand-transition>
                            <div v-show="expandedOptions.includes(item)" class="pl-12">
                                <h6 class="py-4 pl-4">
                                    <v-row class="mx-0">
                                        Description
                                        <HelpIcon>
                                            Describe the option in free form, e.g., by giving examples or a pointer to
                                            more information.
                                        </HelpIcon>
                                    </v-row>
                                </h6>
                                <div class="pb-2 ml-4">
                                    <EditorMadrCodemirror data-cy="descriptionConsOpt" v-model="item.description" />
                                </div>

                                <div class="d-flex flex-wrap mx-0 px-0 pb-4 py-0 my-0">
                                    <div class="flex-grow-1 mx-0 px-0 py-0 my-0 option-col">
                                        <h6 class="py-4 pl-4">
                                            <v-row class="mx-0">
                                                Good, because ...
                                                <HelpIcon> Give arguments supporting this option. </HelpIcon>
                                            </v-row>
                                        </h6>
                                        <EditorMadrList
                                            data-cy="goodConsOpt"
                                            :list="item.pros"
                                            class="ml-4 mr-0 px-0"
                                        />
                                    </div>
                                    <div class="flex-grow-1 mx-0 px-0 py-0 my-0 option-col">
                                        <h6 class="py-4 pl-4">
                                            <v-row class="mx-0">
                                                Bad, because ...
                                                <HelpIcon> Give arguments against using this option. </HelpIcon>
                                            </v-row>
                                        </h6>
                                        <EditorMadrList data-cy="badConsOpt" :list="item.cons" class="ml-4 mr-0 px-0" />
                                    </div>
                                </div>
                                <v-divider />
                            </div>
                        </v-expand-transition>
                    </v-card>
                </drop>
            </div>

            <v-card class="my-1 mx-0" flat :key="adr.highestOptionId">
                <v-card flat class="d-flex">
                    <div class="cm-gutter"></div>
                    <EditorMadrCodemirror
                        data-cy="considerOptTextAdr"
                        :class="['my-0', 'py-0', 'mr-0']"
                        :model-value="lastItem"
                        @update:model-value="onLastInput"
                    />
                </v-card>
            </v-card>
        </v-card>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import type { ComponentPublicInstance } from "vue";
import { store } from "@/plugins/store";
import EditorMadrCodemirror from "./EditorMadrCodemirror.vue";
import EditorMadrList from "./EditorMadrList.vue";
import HelpIcon from "./HelpIcon.vue";
import { Drag, Drop, type DnDEvent } from "vue-easy-dnd";
import { matchOptionTitleMoreRelaxed } from "@/plugins/parser";
import type { ArchitecturalDecisionRecord } from "@/plugins/classes";
import type { Option } from "@/types/adr";
import type { Mode } from "@/types/store";

type CmInstance = InstanceType<typeof EditorMadrCodemirror>;
type CmRefEl = Element | ComponentPublicInstance | null;

const props = defineProps<{ adr: ArchitecturalDecisionRecord; mode: Mode }>();

const lastItem = ref("");
const editedOptions = ref<Option[]>([]);
const expandedOptions = ref<Option[]>([]);
const hoveredOption = ref<Option | null>(null);
const draggedOption = ref<Option | null>(null);
const cmRefs = new Map<number, CmInstance>();

function setCmRef(id: number, el: CmRefEl): void {
    if (el) {
        cmRefs.set(id, el as CmInstance);
    } else {
        cmRefs.delete(id);
    }
}

const isModeTooLow = computed<boolean>(
    () =>
        props.mode === "basic" &&
        props.adr.consideredOptions.some(
            (opt) => opt.description.length > 0 || opt.pros.length > 0 || opt.cons.length > 0
        )
);

function moveOption(option: Option, newIndex: number): void {
    if (props.adr.consideredOptions.includes(option)) {
        props.adr.consideredOptions.splice(props.adr.consideredOptions.indexOf(option), 1);
        props.adr.consideredOptions.splice(newIndex, 0, option);
    }
}

function onLastInput(val: string): void {
    lastItem.value = val;
    addLastItemIfNotEmpty();
}

function addLastItemIfNotEmpty(): void {
    if (lastItem.value.trim() !== "") {
        const newOption = addLastItemToOptions();
        if (newOption) {
            if (props.mode !== "basic") {
                editedOptions.value.push(newOption);
                expandedOptions.value.push(newOption);
            }
            void nextTick(() => cmRefs.get(newOption.id)?.focus());
        }
    }
}

function addLastItemToOptions(): Option | undefined {
    if (lastItem.value.trim() !== "") {
        const option = props.adr.addOption({ title: lastItem.value });
        lastItem.value = "";
        return option;
    }
    return undefined;
}

function removeOption(option: Option): void {
    const idx = props.adr.consideredOptions.indexOf(option);
    if (idx >= 0) {
        props.adr.consideredOptions.splice(idx, 1);
    }
}

function toggleExpansionOfOption(option: Option): void {
    if (expandedOptions.value.includes(option)) {
        expandedOptions.value = expandedOptions.value.filter((val) => val !== option);
    } else {
        expandedOptions.value.push(option);
    }
}

function toggleEditingOfOption(option: Option): void {
    if (editedOptions.value.includes(option)) {
        editedOptions.value = editedOptions.value.filter((val) => val !== option);
    } else {
        editedOptions.value.push(option);
        void nextTick(() => cmRefs.get(option.id)?.focus());
    }
}

function isChosenOption(option: Option): boolean {
    return matchOptionTitleMoreRelaxed(option.title, props.adr.decisionOutcome.chosenOption);
}

function switchToProfessionalMode(): void {
    store.setMode("professional");
}
</script>

<style scoped>
/* Chosen-option highlight (replaces the old dynamic Vuetify `:color` of grey/light-green). */
.chosen-option {
    background-color: #f1f8e9;
}

/* Inner drag-handle column inside the option gutter. */
.option-drag-col {
    width: 18px;
    min-width: 18px;
}

/* Let the chevron expand/collapse buttons shrink below Vuetify's default min width. */
.btn-tight {
    min-width: 0;
}

/* Pros/Cons columns sit side-by-side and wrap once they no longer fit. */
.option-col {
    width: 50%;
    min-width: 600px;
}
</style>
