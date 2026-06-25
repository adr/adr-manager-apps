<template>
    <div class="app-shell">
        <AppTopbar
            :mode="store.mode"
            :template-version="templateVersion"
            :show-explorer="showExplorer"
            :show-preview="showPreview"
            :can-commit="store.currentRepository !== undefined"
            @toggle-explorer="showExplorer = !showExplorer"
            @toggle-preview="showPreview = !showPreview"
            @set-mode="store.setMode($event)"
            @set-version="setTemplateVersion"
            @copy-md="copyMarkdown"
            @commit="openCommitDialog(store.currentRepository?.fullName)"
            @disconnect="logOut"
            @start-tour="tour.start()"
        />

        <div class="shell-body">
            <RepositoryExplorer
                v-if="showFileExplorer"
                v-show="showExplorer"
                :force-expanded="tour.active.value"
                @repo-name="updateBranches"
                @active-branch="setActiveBranch"
                @commit="openCommitDialog"
            />

            <main class="pane-editor" data-tour="editor">
                <template v-if="showEditor">
                    <HiddenFieldsConvertDialog
                        v-if="hiddenFieldsCauseConversion"
                        @open-with-fields-visible="openWithFieldsVisible"
                        @open-with-fields-hidden="openWithFieldsHidden"
                    />
                    <MadrEditor
                        v-else-if="!requiresConversion"
                        :adr="adrRecord"
                        :mode="store.mode"
                        :template-version="templateVersion"
                        :file-name="currentFileName"
                        :field-visibility="effectiveFieldVisibility"
                        :highlighted-fields="highlightedFields"
                        :tags="adrTags"
                        @update:tags="setTags"
                    />
                    <EditorConvert
                        v-else
                        :raw="markdown"
                        :template-version="templateVersion"
                        @accept="acceptConversion"
                    />
                </template>
                <div v-else-if="!showFileExplorer" class="empty-state">
                    <button type="button" data-cy="addRepo" class="btn btn-primary" @click="addRepositoriesOpen = true">
                        <span class="mdi mdi-folder-plus" aria-hidden="true"></span>
                        Add Repositories
                    </button>
                </div>
                <div v-else class="empty-state">
                    <p>Select an ADR in the repository panel to start editing.</p>
                </div>
            </main>

            <MarkdownPreviewPane
                v-if="showPreview && showEditor"
                :markdown="markdown"
                :file-name="currentFileName"
                @raw-edit="updateFromRaw"
                @close="showPreview = false"
            />
        </div>

        <footer class="statusbar">
            <span class="mdi mdi-folder-outline" aria-hidden="true"></span>
            <span class="file text-truncate" data-tour="adr-path">{{ adrPath }}</span>
            <span class="spacer"></span>
            <span
                v-if="branchesLoading"
                class="mdi mdi-loading mdi-spin"
                role="status"
                aria-label="Loading branches"
            ></span>
            <span v-else-if="branchError" class="branch-error" data-cy="branchError" :title="branchError">
                <span class="mdi mdi-alert-circle" aria-hidden="true"></span>
                <span class="branch-error-text text-truncate">{{ branchError }}</span>
                <button
                    type="button"
                    class="branch-retry"
                    data-cy="branchRetry"
                    aria-label="Retry loading branches"
                    @click="retryLoadBranches"
                >
                    <span class="mdi mdi-refresh" aria-hidden="true"></span>
                </button>
            </span>
            <label class="branch">
                <span class="mdi mdi-source-branch" aria-hidden="true"></span>
                <select
                    id="current-branch"
                    v-model="selected"
                    data-cy="branchSelect"
                    name="current-branch"
                    class="branch-select"
                    @change="onSelectedBranch"
                    @click="onBranchSelectClick"
                >
                    <option v-for="branchName in branchNames" :key="branchName" data-cy="branchSelectOption">
                        {{ branchName }}
                    </option>
                </select>
            </label>
        </footer>

        <LoadingOverlay :show="switchingBranch" />

        <DialogAddRepositories v-model="addRepositoriesOpen" />
        <DialogCommit v-model="commitDialogOpen" :repo-full-name="commitRepoFullName" />
        <DialogTourWelcome v-model="welcomeOpen" @start="tour.start()" />
        <TourOverlay />
        <AppToast />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { getActiveProvider } from "@/plugins/git";
import { store } from "@/plugins/store";
import { lsGet, lsSet } from "@/plugins/storage";
import { useAdrEditor } from "@/composables/useAdrEditor";
import { useBranchSelection } from "@/composables/useBranchSelection";
import { useEditorRouteSync } from "@/composables/useEditorRouteSync";
import { useRepositoryRefresh } from "@/composables/useRepositoryRefresh";
import { useToast } from "@/composables/useToast";
import { useTour } from "@/composables/useTour";

import AppToast from "@/components/AppToast.vue";
import AppTopbar from "@/components/AppTopbar.vue";
import DialogAddRepositories from "@/components/DialogAddRepositories.vue";
import DialogCommit from "@/components/DialogCommit.vue";
import DialogTourWelcome from "@/components/DialogTourWelcome.vue";
import EditorConvert from "@/components/EditorConvert.vue";
import HiddenFieldsConvertDialog from "@/components/HiddenFieldsConvertDialog.vue";
import LoadingOverlay from "@/components/LoadingOverlay.vue";
import MadrEditor from "@/components/MadrEditor.vue";
import MarkdownPreviewPane from "@/components/MarkdownPreviewPane.vue";
import RepositoryExplorer from "@/components/RepositoryExplorer.vue";
import TourOverlay from "@/components/TourOverlay.vue";

const props = defineProps<{ repoFullName?: string; branch?: string; adr?: string }>();

const router = useRouter();
const { showToast, showErrorToast } = useToast();
const { refreshAllRepositories, resetSessionGuard } = useRepositoryRefresh();

const showExplorer = ref(true);
const showPreview = ref(true);
const addRepositoriesOpen = ref(false);
const commitDialogOpen = ref(false);
const commitRepoFullName = ref("");
const welcomeOpen = ref(false);

const tour = useTour();
let panesBeforeTour: { explorer: boolean; preview: boolean } | undefined;

// Force the panes open so every step has its anchor. The body class reveals
// hover-only controls (e.g. the delete button) so they can be spotlighted.
watch(
    () => tour.active.value,
    (isActive) => {
        if (isActive) {
            panesBeforeTour = { explorer: showExplorer.value, preview: showPreview.value };
            showExplorer.value = true;
            showPreview.value = true;
            document.body.classList.add("tour-active");
        } else {
            if (panesBeforeTour) {
                showExplorer.value = panesBeforeTour.explorer;
                showPreview.value = panesBeforeTour.preview;
                panesBeforeTour = undefined;
            }
            document.body.classList.remove("tour-active");
        }
    }
);

// Closing the offer either way counts as seen, the tour stays replayable from the help button.
watch(welcomeOpen, (open) => {
    if (!open) {
        lsSet("tourSeen", "1");
    }
});

const {
    adr: adrRecord,
    tags: adrTags,
    markdown,
    requiresConversion,
    hiddenFieldsCauseConversion,
    effectiveFieldVisibility,
    highlightedFields,
    templateVersion,
    setTags,
    setTemplateVersion,
    updateFromRaw,
    acceptConversion,
    openWithFieldsVisible,
    openWithFieldsHidden
} = useAdrEditor();
const { routeDataFromStore } = useEditorRouteSync(props);
const {
    selected,
    branchNames,
    branchesLoading,
    branchError,
    switchingBranch,
    setActiveBranch,
    onSelectedBranch,
    retryLoadBranches,
    updateBranches,
    onBranchSelectClick
} = useBranchSelection(routeDataFromStore);

const showFileExplorer = computed(() => store.addedRepositories.length > 0);
const showEditor = computed(() => store.currentlyEditedAdr !== undefined);

const currentFileName = computed(() => store.currentlyEditedAdr?.path.split("/").pop() ?? "");

const adrPath = computed(() => {
    if (store.currentRepository && store.currentlyEditedAdr) {
        return store.currentRepository.fullName + "/" + store.currentlyEditedAdr.path;
    }
    return "";
});

onMounted(() => {
    store.reload();
    store.openAdrBy(props.repoFullName ?? "", props.adr);
    refreshAllRepositories();
    if (lsGet("tourSeen") === null) {
        welcomeOpen.value = true;
    }
});

function openCommitDialog(repoFullName: string | undefined): void {
    if (!repoFullName) {
        return;
    }
    commitRepoFullName.value = repoFullName;
    commitDialogOpen.value = true;
}

function copyMarkdown(): void {
    navigator.clipboard
        .writeText(markdown.value)
        .then(() => showToast("Markdown copied to clipboard"))
        .catch(() => showErrorToast("Could not copy the markdown"));
}

async function logOut(): Promise<void> {
    await getActiveProvider().signOut();
    localStorage.clear();
    // Don't show the tour screen again after signing-out and signing back in.
    lsSet("tourSeen", "1");
    store.setMode("basic");
    resetSessionGuard();
    router.push("/");
}
</script>

<style scoped>
.app-shell {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.shell-body {
    flex: 1 1 auto;
    display: flex;
    min-height: 0;
}

.pane-editor {
    /* Zero basis: the editor takes whatever the fixed side panels leave over,
       but never less than its minimum. The shortfall then squeezes the preview. */
    flex: 1 1 0;
    min-width: 320px;
    overflow-y: auto;
    background: var(--adr-surface);
}

.empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--adr-ink-2);
}

.statusbar {
    flex: 0 0 28px;
    height: 28px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 14px;
    background: var(--adr-surface-2);
    border-top: 1px solid var(--adr-line);
    font-size: 12px;
    color: var(--adr-ink-2);
}

.statusbar .mdi {
    font-size: 15px;
    color: var(--adr-ink-3);
}

.statusbar .file {
    font-family: var(--adr-font-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.branch {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.branch-error {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
}

.branch-error > .mdi-alert-circle {
    color: var(--adr-error);
}

.branch-error-text {
    max-width: 260px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.branch-retry {
    border: none;
    background: transparent;
    color: var(--adr-ink-2);
    cursor: pointer;
    padding: 0;
    display: inline-flex;
}

.branch-retry:hover {
    color: var(--adr-ink);
}

.branch-select {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--adr-ink);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
}
</style>
