<template>
    <aside v-if="rail && !forceExpanded" class="explorer rail">
        <div class="rail-head">
            <button type="button" class="icon-btn" title="Expand panel" @click="expand">
                <span class="mdi mdi-chevron-double-right" aria-hidden="true"></span>
            </button>
        </div>
        <div class="rail-list">
            <template v-for="repo in repositories" :key="repo.fullName">
                <button
                    type="button"
                    class="rail-repo"
                    :class="{ active: repo.fullName === currentRepoFullName }"
                    :title="repo.fullName"
                    @click="toggleRepo(repo)"
                >
                    <span class="mdi mdi-source-repository" aria-hidden="true"></span>
                </button>
                <template v-if="isOpen(repo)">
                    <button
                        v-for="file in sortedAdrs(repo)"
                        :key="file.path"
                        type="button"
                        class="rail-file"
                        :class="{ active: file === activeAdrIn(repo) }"
                        :title="fileLabel(file)"
                        @click="openFile(repo, file)"
                    >
                        <span class="mdi mdi-file-document-outline" aria-hidden="true"></span>
                    </button>
                </template>
            </template>
        </div>
        <div class="rail-foot">
            <button type="button" class="icon-btn" title="Add repository" @click="addRepositoriesOpen = true">
                <span class="mdi mdi-plus-box-outline" aria-hidden="true"></span>
            </button>
        </div>
        <div class="exp-resize" title="Drag to resize" @mousedown="startResize">
            <span class="grip"></span>
        </div>

        <DialogAddRepositories v-model="addRepositoriesOpen" />
    </aside>

    <aside
        v-else
        class="explorer"
        data-tour="explorer"
        :style="{ flexBasis: `${expandedWidth}px`, width: `${expandedWidth}px` }"
    >
        <div class="exp-head">
            <span class="etitle">Repositories</span>
            <span class="spacer"></span>
        </div>

        <div v-if="refreshing" class="exp-refresh" role="status" aria-live="polite" data-cy="refreshStatus">
            <span class="mdi mdi-loading mdi-spin" aria-hidden="true"></span>
            Refreshing repositories… ({{ done }}/{{ total }})
        </div>

        <AdrSearchBar :statuses="allStatuses" :tags="allTags" />

        <div class="exp-list" data-cy="repoNameList">
            <template v-for="repo in repositories" :key="repo.fullName">
                <RepositoryTreeItem
                    v-if="!searchActive || filteredAdrs(repo).length > 0"
                    :repo="repo"
                    :open="isOpen(repo)"
                    :active-adr="activeAdrIn(repo)"
                    v-bind="searchActive ? { filteredAdrs: filteredAdrs(repo) } : {}"
                    @select="selectRepo(repo)"
                    @open-file="openFile(repo, $event)"
                    @commit="emit('commit', repo.fullName)"
                    @remove="repositoryToRemove = repo"
                    @delete-adr="adrToDelete = { adr: $event, repository: repo }"
                    @new-adr="createNewAdr(repo)"
                />
            </template>
        </div>

        <div class="exp-foot">
            <button type="button" data-cy="addRepo" class="btn-addrepo" @click="addRepositoriesOpen = true">
                <span class="mdi mdi-plus-box-outline" aria-hidden="true"></span>
                Add repository
            </button>
        </div>

        <div class="exp-resize" title="Drag to resize" @mousedown="startResize">
            <span class="grip"></span>
        </div>

        <DialogAddRepositories v-model="addRepositoriesOpen" />
        <DialogRemoveRepository
            :show="repositoryToRemove !== null"
            :repo-name="repositoryToRemove?.fullName ?? ''"
            @close="repositoryToRemove = null"
            @confirm="removeRepository"
        />
        <DialogDeleteAdr
            :show="adrToDelete !== null"
            :adr-path="adrToDelete?.adr.path ?? ''"
            @close="adrToDelete = null"
            @confirm="deleteAdr"
        />
    </aside>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DialogAddRepositories from "./DialogAddRepositories.vue";
import DialogDeleteAdr from "./DialogDeleteAdr.vue";
import DialogRemoveRepository from "./DialogRemoveRepository.vue";
import RepositoryTreeItem from "./RepositoryTreeItem.vue";
import { useRepositoryRefresh } from "@/composables/useRepositoryRefresh";
import AdrSearchBar from "./AdrSearchBar.vue";
import { useResizablePanel } from "@/composables/useResizablePanel";
import { useAdrSearch } from "@/composables/useAdrSearch";
import { sortedAdrs, fileLabel } from "@/utils/adrFiles";
import { store } from "@/plugins/store";
import type { Repository } from "@/plugins/classes";
import type { AdrFile } from "@/types/adr";

const RAIL_WIDTH = 58;
const MIN_WIDTH = 208;
const MAX_WIDTH = 440;
const SNAP_BELOW = 170;
const DEFAULT_WIDTH = 288;

// Bypasses the rail without calling expand(), which would persist a new width to localStorage.
const props = defineProps<{ forceExpanded?: boolean }>();

const emit = defineEmits<{
    "repo-name": [string];
    "active-branch": [string];
    commit: [string];
}>();

const addRepositoriesOpen = ref(false);
const repositoryToRemove = ref<Repository | null>(null);
const adrToDelete = ref<{ adr: AdrFile; repository: Repository } | null>(null);

const { refreshing, done, total } = useRepositoryRefresh();

const repositories = computed(() => [...store.addedRepositories].sort((a, b) => a.fullName.localeCompare(b.fullName)));

const { active: searchActive, filteredAdrs, availableTags, availableStatuses } = useAdrSearch();

const allTags = computed(() => availableTags(store.addedRepositories));
const allStatuses = computed(() => availableStatuses(store.addedRepositories));

const currentRepoFullName = computed(() => store.currentRepository?.fullName);

// ---- Expansion state ----
const openedRepos = ref<string[]>([]);
watch(
    () => store.currentRepository,
    (repo) => {
        if (repo && !openedRepos.value.includes(repo.fullName)) {
            openedRepos.value = [repo.fullName];
        }
    },
    { immediate: true }
);

function isOpen(repo: Repository): boolean {
    return openedRepos.value.includes(repo.fullName);
}

function toggleRepo(repo: Repository): void {
    if (isOpen(repo)) {
        openedRepos.value = openedRepos.value.filter((name) => name !== repo.fullName);
    } else {
        openedRepos.value.push(repo.fullName);
    }
}

function selectRepo(repo: Repository): void {
    toggleRepo(repo);
    emit("repo-name", repo.fullName);
    emit("active-branch", repo.activeBranch);
}

// ---- Files ----
function activeAdrIn(repo: Repository): AdrFile | null {
    return store.currentRepository === repo ? (store.currentlyEditedAdr ?? null) : null;
}

function openFile(repo: Repository, file: AdrFile): void {
    if (store.currentlyEditedAdr !== file) {
        store.openAdrBy(repo.fullName, file.path.split("/").pop());
    }
}

function createNewAdr(repo: Repository): void {
    const newAdr = store.createNewAdr(repo);
    if (newAdr) {
        store.openAdrBy(repo.fullName, newAdr.path.split("/").pop());
    }
}

function removeRepository(): void {
    const repo = repositoryToRemove.value;
    repositoryToRemove.value = null;
    if (!repo) {
        return;
    }
    if (store.currentRepository && repo.fullName === store.currentRepository.fullName) {
        emit("repo-name", "");
        emit("active-branch", "");
    }
    store.removeRepository(repo);
}

function deleteAdr(): void {
    const target = adrToDelete.value;
    adrToDelete.value = null;
    if (target) {
        store.deleteAdr(target.adr, target.repository);
    }
}

// ---- Resizing (snaps to an icon rail when dragged narrow) ----
const {
    width,
    collapsed: rail,
    startResize,
    expand
} = useResizablePanel({
    storageKey: "explorerWidth",
    min: MIN_WIDTH,
    max: MAX_WIDTH,
    defaultWidth: DEFAULT_WIDTH,
    handle: "right",
    collapseBelow: SNAP_BELOW,
    collapseTo: RAIL_WIDTH
});

// A rail-collapsed panel keeps its narrow width, so the forced view needs a usable one.
const expandedWidth = computed(() => (props.forceExpanded ? Math.max(width.value, DEFAULT_WIDTH) : width.value));
</script>

<style scoped>
.explorer {
    flex: 0 0 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    background: var(--adr-surface-1);
    border-right: 1px solid var(--adr-line);
    overflow: visible;
}

/* ---- Icon rail (sidebar dragged narrow) ---- */
.explorer.rail {
    flex: 0 0 58px;
    width: 58px;
}

.rail-head {
    height: 44px;
    flex: 0 0 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--adr-line);
}

.rail-list {
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
}

.rail-foot {
    flex: 0 0 auto;
    padding: 8px 0;
    border-top: 1px solid var(--adr-line);
    display: flex;
    justify-content: center;
}

.rail-repo,
.rail-file {
    border: 0;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--adr-ink-2);
}

.rail-repo {
    width: 40px;
    height: 40px;
}

.rail-file {
    width: 34px;
    height: 34px;
}

.rail-repo:hover,
.rail-file:hover {
    background: var(--adr-surface-2);
    color: var(--adr-ink);
}

.rail-repo .mdi {
    font-size: 21px;
}

.rail-file .mdi {
    font-size: 17px;
    color: var(--adr-ink-3);
}

.rail-repo.active {
    color: var(--adr-teal);
}

.rail-file.active {
    background: var(--adr-teal-050);
}

.rail-file.active .mdi {
    color: var(--adr-teal);
}

.rail-repo.active::before,
.rail-file.active::before {
    content: "";
    position: absolute;
    left: -1px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    border-radius: 2px;
    background: var(--adr-teal);
}

/* ---- Resize handle ---- */
.exp-resize {
    position: absolute;
    top: 0;
    right: -3px;
    bottom: 0;
    width: 7px;
    cursor: col-resize;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
}

.exp-resize::after {
    content: "";
    position: absolute;
    right: 3px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: transparent;
    transition: background 0.14s;
}

.exp-resize:hover::after {
    background: var(--adr-teal);
}

.exp-resize .grip {
    width: 3px;
    height: 26px;
    border-radius: 3px;
    background: var(--adr-line-strong);
    opacity: 0;
    transition: opacity 0.14s;
}

.exp-resize:hover .grip {
    opacity: 1;
}

/* ---- Header / list / footer ---- */
.exp-head {
    height: 44px;
    flex: 0 0 44px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px 0 16px;
    border-bottom: 1px solid var(--adr-line);
}

.etitle {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--adr-ink-2);
}

.exp-refresh {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    font-size: 12px;
    color: var(--adr-ink-2);
    border-bottom: 1px solid var(--adr-line);
}

.exp-list {
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 6px 8px;
}

.exp-foot {
    flex: 0 0 auto;
    padding: 10px;
    border-top: 1px solid var(--adr-line);
}

/* ---- Add repository ---- */
.btn-addrepo {
    width: 100%;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 7px;
    border: 1px dashed var(--adr-line-strong);
    background: var(--adr-surface);
    color: var(--adr-ink-2);
    font-family: inherit;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    transition:
        border-color 0.14s,
        color 0.14s,
        background 0.14s;
}

.btn-addrepo:hover {
    border-color: var(--adr-teal);
    color: var(--adr-teal);
    background: var(--adr-teal-050);
}

.btn-addrepo .mdi {
    font-size: 17px;
}
</style>
