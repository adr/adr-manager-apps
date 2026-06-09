<template>
    <v-dialog v-model="show" width="700">
        <template #activator="{ props }">
            <slot name="activator" :props="props" />
        </template>
        <v-card>
            <v-card-title>
                <div>
                    <v-avatar color="primary" size="35"> <v-icon color="white">mdi-publish</v-icon></v-avatar>
                    <span class="dialogTitle"> Commit &amp; Push</span>
                </div>
            </v-card-title>

            <v-divider></v-divider>
            <v-card-text>
                <div class="cardTextPos">
                    <v-icon>mdi-file</v-icon><span class="spanAfterIcon spanTitle"> Select files</span>
                    <v-icon data-cy="mdiCheckSelected" class="status-icon-corner" v-if="fileSelected" color="success">
                        mdi-check
                    </v-icon>
                    <v-icon data-cy="mdiAlertNotSelected" class="status-icon-corner" v-if="!fileSelected" color="error">
                        mdi-alert-circle-outline
                    </v-icon>
                </div>
                <v-expansion-panels v-model="openedPanel" multiple class="mb-6">
                    <v-expansion-panel v-if="newFileBool">
                        <v-expansion-panel-title>
                            <div>
                                <v-icon>mdi-plus</v-icon
                                ><span data-cy="newFilesCommitMessage" class="spanAfterIcon spanSubTitle">
                                    New files</span
                                >
                            </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <div v-for="(newFile, indexNew) in newFiles" :key="indexNew">
                                <div data-cy="newFileCheckBoxOuter">
                                    <v-checkbox
                                        data-cy="newFileCheckBox"
                                        :model-value="newFile.fileSelected"
                                        @update:model-value="
                                            (value) => checkboxAction(value ?? false, newFile.path, newFiles)
                                        "
                                        :label="newFile.title"
                                        class="stuff"
                                    ></v-checkbox>
                                </div>
                            </div>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <v-expansion-panel v-if="changedFileBool">
                        <v-expansion-panel-title>
                            <div>
                                <v-icon>mdi-file-document-edit</v-icon
                                ><span class="spanAfterIcon spanSubTitle"> Changed files</span>
                            </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <div v-for="(changedFile, indexChange) in changedFiles" :key="indexChange">
                                <div>
                                    <v-checkbox
                                        :model-value="changedFile.fileSelected"
                                        @update:model-value="
                                            (value) => checkboxAction(value ?? false, changedFile.path, changedFiles)
                                        "
                                        class="stuff"
                                        :label="changedFile.title"
                                    ></v-checkbox>
                                </div>
                            </div>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                    <v-expansion-panel v-if="deletedFileBool">
                        <v-expansion-panel-title>
                            <div>
                                <v-icon>mdi-delete</v-icon
                                ><span data-cy="deletedFilesAdr" class="spanAfterIcon spanSubTitle">
                                    Deleted files</span
                                >
                            </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                            <div v-for="(deletedFile, index) in deletedFiles" :key="index">
                                <div>
                                    <v-checkbox
                                        data-cy="deletedFileCheckBox"
                                        :model-value="deletedFile.fileSelected"
                                        @update:model-value="
                                            (value) => checkboxAction(value ?? false, deletedFile.path, deletedFiles)
                                        "
                                        class="stuff"
                                        :label="deletedFile.title"
                                    ></v-checkbox>
                                </div>
                            </div>
                        </v-expansion-panel-text>
                    </v-expansion-panel>
                </v-expansion-panels>
                <div class="distanceToExpPanels">
                    <v-icon>mdi-message-text</v-icon><span class="spanAfterIcon spanTitle"> Enter commit message</span>
                    <v-icon
                        data-cy="mdiCheckCommitMessage"
                        class="status-icon-corner"
                        v-if="!textFieldError"
                        color="success"
                    >
                        mdi-check
                    </v-icon>
                    <v-icon
                        data-cy="mdiAlertCommitMessage"
                        class="status-icon-corner"
                        v-if="textFieldError"
                        color="error"
                    >
                        mdi-alert-circle-outline
                    </v-icon>
                </div>
                <v-textarea
                    data-cy="textFieldCommitMessage"
                    label="Commit message"
                    auto-grow
                    rows="1"
                    v-model="comMessage"
                    :error-messages="errorMessages"
                ></v-textarea>

                <div class="distanceToTextField">
                    <v-icon color="primary">mdi-information-outline</v-icon>
                    <span class="spanAfterIcon">
                        Your selected files will be pushed to {{ repo }} on {{ branch }} branch.</span
                    >
                </div>
            </v-card-text>

            <v-divider></v-divider>
            <v-card-actions class="buttonPadding">
                <v-spacer></v-spacer>
                <v-btn
                    data-cy="btnOfDialogCommitForPush"
                    variant="text"
                    color="success"
                    :disabled="textFieldError || !fileSelected"
                    @click="onCommit"
                >
                    Commit &amp; Push
                </v-btn>
                <v-btn variant="text" color="error" @click="show = false"> Cancel </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-overlay v-model="loading" class="align-center justify-center" persistent>
        <v-progress-circular :size="50" color="primary" indeterminate></v-progress-circular>
    </v-overlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { getCommitSha, createBlobs, createFileTree, createCommit, pushToGitHub } from "@/plugins/api";
import { store } from "@/plugins/store";
import { useAlert } from "@/composables/useAlert";
import type { CommitFile, PushedFile } from "@/types/commit";
import type { GitHubTreeInput } from "@/types/github";

const show = defineModel<boolean>({ default: false });
const props = defineProps<{ repo: string }>();
const emit = defineEmits<{ commit: [] }>();

const { alert } = useAlert();

const lastCommitSha = ref("");
const blobSha = ref<Record<string, { blobSha: string; path: string }>>({});
const changedFiles = ref<CommitFile[]>([]);
const newFiles = ref<CommitFile[]>([]);
const deletedFiles = ref<CommitFile[]>([]);
const commitFiles = ref<CommitFile[]>([]);
const branch = ref("");
const comMessage = ref("");
const loading = ref(false);
const fileSelected = ref(false);
const newFileBool = ref(false);
const deletedFileBool = ref(false);
const changedFileBool = ref(false);
const gitHubTimeout = ref(false);
const filesPushed = ref<PushedFile[]>([]);
const deletedSelected = ref(false);
const newSelected = ref(false);
const changedSelected = ref(false);
const openedPanel = ref<number[]>([]);
const errorRequest = ref(false);

const textFieldError = computed(() => comMessage.value === "");
const errorMessages = computed(() => (comMessage.value === "" ? "Required" : ""));

watch(show, (visible) => {
    if (visible) {
        if (gitHubTimeout.value) {
            gitHubTimeoutAlert();
            return;
        }
        resetDialog();
        store.setCurrentRepositoryForCommit(props.repo);
        void store.setInfoForCommit();
        branch.value = store.getBranchCommit();
        setFilesForCommit();
        if (!newFileBool.value && !deletedFileBool.value && !changedFileBool.value) {
            nothingToCommitAlert();
        }
    }
});

function setFilesForCommit(): void {
    changedFiles.value = store.changedFilesInRepo();
    if (changedFiles.value.length > 0) {
        changedFileBool.value = true;
    }
    newFiles.value = store.newFilesInRepo();
    if (newFiles.value.length > 0) {
        newFileBool.value = true;
    }
    deletedFiles.value = store.deletedFilesInRepo();
    if (deletedFiles.value.length > 0) {
        deletedFileBool.value = true;
    }
}

function resetDialog(): void {
    newFiles.value = [];
    changedFiles.value = [];
    deletedFiles.value = [];
    filesPushed.value = [];
    commitFiles.value = [];
    blobSha.value = {};
    fileSelected.value = false;
    comMessage.value = "";
    newFileBool.value = false;
    deletedFileBool.value = false;
    changedFileBool.value = false;
    errorRequest.value = false;
    openedPanel.value = [];
}

function onCommit(): void {
    handleCommitButtonAction();
    show.value = false;
    emit("commit");
}

function handleCommitButtonAction(): void {
    if (!gitHubTimeout.value) {
        commitFiles.value = commitFiles.value.concat(changedFiles.value);
        commitFiles.value = commitFiles.value.concat(newFiles.value);
        requestLastCommitSha();
    }
}

function closeDialog(): void {
    show.value = false;
}

function checkboxAction(checkboxVal: boolean, path: string, listFiles: CommitFile[]): void {
    let tempBool = false;
    for (const file of listFiles) {
        if (file.path === path) {
            file.fileSelected = checkboxVal;
        }
        switch (file.fileStatus) {
            case "new":
                if (file.fileSelected) {
                    tempBool = true;
                    newSelected.value = true;
                }
                if (!tempBool) {
                    newSelected.value = false;
                }
                break;
            case "changed":
                if (file.fileSelected) {
                    tempBool = true;
                    changedSelected.value = true;
                }
                if (!tempBool) {
                    changedSelected.value = false;
                }
                break;
            case "deleted":
                if (file.fileSelected) {
                    tempBool = true;
                    deletedSelected.value = true;
                }
                if (!tempBool) {
                    deletedSelected.value = false;
                }
                break;
        }
    }
    fileSelected.value = newSelected.value || changedSelected.value || deletedSelected.value;
}

function requestLastCommitSha(): void {
    loading.value = true;
    if (!errorRequest.value) {
        getCommitSha()
            .then((res) => {
                if (!res) {
                    throw new Error("Could not load the latest commit.");
                }
                lastCommitSha.value = res.commit.sha;
                createBlobsRequest();
            })
            .catch((error: unknown) => {
                errorRequest.value = true;
                errorDialog(error);
                console.error(error);
            });
    }
}

function createBlobsRequest(): void {
    const countKeysList = commitFiles.value.length;
    let countForEach = 0;
    if (commitFiles.value.length > 0) {
        for (const value of commitFiles.value) {
            if (value.fileSelected) {
                filesPushed.value.push({ path: value.path, type: value.fileStatus });
                if (!errorRequest.value) {
                    createBlobs(value.value)
                        .then((res) => {
                            countForEach++;
                            if (res) {
                                blobSha.value[value.title] = { blobSha: res.sha, path: value.path };
                            }
                            if (countForEach === countKeysList) {
                                createFolderTreeRequest();
                            }
                        })
                        .catch((error: unknown) => {
                            errorRequest.value = true;
                            errorDialog(error);
                            console.error(error);
                        });
                }
            } else {
                countForEach++;
            }
        }
    } else {
        createFolderTreeRequest();
    }
}

function createFolderTreeRequest(): void {
    const fileTree: GitHubTreeInput[] = [];
    Object.values(blobSha.value).forEach((entry) => {
        fileTree.push({ path: entry.path, mode: "100644", type: "blob", sha: entry.blobSha });
    });
    if (deletedFileBool.value) {
        deletedFiles.value.forEach((file) => {
            if (file.fileSelected) {
                filesPushed.value.push({ path: file.path, type: file.fileStatus });
                fileTree.push({ path: file.path, mode: "100644", type: "blob", sha: null });
            }
        });
    }
    if (!errorRequest.value) {
        createFileTree(lastCommitSha.value, fileTree)
            .then((res) => {
                if (res) {
                    createCommitRequest(res.sha);
                }
            })
            .catch((error: unknown) => {
                errorRequest.value = true;
                errorDialog(error);
                console.error(error);
            });
    }
}

function createCommitRequest(treeSha: string): void {
    if (!errorRequest.value) {
        createCommit(
            comMessage.value,
            { name: store.getUserName(), email: store.getUserEmail() },
            lastCommitSha.value,
            treeSha
        )
            .then((res) => {
                if (res) {
                    pushToGitHubRequest(res.sha);
                }
            })
            .catch((error: unknown) => {
                errorRequest.value = true;
                errorDialog(error);
                console.error(error);
            });
    }
}

function pushToGitHubRequest(newCommitSha: string): void {
    if (!errorRequest.value) {
        pushToGitHub(newCommitSha)
            .then(() => {
                gitHubTimeout.value = true;
                setTimeout(() => {
                    gitHubTimeout.value = false;
                }, 60000);
                loading.value = false;
                if (!errorRequest.value) {
                    store.updateLocalStorageAfterCommit(filesPushed.value);
                    void alert("Successfully pushed", "Success", "success");
                }
            })
            .catch((error: unknown) => {
                errorRequest.value = true;
                errorDialog(error);
                console.error(error);
            });
    }
}

function errorDialog(currentError: unknown): void {
    void alert(
        "Error during pushing. Your changes were not pushed. Please try again later. \nError code: " +
            String(currentError),
        "Error",
        "error"
    ).then(() => closeDialog());
}

function nothingToCommitAlert(): void {
    void alert("No changes have been made since the last push", "Everything up to date", "success").then(() =>
        closeDialog()
    );
}

/**
 * We can only push once per minute due to the GitHub API latency, otherwise we risk overwriting
 * the last push with an outdated commit sha.
 */
function gitHubTimeoutAlert(): void {
    void alert("Latency problem with GitHub Api. Please wait ~60 seconds!", "Warning", "warning").then(() =>
        closeDialog()
    );
}
</script>

<style>
.spanAfterIcon {
    vertical-align: middle;
}

.stuff .v-messages {
    min-height: 0% !important;
}

.stuff label {
    margin-bottom: 0%;
    font-size: 0.8rem;
}

.dialogTitle {
    font-size: 2rem;
    vertical-align: middle;
}

.spanTitle {
    font-size: 1rem;
}

.spanSubTitle {
    font-size: 0.8rem;
}

.cardTextPos {
    position: relative;
}

/* Status check/alert icon pinned to the bottom-right of its section header. */
.status-icon-corner {
    position: absolute;
    right: 0;
    bottom: 0;
}

.distanceToExpPanels {
    position: relative;
    padding-top: 3%;
}

.distanceToTextField {
    padding-top: 10%;
}

.buttonPadding {
    padding: 1% 3%;
}

textarea {
    font-family: roboto;
}
</style>
