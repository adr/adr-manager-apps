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

        <div v-if="countLoadingPromises > 0" class="status" role="status" aria-live="polite">
            <span class="mdi mdi-loading mdi-spin" aria-hidden="true"></span>
            {{ lastAction === "search" ? "Searching repositories…" : "Loading your repositories…" }}
        </div>

        <div v-else-if="errorMessage" data-cy="repoListError" class="error-block">
            <span class="mdi mdi-alert-circle" aria-hidden="true"></span>
            <span class="error-text">{{ errorMessage }}</span>
            <button type="button" data-cy="repoListRetry" class="btn btn-outline" @click="retry">
                <span class="mdi mdi-refresh" aria-hidden="true"></span>
                Retry
            </button>
        </div>

        <div
            v-if="unstagedRepositories.length === 0 && countLoadingPromises === 0 && !errorMessage"
            data-cy="noRepo"
            class="empty"
        >
            <span class="mdi mdi-source-repository" aria-hidden="true"></span>
            No repositories found
        </div>
        <ul v-if="unstagedRepositories.length > 0" class="repo-list">
            <li v-for="repo in unstagedRepositories" :key="repo.name" data-cy="listRepo" @click="stageRepository(repo)">
                <div class="repo-row">
                    <div class="repo-info">
                        <span class="repo-title">
                            {{ repo.name }}
                            <span class="repo-updated">updated on {{ repo.updated }}</span>
                        </span>
                        <span v-if="repo.description" class="repo-desc">{{ repo.description }}</span>
                    </div>
                    <span class="row-action mdi mdi-plus" aria-hidden="true"></span>
                </div>
            </li>
        </ul>

        <div v-if="showPagination" class="pagination" data-cy="pagination">
            <button
                type="button"
                data-cy="prevPage"
                class="btn btn-outline"
                :disabled="!hasPreviousPage || countLoadingPromises > 0"
                @click="goToPreviousPage"
            >
                <span class="mdi mdi-chevron-left" aria-hidden="true"></span>
                Back
            </button>
            <span class="page-indicator" data-cy="pageIndicator">
                Page {{ page }}<template v-if="totalPages"> of {{ totalPages }}</template>
            </span>
            <button
                type="button"
                data-cy="nextPage"
                class="btn btn-outline"
                :disabled="!hasNextPage || countLoadingPromises > 0"
                @click="goToNextPage"
            >
                Next
                <span class="mdi mdi-chevron-right" aria-hidden="true"></span>
            </button>
        </div>

        <div class="staged-head">
            <h3 class="staged-title">Repositories to be added</h3>
            <span v-if="repositoriesSelected.length > 0" class="staged-count">{{ repositoriesSelected.length }}</span>
        </div>
        <p v-if="repositoriesSelected.length === 0" class="staged-hint">Click a repository above to select it.</p>
        <ul v-else class="repo-list staged">
            <li v-for="repo in repositoriesSelected" :key="repo.name" @click="unstageRepository(repo)">
                <div class="repo-row">
                    <div class="repo-info">
                        <span class="repo-title">{{ repo.name }}</span>
                        <span v-if="repo.description" class="repo-desc">{{ repo.description }}</span>
                    </div>
                    <span class="row-action mdi mdi-close" aria-hidden="true"></span>
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
import { describeGitError, getActiveProvider, loadAllRepositoryContent } from "@/plugins/git";
import { store } from "@/plugins/store";
import { useToast } from "@/composables/useToast";
import { debounce } from "@/utils/debounce";
import type { RepoSummary } from "@/types/git";

interface StagedRepo {
    name: string;
    description: string | null;
    repoData: RepoSummary;
    updated: string;
}

const show = defineModel<boolean>({ default: false });

const { showErrorToast } = useToast();

const repositoriesSelected = ref<StagedRepo[]>([]);
const repositoriesCurrentPage = ref<RepoSummary[]>([]);
const showLoadingOverlay = ref(false);
const countLoadingPromises = ref(0);
const errorMessage = ref<string | null>(null);
const lastAction = ref<"list" | "search">("list");
const searchText = ref("");
const page = ref(1);
const totalPages = ref<number | undefined>(undefined);
const perPage = 20;

const hasPreviousPage = computed(() => page.value > 1);
const hasNextPage = computed(() =>
    totalPages.value !== undefined ? page.value < totalPages.value : repositoriesCurrentPage.value.length >= perPage
);
const showPagination = computed(() => lastAction.value === "list" && (hasPreviousPage.value || hasNextPage.value));

const unstagedRepositories = computed<StagedRepo[]>(() =>
    filterUnstagedRepositories(repositoriesCurrentPage.value)
        .map((repo) => ({
            name: repo.fullName,
            description: repo.description,
            repoData: repo,
            updated: new Date(repo.updatedAt).toDateString().substring(4, 15)
        }))
        .slice(0, perPage)
);

// Reload repositories when the dialog is (re)opened, in case something changed on GitHub.
watch(show, (open) => {
    if (open) {
        page.value = 1;
        loadRepositories();
    }
});

loadRepositories();

async function loadRepositories(): Promise<void> {
    lastAction.value = "list";
    errorMessage.value = null;
    countLoadingPromises.value++;
    try {
        const result = await getActiveProvider().listRepositories(page.value, perPage);
        repositoriesCurrentPage.value = result.repositories;
        totalPages.value = result.totalPages;
    } catch (error) {
        console.error(error);
        repositoriesCurrentPage.value = [];
        errorMessage.value = describeGitError(error);
    } finally {
        countLoadingPromises.value--;
    }
}

const searchRepositories = debounce(() => {
    if (searchText.value.trim() === "" || searchText.value.startsWith("https://")) {
        loadRepositories();
        return;
    }
    lastAction.value = "search";
    errorMessage.value = null;
    countLoadingPromises.value++;
    repositoriesCurrentPage.value = [];
    getActiveProvider()
        .searchRepositories(searchText.value, perPage)
        .then((results) => {
            repositoriesCurrentPage.value = results;
        })
        .catch((error: unknown) => {
            console.error(error);
            errorMessage.value = describeGitError(error);
        })
        .finally(() => countLoadingPromises.value--);
}, 500);

function retry(): void {
    if (lastAction.value === "search") {
        searchRepositories();
    } else {
        loadRepositories();
    }
}

function filterUnstagedRepositories(repoList: RepoSummary[]): RepoSummary[] {
    const addedNames = store.addedRepositories.map((repo) => repo.fullName);
    const stagedNames = repositoriesSelected.value.map((repo) => repo.name);
    return repoList.filter((repo) => !addedNames.includes(repo.fullName) && !stagedNames.includes(repo.fullName));
}

function goToNextPage(): void {
    if (hasNextPage.value) {
        page.value++;
        loadRepositories();
    }
}

function goToPreviousPage(): void {
    if (hasPreviousPage.value) {
        page.value--;
        loadRepositories();
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
    addRepositories();
}

async function addRepositories(): Promise<void> {
    showLoadingOverlay.value = true;
    try {
        const results = await loadAllRepositoryContent(
            repositoriesSelected.value.map((repo) => ({
                fullName: repo.repoData.fullName,
                branch: repo.repoData.defaultBranch
            }))
        );
        store.addRepositories(results.map((result) => result.repository));
        const failedFiles = results.flatMap((result) => result.failedFiles);
        if (failedFiles.length > 0) {
            showErrorToast(summarizeFailedFiles(failedFiles));
        }
        repositoriesSelected.value = [];
        searchText.value = "";
    } catch (error) {
        // The selection is kept on purpose: reopening the dialog allows a retry.
        const repoNames = repositoriesSelected.value.map((repo) => repo.name).join(", ");
        showErrorToast(`Couldn't load ${repoNames}: ${describeGitError(error)}`);
        console.error(error);
    } finally {
        showLoadingOverlay.value = false;
    }
}

function summarizeFailedFiles(failedFiles: string[]): string {
    const shown = failedFiles.slice(0, 3).map((path) => path.split("/").pop() ?? path);
    const more = failedFiles.length > shown.length ? ` and ${failedFiles.length - shown.length} more` : "";
    return `Couldn't read ${failedFiles.length} ADR file(s), shown empty for now: ${shown.join(", ")}${more}`;
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

.status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--adr-ink-2);
    font-size: 13px;
    padding: 4px 0 8px;
}

.error-block {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--adr-ink);
    font-size: 13px;
    padding: 8px 10px;
    margin-bottom: 8px;
    border: 1px solid var(--adr-error);
    border-radius: 6px;
}

.error-block > .mdi-alert-circle {
    color: var(--adr-error);
    font-size: 18px;
    flex: 0 0 auto;
}

.error-block .error-text {
    flex: 1 1 auto;
}

.pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
}

.pagination .btn {
    height: 32px;
    padding: 0 12px;
}

.page-indicator {
    font-size: var(--adr-text-sm);
    color: var(--adr-ink-2);
    font-variant-numeric: tabular-nums;
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: var(--adr-ink-2);
    padding: 28px 0;
}

.empty .mdi {
    font-size: 28px;
    color: var(--adr-ink-3);
}

.repo-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 320px;
    overflow-y: auto;
    border: 1px solid var(--adr-line);
    border-radius: var(--adr-radius-md);
}

.repo-list.staged {
    max-height: 140px;
}

.repo-list li {
    cursor: pointer;
    padding: 10px 12px;
}

.repo-list li + li {
    border-top: 1px solid var(--adr-line);
}

.repo-list li:hover {
    background: var(--adr-surface-2);
}

.repo-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.row-action {
    color: var(--adr-ink-3);
    font-size: 18px;
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.repo-list li:hover .row-action {
    background: var(--accent-050);
    color: var(--accent);
}

.repo-list.staged li:hover .row-action {
    background: var(--adr-surface);
    color: var(--adr-error);
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

.staged-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 16px 0 8px;
    padding-top: 14px;
    border-top: 1px solid var(--adr-line);
}

.staged-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--adr-ink-2);
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.staged-count {
    background: var(--accent-050);
    color: var(--accent-600);
    font-size: var(--adr-text-xs);
    font-weight: 700;
    border-radius: 999px;
    padding: 1px 8px;
}

.staged-hint {
    margin: 0;
    color: var(--adr-ink-3);
    font-size: var(--adr-text-sm);
}
</style>
