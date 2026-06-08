<template>
    <v-card flat class="text-left d-flex flex-column h-100">
        <div class="flex-grow-1 position-relative">
            <div class="h-100 w-100 position-absolute overflow-y-auto">
                <v-list density="compact" v-model:opened="openedRepos" data-cy="repoNameList">
                    <v-list-group v-for="repo in folderTree" :key="repo.path" :value="repo.path">
                        <template #activator="{ props }">
                            <v-list-item
                                v-bind="props"
                                :prepend-icon="fileTypeIconMapping[repo.fileType] ?? ''"
                                @click="sendRepo(repo)"
                            >
                                <v-list-item-title v-text="repo.name"></v-list-item-title>
                                <template #append>
                                    <DialogCommit :repo="repo.name" v-if="repo.fileType === 'repo'">
                                        <template #activator="{ props: actProps }">
                                            <v-btn
                                                v-bind="actProps"
                                                v-tippy="{
                                                    content: 'Commit and push',
                                                    interactive: true,
                                                    animation: 'scale'
                                                }"
                                                data-cy="pushIcon"
                                                icon="mdi-publish"
                                                size="small"
                                                variant="text"
                                            ></v-btn>
                                        </template>
                                    </DialogCommit>
                                    <DialogRemoveRepository
                                        v-if="repo.fileType === 'repo'"
                                        :repo="{ name: repo.name }"
                                        @remove-repo="removeRepository(repo.repository)"
                                    >
                                        <template #activator="{ props: actProps }">
                                            <v-btn
                                                v-bind="actProps"
                                                v-tippy="{
                                                    content: 'Remove repository',
                                                    interactive: true,
                                                    animation: 'scale'
                                                }"
                                                data-cy="removeRepo"
                                                icon="mdi-folder-remove"
                                                size="small"
                                                variant="text"
                                            ></v-btn>
                                        </template>
                                    </DialogRemoveRepository>
                                </template>
                            </v-list-item>
                        </template>

                        <v-list-item
                            data-cy="adrList"
                            v-for="file in repo.children"
                            :key="file.path"
                            :value="file.path"
                            :active="file.path === openAdrPath"
                            @click="openFileByPath(file.path)"
                        >
                            <v-tooltip location="bottom" open-delay="500" :text="file.tooltip">
                                <template #activator="{ props: tipProps }">
                                    <v-list-item-title v-bind="tipProps" v-text="displayInfo(file)"></v-list-item-title>
                                </template>
                            </v-tooltip>
                            <template #append>
                                <DialogDeleteAdr
                                    v-if="(file.fileType === 'adr' || file.fileType === 'md') && file.adr"
                                    :adr="file.adr"
                                    :repo="repo.repository"
                                >
                                    <template #activator="{ props: actProps }">
                                        <v-btn
                                            v-bind="actProps"
                                            v-tippy="{ content: 'Delete adr', interactive: true, animation: 'scale' }"
                                            data-cy="deleteAdrBtn"
                                            icon="mdi-delete"
                                            size="small"
                                            variant="text"
                                        ></v-btn>
                                    </template>
                                </DialogDeleteAdr>
                            </template>
                        </v-list-item>

                        <div class="d-flex justify-center">
                            <v-btn
                                data-cy="newADR"
                                class="align-center"
                                color="btn-dark"
                                width="75%"
                                prepend-icon="mdi-plus"
                                @click.prevent.stop="createNewAdr(repo)"
                            >
                                New ADR
                            </v-btn>
                        </div>
                    </v-list-group>
                </v-list>
                <div class="my-16"></div>
            </div>
        </div>
        <div class="flex-grow-0 d-flex flex-wrap">
            <DialogAddRepositories>
                <template #activator="{ props }">
                    <v-btn data-cy="addRepo" v-bind="props" color="secondary" class="flex-grow-1"> Add Repository </v-btn>
                </template>
            </DialogAddRepositories>
        </div>
    </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { snakeCase2naturalCase } from "@/plugins/parser";
import { store } from "@/plugins/store";
import DialogAddRepositories from "@/components/DialogAddRepositories.vue";
import DialogCommit from "@/components/DialogCommit.vue";
import DialogRemoveRepository from "@/components/DialogRemoveRepository.vue";
import DialogDeleteAdr from "@/components/DialogDeleteAdr.vue";
import type { Repository } from "@/plugins/classes";
import type { FileNode } from "@/types/fileTree";

const emit = defineEmits<{
    "repo-name": [string];
    "active-branch": [string];
}>();

const fileTypeIconMapping: Record<string, string> = {
    html: "mdi-language-html5",
    js: "mdi-nodejs",
    json: "mdi-code-json",
    md: "mdi-language-markdown",
    pdf: "mdi-file-pdf",
    png: "mdi-file-image",
    txt: "mdi-file-document-outline",
    xls: "mdi-file-excel",
    repo: "mdi-folder-star",
    folder: "mdi-folder"
};

const folderTree = computed<FileNode[]>(() => {
    const tree: FileNode[] = store.addedRepositories.map((repo) => {
        const children: FileNode[] = repo.adrs.map((adr) => {
            const rawName = adr.path.split("/").pop() ?? "";
            const isAdrFile = /\d{4}-.*[.]md/.test(rawName);
            return {
                name: isAdrFile ? snakeCase2naturalCase(rawName).replace(".md", "") : rawName,
                fileType: "adr",
                path: repo.fullName + "/" + adr.path,
                children: [],
                adr,
                tooltip: adr.path
            };
        });
        children.sort((r1, r2) => (r1.path < r2.path ? -1 : r1.path > r2.path ? 1 : 0));
        return {
            name: repo.fullName,
            fullName: repo.fullName,
            fileType: "repo",
            path: repo.fullName,
            children,
            repository: repo
        };
    });
    tree.sort((r1, r2) => {
        const a = r1.fullName ?? "";
        const b = r2.fullName ?? "";
        return a < b ? -1 : a > b ? 1 : 0;
    });
    return tree;
});

const openAdrPath = computed<string | undefined>(() => {
    if (store.currentRepository && store.currentlyEditedAdr) {
        return store.currentRepository.fullName + "/" + store.currentlyEditedAdr.path;
    }
    if (store.currentRepository) {
        return store.currentRepository.fullName;
    }
    return undefined;
});

// Which repository groups are expanded (keyed by repo full name = node path).
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

function displayInfo(file: FileNode): string {
    if (file.adr && file.adr.originalMd !== file.adr.editedMd) {
        return file.name + "*";
    }
    return file.name;
}

function removeRepository(repo: Repository | undefined): void {
    if (!repo) {
        return;
    }
    if (store.currentRepository && repo.fullName === store.currentRepository.fullName) {
        emit("repo-name", "");
        emit("active-branch", "");
    }
    store.removeRepository(repo);
}

function sendRepo(repo: FileNode): void {
    emit("repo-name", repo.name);
    if (repo.repository) {
        emit("active-branch", repo.repository.activeBranch);
    }
}

function openFileByPath(path: string): void {
    const file = findFileByPath(folderTree.value, path);
    if (file) {
        openFile(file);
    }
}

function openFile(file: FileNode): void {
    if (file.adr && store.currentlyEditedAdr !== file.adr) {
        const parts = file.path.split("/");
        const repoFullName = (parts[0] ?? "") + "/" + (parts[1] ?? "");
        store.openAdrBy(repoFullName, file.adr.path.split("/").pop());
    }
}

function createNewAdr(repoNode: FileNode): void {
    if (!repoNode.repository) {
        return;
    }
    const newAdr = store.createNewAdr(repoNode.repository);
    if (newAdr) {
        store.openAdrBy(repoNode.fullName ?? "", newAdr.path.split("/").pop());
    }
}

function findFileByPath(tree: FileNode[], path: string): FileNode | undefined {
    let current: FileNode | undefined = tree.find((file) => path.startsWith(file.path));
    while (current) {
        if (current.path === path || current.path.startsWith(path)) {
            return current;
        }
        current = current.children.find((file) => path.startsWith(file.path) || file.path.startsWith(path));
    }
    return current;
}
</script>

<style scoped></style>
