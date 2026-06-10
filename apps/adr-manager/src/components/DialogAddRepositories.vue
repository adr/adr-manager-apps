<template>
    <BaseDialog v-model="show" title="Add Repositories" icon="folder-plus" :width="700">
        <template #header-extra>
            <div class="search-wrap">
                <input
                    v-model="searchText"
                    data-cy="search-field-for-adding-repository"
                    class="field"
                    placeholder="Search…"
                    @input="searchRepositories"
                />
                <span class="mdi mdi-magnify search-icon" aria-hidden="true"></span>
            </div>
        </template>

        <div class="progress" :class="{ active: countLoadingPromises > 0 }"></div>

        <div v-if="showPagination" class="pagination">
            <button type="button" class="btn btn-outline" :disabled="!hasPreviousPage" @click="goToPreviousPage">
                <span class="mdi mdi-chevron-left" aria-hidden="true"></span>
                Back
            </button>
            <button type="button" class="btn btn-outline" :disabled="!hasNextPage" @click="goToNextPage">
                Next
                <span class="mdi mdi-chevron-right" aria-hidden="true"></span>
            </button>
        </div>

        <div v-if="unstagedRepositories.length === 0 && countLoadingPromises === 0" data-cy="noRepo" class="empty">
            Sorry, no repositories were found!
        </div>
        <ul class="repo-list">
            <li v-for="repo in unstagedRepositories" :key="repo.name" data-cy="listRepo" @click="stageRepository(repo)">
                <div class="repo-row">
                    <div class="repo-info">
                        <span class="repo-title">
                            {{ repo.name }}
                            <span class="repo-updated">updated on {{ repo.updated }}</span>
                        </span>
                        <span class="repo-desc">{{ repo.description }}</span>
                    </div>
                    <span class="mdi mdi-plus" aria-hidden="true"></span>
                </div>
            </li>
        </ul>

        <h3 class="staged-title">Repositories to be added</h3>
        <ul class="repo-list staged">
            <li v-for="repo in repositoriesSelected" :key="repo.name" @click="unstageRepository(repo)">
                <div class="repo-row">
                    <div class="repo-info">
                        <span class="repo-title">{{ repo.name }}</span>
                        <span class="repo-desc">{{ repo.description }}</span>
                    </div>
                    <span class="mdi mdi-close" aria-hidden="true"></span>
                </div>
            </li>
        </ul>

        <template #actions>
            <button
                type="button"
                data-cy="addRepoDialog"
                class="btn btn-text-success"
                :disabled="repositoriesSelected.length === 0"
                @click="onAddRepositories"
            >
                Add Repositories
            </button>
            <button type="button" class="btn btn-text-error" @click="show = false">Cancel</button>
        </template>
    </BaseDialog>

    <LoadingOverlay data-cy="loadReposBool" :show="showLoadingOverlay" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseDialog from "./BaseDialog.vue";
import LoadingOverlay from "./LoadingOverlay.vue";
import { loadRepositoryList, searchRepositoryList, loadAllRepositoryContent } from "@/plugins/api";
import { store } from "@/plugins/store";
import { useAlert } from "@/composables/useAlert";
import { debounce } from "@/utils/debounce";
import type { GitHubRepoSummary } from "@/types/github";

interface StagedRepo {
    name: string;
    description: string | null;
    repoData: GitHubRepoSummary;
    updated: string;
}

const show = defineModel<boolean>({ default: false });

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
        .map((repo) => ({
            name: repo.full_name,
            description: repo.description,
            repoData: repo,
            updated: new Date(repo.updated_at).toDateString().substring(4, 15)
        }))
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
        const res = await loadRepositoryList("", page.value, perPage);
        if (!Array.isArray(res)) {
            throw new Error("Could not load repository list.");
        }
        repositoriesCurrentPage.value = res;
    } catch (error) {
        console.error(error);
    } finally {
        countLoadingPromises.value--;
    }
}

const searchRepositories = debounce(() => {
    if (searchText.value.trim() === "" || searchText.value.startsWith("https://")) {
        void loadRepositories();
        return;
    }
    countLoadingPromises.value++;
    repositoriesCurrentPage.value = [];
    searchRepositoryList(searchText.value, perPage, repositoriesCurrentPage.value)
        .then(() => countLoadingPromises.value--)
        .catch((error: unknown) => console.error(error));
}, 500);

function filterUnstagedRepositories(repoList: GitHubRepoSummary[]): GitHubRepoSummary[] {
    const addedNames = store.addedRepositories.map((repo) => repo.fullName);
    const stagedNames = repositoriesSelected.value.map((repo) => repo.name);
    return repoList.filter((repo) => !addedNames.includes(repo.full_name) && !stagedNames.includes(repo.full_name));
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

function stageRepository(repo: StagedRepo): void {
    repositoriesSelected.value.push(repo);
}

function unstageRepository(repo: StagedRepo): void {
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
        store.addRepositories(repoObjectList);
        repositoriesSelected.value = [];
        searchText.value = "";
    } catch (error) {
        void alert("Sorry, we couldn't load the repositories you requested!", "Error", "error");
        console.error(error);
    } finally {
        showLoadingOverlay.value = false;
    }
}
</script>

<style scoped>
.search-wrap {
    position: relative;
    flex: 1 1 auto;
    margin-left: 12px;
}

.search-wrap .field {
    padding-right: 38px;
}

.search-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--adr-ink-3);
    font-size: 19px;
    pointer-events: none;
}

.progress {
    height: 3px;
    border-radius: 3px;
    overflow: hidden;
    position: relative;
    margin-bottom: 8px;
}

.progress.active::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--accent);
    animation: progress-slide 1.2s ease-in-out infinite;
}

@keyframes progress-slide {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
}

.empty {
    text-align: center;
    color: var(--adr-ink-2);
    padding: 16px 0;
}

.repo-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 320px;
    overflow-y: auto;
}

.repo-list.staged {
    max-height: 140px;
}

.repo-list li {
    border-radius: 6px;
    cursor: pointer;
    padding: 8px 10px;
}

.repo-list li:hover {
    background: var(--adr-surface-2);
}

.repo-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.repo-row > .mdi {
    color: var(--adr-ink-2);
    font-size: 18px;
    flex: 0 0 auto;
}

.repo-info {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.repo-title {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--adr-ink);
}

.repo-updated {
    font-size: 12px;
    font-weight: 400;
    color: var(--adr-ink-2);
    padding-left: 10px;
}

.repo-desc {
    font-size: 12px;
    color: var(--adr-ink-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.staged-title {
    margin: 14px 0 6px;
    font-size: 13px;
    font-weight: 700;
    color: var(--adr-ink-2);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    border-top: 1px solid var(--adr-line);
    padding-top: 12px;
}
</style>
