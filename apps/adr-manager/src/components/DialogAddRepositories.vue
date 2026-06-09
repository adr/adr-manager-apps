<template>
    <v-dialog v-model="show" width="700" :fullscreen="mobile" scrollable>
        <template #activator="{ props }">
            <slot name="activator" :props="props" />
        </template>
        <v-card class="d-flex flex-column">
            <v-card-title>
                <v-row class="my-1">
                    <div>
                        <v-avatar color="primary" size="35" class="mx-1">
                            <v-icon color="white">mdi-folder-plus</v-icon>
                        </v-avatar>
                        <span class="dialogTitle"> Add Repositories </span>
                    </div>
                    <v-text-field
                        data-cy="search-field-for-adding-repository"
                        v-model="searchText"
                        class="pl-8 pr-4 pt-0 mt-0"
                        variant="underlined"
                        hide-details
                        clearable
                        append-inner-icon="mdi-magnify"
                        placeholder="Search..."
                        @update:model-value="searchRepositories"
                        @click:clear="onClearSearch"
                    />
                    <v-progress-linear
                        :active="countLoadingPromises > 0"
                        :indeterminate="countLoadingPromises > 0"
                        absolute
                        location="top"
                    />
                </v-row>
            </v-card-title>

            <v-divider class="mb-0"></v-divider>

            <div v-if="showPagination" class="text-center">
                <v-btn :disabled="!hasPreviousPage" @click="goToPreviousPage">
                    <v-icon>mdi-chevron-left</v-icon> Back
                </v-btn>
                <v-btn :disabled="!hasNextPage" @click="goToNextPage"> Next <v-icon>mdi-chevron-right</v-icon> </v-btn>
            </div>

            <v-card-text class="my-0">
                <div
                    data-cy="noRepo"
                    v-if="unstagedRepositories.length === 0 && countLoadingPromises === 0"
                    class="text-center"
                >
                    Sorry, no repositories were found!
                </div>
                <v-list>
                    <v-list-item
                        data-cy="listRepo"
                        v-for="(item, index) in unstagedRepositories"
                        class="my-0 py-0"
                        :key="`item-${index}`"
                        :value="item"
                        @click="stageRepostiory(item)"
                    >
                        <v-list-item-title class="d-flex">
                            {{ item.name }}
                            <span class="repo-updated"> updated on {{ item.updated }} </span>
                        </v-list-item-title>
                        <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                        <template #append>
                            <v-icon>mdi-plus</v-icon>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>

            <v-divider class="my-0"></v-divider>
            <v-card-title>Repositories to be added</v-card-title>
            <v-card-text class="my-0 flex-grow-0 flex-shrink-0 staged-repos">
                <v-list>
                    <v-list-item
                        v-for="(item, index) in repositoriesSelected"
                        class="my-0 py-0"
                        :key="`staged-${index}`"
                        :value="item"
                        @click="unstageRepostiory(item)"
                    >
                        <v-list-item-title>{{ item.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ item.description }}</v-list-item-subtitle>
                        <template #append>
                            <v-icon>mdi-close</v-icon>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions class="buttonPadding">
                <v-spacer></v-spacer>
                <v-btn
                    data-cy="addRepoDialog"
                    variant="text"
                    color="success"
                    :disabled="repositoriesSelected.length === 0"
                    @click="onAddRepositories"
                >
                    Add Repositories
                </v-btn>
                <v-btn variant="text" color="error" @click="show = false"> Cancel </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-overlay v-model="showLoadingOverlay" data-cy="loadReposBool" class="align-center justify-center" persistent>
        <v-progress-circular indeterminate size="64"></v-progress-circular>
    </v-overlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import { loadRepositoryList, searchRepositoryList, loadAllRepositoryContent } from "@/plugins/api";
import { store } from "@/plugins/store";
import { useAlert } from "@/composables/useAlert";
import { debounce } from "@/utils/debounce";
import type { GitHubRepoSummary } from "@/types/github";
import type { Repository } from "@/plugins/classes";

interface StagedRepo {
    name: string;
    description: string | null;
    repoData: GitHubRepoSummary;
    updated: string;
}

const show = defineModel<boolean>({ default: false });
const emit = defineEmits<{ "repo-added-name": [Repository[]] }>();

const { mobile } = useDisplay();
const { alert } = useAlert();

const repositoriesSelected = ref<StagedRepo[]>([]);
const repositoriesCurrentPage = ref<GitHubRepoSummary[]>([]);
const showLoadingOverlay = ref(false);
const countLoadingPromises = ref(0);
const searchText = ref("");
const page = ref(1);
const perPage = 40;

const hasPreviousPage = computed(() => page.value > 1);
const hasNextPage = computed(() => repositoriesCurrentPage.value.length >= perPage);
const showPagination = computed(() => hasNextPage.value || hasPreviousPage.value);

const unstagedRepositories = computed<StagedRepo[]>(() =>
    filterUnstagedRepositories(repositoriesCurrentPage.value)
        .map((repo) => {
            const date = new Date(repo.updated_at);
            return {
                name: repo.full_name,
                description: repo.description,
                repoData: repo,
                updated: date.toDateString().substr(4, 11)
            };
        })
        .slice(0, perPage)
);

// Reload repositories when the dialog is (re)opened, in case something changed on GitHub.
watch(show, (open) => {
    if (open) {
        page.value = 1;
        void loadRepositories();
    }
});

void loadRepositories();

async function loadRepositories(): Promise<void> {
    countLoadingPromises.value++;
    try {
        const res = await loadRepositoryList();
        if (!Array.isArray(res)) {
            throw new Error("Could not load repository list.");
        }
        repositoriesCurrentPage.value = res;
        countLoadingPromises.value--;
    } catch (error) {
        console.error(error);
    }
}

function onClearSearch(): void {
    searchText.value = "";
    void loadRepositories();
}

const searchRepositories = debounce(() => {
    if (searchText.value.startsWith("https://")) {
        void loadRepositories();
    }
    if (searchText.value.trim() === "") {
        void loadRepositories();
    } else {
        countLoadingPromises.value++;
        repositoriesCurrentPage.value = [];
        searchRepositoryList(searchText.value, perPage, repositoriesCurrentPage.value)
            .then((repos) => {
                if (!Array.isArray(repos)) {
                    throw new Error("Could not search repository list.");
                }
                countLoadingPromises.value--;
            })
            .catch((error: unknown) => console.error(error));
    }
}, 500);

function filterUnaddedRepositories(repoList: GitHubRepoSummary[]): GitHubRepoSummary[] {
    return repoList.filter((repo) => !store.addedRepositories.map((r) => r.fullName).includes(repo.full_name));
}

function filterUnstagedRepositories(repoList: GitHubRepoSummary[]): GitHubRepoSummary[] {
    return filterUnaddedRepositories(repoList).filter(
        (repo) => !repositoriesSelected.value.map((r) => r.name).includes(repo.full_name)
    );
}

function goToNextPage(): void {
    if (hasNextPage.value) {
        page.value++;
        void loadRepositories();
    }
}

function goToPreviousPage(): void {
    if (hasPreviousPage.value) {
        page.value--;
        void loadRepositories();
    }
}

function stageRepostiory(repo: StagedRepo): void {
    repositoriesSelected.value.push(repo);
}

function unstageRepostiory(repo: StagedRepo): void {
    repositoriesSelected.value = repositoriesSelected.value.filter((item) => item !== repo);
}

function onAddRepositories(): void {
    show.value = false;
    void addRepositories();
}

async function addRepositories(): Promise<void> {
    showLoadingOverlay.value = true;
    try {
        const repoObjectList = await loadAllRepositoryContent(
            repositoriesSelected.value.map((repo) => ({
                fullName: repo.repoData.full_name,
                branch: repo.repoData.default_branch
            }))
        );
        showLoadingOverlay.value = false;
        emit("repo-added-name", repoObjectList);
        store.addRepositories(repoObjectList);
        repositoriesSelected.value = [];
        searchText.value = "";
    } catch (e) {
        errorDialog();
        console.log(e);
        showLoadingOverlay.value = false;
    }
}

function errorDialog(): void {
    void alert("Sorry, we couldn't load the repositories you requested!", "Error", "error");
}
</script>

<style scoped>
/* The "Repositories to be added" list stays compact so the search list keeps most of the dialog. */
.staged-repos {
    max-height: 25%;
}

/* Styled like the Vuetify 2 v-card-subtitle that sat inline after the repo name. */
.repo-updated {
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.6);
    padding: 0 16px;
}
</style>
