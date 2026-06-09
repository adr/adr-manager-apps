<template>
    <v-card class="editor text-center mx-auto d-flex flex-column" height="100%">
        <v-toolbar density="compact" color="primary" theme="dark" class="flex-grow-0">
            <img src="../assets/logo.png" alt="ADR-Manager" height="80%" />
            <v-spacer></v-spacer>
            <ToolbarMenuMode v-if="showEditor" class="mx-0 px-0 pt-0 mt-0 flex-grow-0" />
            <v-spacer></v-spacer>
            <v-btn class="align-self-center" @click="logOut">Disconnect</v-btn>
        </v-toolbar>

        <v-card-text class="mx-0 my-0 px-0 py-0 flex-grow-1 position-relative">
            <div v-if="!showFileExplorer" class="d-flex align-center justify-center h-75 w-100">
                <DialogAddRepositories>
                    <template #activator="{ props }">
                        <v-btn
                            data-cy="addRepo"
                            size="x-large"
                            color="secondary"
                            class="align-center justify-center"
                            v-bind="props"
                        >
                            Add Repositories
                        </v-btn>
                    </template>
                </DialogAddRepositories>
            </div>
            <splitpanes v-else class="default-theme h-100 w-100">
                <pane :size="30" class="d-flex flex-column flex-grow-1 position-relative">
                    <FileExplorer @repo-name="updateBranches" @active-branch="setActiveBranch" />
                </pane>

                <pane v-if="showEditor">
                    <Editor class="h-100" />
                </pane>
            </splitpanes>
        </v-card-text>

        <v-sheet class="editor-statusbar d-flex align-center px-2 flex-grow-0">
            <span class="text-truncate">{{ "Current ADR: " + adrPath }}</span>
            <v-spacer></v-spacer>
            <span class="mr-1 flex-shrink-0">Current branch:</span>
            <select
                data-cy="branchSelect"
                @change="onSelectedBranch"
                v-model="selected"
                name="current-branch"
                id="current-branch"
                class="branch-select"
                @click="clickForBranches"
            >
                <option data-cy="branchSelectOption" v-for="(branchName, index) in branchesName" :key="index">
                    {{ branchName }}
                </option>
            </select>
        </v-sheet>
    </v-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { loadBranchesName, loadARepositoryContent } from "@/plugins/api";
import { store } from "@/plugins/store";
import { useAlert } from "@/composables/useAlert";

import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";

import DialogAddRepositories from "@/components/DialogAddRepositories.vue";
import ToolbarMenuMode from "@/components/ToolbarMenuMode.vue";
import FileExplorer from "@/components/FileExplorer.vue";
import Editor from "@/components/Editor.vue";

// Aliases so the existing kebab-case template tags keep working.
const splitpanes = Splitpanes;
const pane = Pane;

const props = defineProps<{ repoFullName?: string; branch?: string; adr?: string }>();

const router = useRouter();
const { confirm } = useAlert();

const selected = ref("");
const oldSelected = ref("");
const branchesName = ref<string[]>([]);
const currentRepo = ref("");
const boolClick = ref(false);

const showFileExplorer = computed(() => store.addedRepositories.length > 0);
const currentAdr = computed(() => store.currentlyEditedAdr);
const showEditor = computed(() => currentAdr.value !== undefined);

const adrPath = computed(() => {
    if (store.currentRepository && currentAdr.value && currentAdr.value.path !== undefined) {
        return store.currentRepository.fullName + "/" + currentAdr.value.path;
    }
    return "";
});

const routeDataFromStore = computed(() => ({
    repoFullName:
        store.currentRepository && typeof store.currentRepository.fullName === "string"
            ? store.currentRepository.fullName
            : undefined,
    branch:
        store.currentRepository && typeof store.currentRepository.activeBranch === "string"
            ? store.currentRepository.activeBranch
            : undefined,
    adrName:
        store.currentlyEditedAdr && typeof store.currentlyEditedAdr.path === "string"
            ? store.currentlyEditedAdr.path.split("/").pop()
            : undefined
}));

watch(routeDataFromStore, (newRouteData) => {
    branchesName.value = [];
    boolClick.value = true;
    if (newRouteData.branch) {
        branchesName.value.push(newRouteData.branch);
    }
    branchesName.value = branchesName.value.filter((elem, index, self) => index === self.indexOf(elem));
    selected.value = newRouteData.branch ?? "";
    oldSelected.value = newRouteData.branch ?? "";
    if (
        props.repoFullName !== newRouteData.repoFullName ||
        props.branch !== newRouteData.branch ||
        props.adr !== newRouteData.adrName
    ) {
        // Push to the named sub-route that actually declares these params (Router 4 discards
        // params that the target route's path doesn't define).
        const [organization, repo] = (newRouteData.repoFullName ?? "").split("/");
        if (organization && repo && newRouteData.branch && newRouteData.adrName) {
            void router.push({
                name: "EditorWithSpecifiedAdr",
                params: { organization, repo, branch: newRouteData.branch, adr: newRouteData.adrName }
            });
        } else if (organization && repo && newRouteData.branch) {
            void router.push({
                name: "EditorWithSpecifiedRepo",
                params: { organization, repo, branch: newRouteData.branch }
            });
        } else {
            void router.push({ name: "EditorUnspecified" });
        }
    }
});

watch(
    () => props.repoFullName,
    (newVal) => {
        if (newVal !== undefined && routeDataFromStore.value.repoFullName !== newVal) {
            store.openAdrBy(newVal, props.adr);
        }
    }
);

watch(
    () => props.branch,
    (newVal) => {
        if (
            newVal !== undefined &&
            routeDataFromStore.value.branch !== newVal &&
            (store.currentRepository?.branches.some((b) => b.name === newVal) ?? false)
        ) {
            store.setActiveBranch(newVal);
        }
    }
);

watch(
    () => props.adr,
    (newVal) => {
        if (routeDataFromStore.value.adrName !== newVal && props.repoFullName !== undefined) {
            store.openAdrBy(props.repoFullName, props.adr);
        }
    }
);

onMounted(() => {
    store.reload();
    store.openAdrBy(props.repoFullName ?? "", props.adr);
    void nextTick(() => {
        console.log("Route Data from Store", routeDataFromStore.value);
    });
});

function setActiveBranch(activeBranch: string): void {
    store.setActiveBranch(activeBranch);
    oldSelected.value = activeBranch;
    selected.value = activeBranch;
}

function onSelectedBranch(): void {
    if (selected.value != null) {
        confirm("Do you really want to change branch?")
            .then(() => {
                void loadARepositoryContent(currentRepo.value, selected.value).then((repoObject) => {
                    oldSelected.value = selected.value;
                    store.updateRepository(repoObject);
                });
            })
            .catch(() => {
                selected.value = oldSelected.value;
                store.setActiveBranch(oldSelected.value);
            });
    }
}

function loadBranchesNames(): void {
    const [owner, name] = currentRepo.value.split("/");
    void loadBranchesName(name ?? "", owner ?? "").then((branchesObjectList) => {
        if (!branchesObjectList) {
            return;
        }
        const names = branchesObjectList.map((branch) => branch.name);
        branchesName.value = names.filter((elem, index, self) => index === self.indexOf(elem));
    });
}

function updateBranches(repoName: string): void {
    boolClick.value = false;
    if (repoName === "") {
        branchesName.value = [];
    } else {
        currentRepo.value = repoName;
        loadBranchesNames();
    }
}

function clickForBranches(): void {
    if (currentRepo.value !== "") {
        if (branchesName.value.length === 1 && boolClick.value) {
            currentRepo.value = routeDataFromStore.value.repoFullName ?? "";
            loadBranchesNames();
        } else {
            console.log("Nothing to see here!");
        }
    } else if (routeDataFromStore.value.repoFullName != null) {
        currentRepo.value = routeDataFromStore.value.repoFullName;
        loadBranchesNames();
    }
}

function logOut(): void {
    console.log("Logging out!");
    localStorage.clear();
    store.setMode("basic");
    void router.push("/");
}
</script>

<style>
html {
    overflow: auto;
}
</style>

<style scoped>
/* Bottom status bar — matches the original light-grey v-system-bar. */
.editor-statusbar {
    min-height: 28px;
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.6);
    background-color: #e0e0e0;
}

.branch-select {
    width: 20%;
}
</style>
