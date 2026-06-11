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
        />

        <div class="shell-body">
            <RepositoryExplorer
                v-if="showFileExplorer"
                v-show="showExplorer"
                @repo-name="updateBranches"
                @active-branch="setActiveBranch"
                @commit="openCommitDialog"
            />

            <main class="pane-editor">
                <template v-if="showEditor">
                    <MadrEditor
                        v-if="!requiresConversion"
                        :adr="adrRecord"
                        :mode="store.mode"
                        :template-version="templateVersion"
                        :file-name="currentFileName"
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
            <span class="file text-truncate">{{ adrPath }}</span>
            <span class="spacer"></span>
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

        <DialogAddRepositories v-model="addRepositoriesOpen" />
        <DialogCommit v-model="commitDialogOpen" :repo-full-name="commitRepoFullName" />
        <AppToast />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getActiveProvider } from "@/plugins/git";
import { store } from "@/plugins/store";
import { useAdrEditor } from "@/composables/useAdrEditor";
import { useBranchSelection } from "@/composables/useBranchSelection";
import { useEditorRouteSync } from "@/composables/useEditorRouteSync";
import { useToast } from "@/composables/useToast";

import AppToast from "@/components/AppToast.vue";
import AppTopbar from "@/components/AppTopbar.vue";
import DialogAddRepositories from "@/components/DialogAddRepositories.vue";
import DialogCommit from "@/components/DialogCommit.vue";
import EditorConvert from "@/components/EditorConvert.vue";
import MadrEditor from "@/components/MadrEditor.vue";
import MarkdownPreviewPane from "@/components/MarkdownPreviewPane.vue";
import RepositoryExplorer from "@/components/RepositoryExplorer.vue";

const props = defineProps<{ repoFullName?: string; branch?: string; adr?: string }>();

const router = useRouter();
const { showToast } = useToast();

const showExplorer = ref(true);
const showPreview = ref(true);
const addRepositoriesOpen = ref(false);
const commitDialogOpen = ref(false);
const commitRepoFullName = ref("");

const {
    adr: adrRecord,
    markdown,
    requiresConversion,
    templateVersion,
    setTemplateVersion,
    updateFromRaw,
    acceptConversion
} = useAdrEditor();
const { routeDataFromStore } = useEditorRouteSync(props);
const { selected, branchNames, setActiveBranch, onSelectedBranch, updateBranches, onBranchSelectClick } =
    useBranchSelection(routeDataFromStore);

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
        .catch(() => showToast("Could not copy the markdown"));
}

function logOut(): void {
    getActiveProvider().signOut();
    localStorage.clear();
    store.setMode("basic");
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
    flex: 1 1 58%;
    min-width: 0;
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
