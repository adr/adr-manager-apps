<template>
    <BaseDialog v-model="show" title="Commit & Push" icon="publish" :width="700">
        <div class="step-head">
            <span class="mdi mdi-file" aria-hidden="true"></span>
            <span class="step-title">Select files</span>
            <span
                v-if="anyFileSelected"
                data-cy="mdiCheckSelected"
                class="mdi mdi-check step-state ok"
                aria-hidden="true"
            ></span>
            <span
                v-else
                data-cy="mdiAlertNotSelected"
                class="mdi mdi-alert-circle-outline step-state bad"
                aria-hidden="true"
            ></span>
        </div>

        <section v-for="group in fileGroups" :key="group.key" class="file-group">
            <button type="button" class="group-head" :data-cy="group.headCy" @click="toggleGroup(group.key)">
                <span class="mdi" :class="`mdi-${group.icon}`" aria-hidden="true"></span>
                <span class="group-title">{{ group.label }}</span>
                <span class="spacer"></span>
                <span
                    class="mdi"
                    :class="openGroups.includes(group.key) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                    aria-hidden="true"
                ></span>
            </button>
            <div v-if="openGroups.includes(group.key)" class="group-body">
                <label v-for="file in group.files" :key="file.path" class="file-check" :data-cy="group.rowCy">
                    <input
                        v-model="file.fileSelected"
                        type="checkbox"
                        :data-cy="group.checkboxCy"
                        class="file-checkbox"
                    />
                    {{ file.title }}
                </label>
            </div>
        </section>

        <div class="step-head message-head">
            <span class="mdi mdi-message-text" aria-hidden="true"></span>
            <span class="step-title">Enter commit message</span>
            <span
                v-if="commitMessage !== ''"
                data-cy="mdiCheckCommitMessage"
                class="mdi mdi-check step-state ok"
                aria-hidden="true"
            ></span>
            <span
                v-else
                data-cy="mdiAlertCommitMessage"
                class="mdi mdi-alert-circle-outline step-state bad"
                aria-hidden="true"
            ></span>
        </div>
        <AutoGrowTextarea v-model="commitMessage" data-cy="textFieldCommitMessage" placeholder="Commit message" />
        <div v-if="commitMessage === ''" class="message-error">Required</div>

        <div class="push-info">
            <span class="mdi mdi-information-outline" aria-hidden="true"></span>
            Your selected files will be pushed to {{ repoFullName }} on {{ branch }} branch.
        </div>

        <template #actions>
            <button
                type="button"
                data-cy="btnOfDialogCommitForPush"
                class="btn btn-text-success"
                :disabled="commitMessage === '' || !anyFileSelected"
                @click="onCommit"
            >
                Commit & Push
            </button>
            <button type="button" class="btn btn-text-error" @click="show = false">Cancel</button>
        </template>
    </BaseDialog>

    <LoadingOverlay :show="loading" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import AutoGrowTextarea from "./AutoGrowTextarea.vue";
import BaseDialog from "./BaseDialog.vue";
import LoadingOverlay from "./LoadingOverlay.vue";
import { pushSelectedFiles } from "@/composables/useCommitPush";
import { describeGitError } from "@/plugins/git";
import { store } from "@/plugins/store";
import { useAlert } from "@/composables/useAlert";
import { useToast } from "@/composables/useToast";
import type { CommitFile } from "@/types/commit";

interface FileGroup {
    key: string;
    label: string;
    icon: string;
    files: CommitFile[];
    headCy?: string;
    rowCy?: string;
    checkboxCy?: string;
}

const show = defineModel<boolean>({ default: false });
const props = defineProps<{ repoFullName: string }>();
const emit = defineEmits<{ commit: [] }>();

const { alert } = useAlert();
const { showErrorToast } = useToast();

const changedFiles = ref<CommitFile[]>([]);
const newFiles = ref<CommitFile[]>([]);
const deletedFiles = ref<CommitFile[]>([]);
const branch = ref("");
const commitMessage = ref("");
const loading = ref(false);
const openGroups = ref<string[]>([]);

const fileGroups = computed<FileGroup[]>(() =>
    [
        {
            key: "new",
            label: "New files",
            icon: "plus",
            files: newFiles.value,
            headCy: "newFilesCommitMessage",
            rowCy: "newFileCheckBoxOuter",
            checkboxCy: "newFileCheckBox"
        },
        { key: "changed", label: "Changed files", icon: "file-document-edit", files: changedFiles.value },
        {
            key: "deleted",
            label: "Deleted files",
            icon: "delete",
            files: deletedFiles.value,
            headCy: "deletedFilesAdr",
            checkboxCy: "deletedFileCheckBox"
        }
    ].filter((group) => group.files.length > 0)
);

const anyFileSelected = computed(() =>
    [...newFiles.value, ...changedFiles.value, ...deletedFiles.value].some((file) => file.fileSelected)
);

watch(show, (visible) => {
    if (!visible) {
        return;
    }
    commitMessage.value = "";
    openGroups.value = [];
    store.setCurrentRepositoryForCommit(props.repoFullName);
    void store.loadUserInfo().then((loaded) => {
        if (!loaded) {
            showErrorToast("Couldn't load your user info, so the commit author may be incomplete.");
        }
    });
    branch.value = store.getBranchCommit();
    changedFiles.value = store.changedFilesInRepo();
    newFiles.value = store.newFilesInRepo();
    deletedFiles.value = store.deletedFilesInRepo();
    if (fileGroups.value.length === 0) {
        alert("No changes have been made since the last push", "Everything up to date", "success").then(
            () => (show.value = false)
        );
    }
});

function toggleGroup(key: string): void {
    if (openGroups.value.includes(key)) {
        openGroups.value = openGroups.value.filter((group) => group !== key);
    } else {
        openGroups.value.push(key);
    }
}

function onCommit(): void {
    show.value = false;
    emit("commit");
    push();
}

async function push(): Promise<void> {
    loading.value = true;
    try {
        const pushedFiles = await pushSelectedFiles({
            repoFullName: props.repoFullName,
            branch: branch.value,
            changedFiles: changedFiles.value,
            newFiles: newFiles.value,
            deletedFiles: deletedFiles.value,
            commitMessage: commitMessage.value,
            author: { name: store.getUserName(), email: store.getUserEmail() }
        });
        store.updateLocalStorageAfterCommit(pushedFiles);
        alert("Successfully pushed", "Success", "success");
    } catch (error) {
        console.error(error);
        alert(`Your changes were not pushed. ${describeGitError(error)}`, "Error", "error");
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.step-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    position: relative;
}

.step-head > .mdi {
    color: var(--adr-ink-2);
    font-size: 19px;
}

.step-title {
    font-size: 14px;
    font-weight: 500;
}

.step-state {
    position: absolute;
    right: 0;
}

.step-state.ok {
    color: var(--adr-success);
}

.step-state.bad {
    color: var(--adr-error);
}

.message-head {
    margin-top: 18px;
}

.file-group {
    border: 1px solid var(--adr-line);
    border-radius: 6px;
    margin-bottom: 6px;
    overflow: hidden;
}

.group-head {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: 0;
    background: var(--adr-surface);
    font-family: inherit;
    font-size: 13px;
    padding: 10px 12px;
    cursor: pointer;
}

.group-head:hover {
    background: var(--adr-surface-2);
}

.group-head .mdi {
    color: var(--adr-ink-2);
    font-size: 17px;
}

.group-title {
    font-weight: 600;
    color: var(--adr-ink);
}

.group-body {
    padding: 4px 12px 10px;
    border-top: 1px solid var(--adr-line);
}

.file-check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    padding: 5px 0;
    cursor: pointer;
    font-family: var(--adr-font-mono);
}

.file-checkbox {
    accent-color: var(--accent);
    width: 16px;
    height: 16px;
}

.message-error {
    color: var(--adr-error);
    font-size: 12px;
    margin-top: 4px;
}

.push-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 18px;
    color: var(--adr-ink-2);
    font-size: 13px;
}

.push-info .mdi {
    color: var(--accent);
    font-size: 18px;
}
</style>
