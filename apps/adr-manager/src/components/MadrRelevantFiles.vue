<template>
    <div class="relevant-files">
        <p v-if="adr.relevantFiles.length === 0" class="hint">No files linked yet.</p>
        <ul v-else class="file-rows">
            <li v-for="(path, index) in adr.relevantFiles" :key="path" class="file-row">
                <span class="mdi mdi-file-outline" aria-hidden="true"></span>
                <a
                    v-if="fileUrl(path)"
                    :href="fileUrl(path)"
                    target="_blank"
                    rel="noopener"
                    class="file-link"
                    data-cy="relevantFileLink"
                    :title="`Open ${path} on ${providerName}`"
                >
                    {{ path }}
                </a>
                <span v-else class="file-link plain" data-cy="relevantFileLink">{{ path }}</span>
                <span
                    v-if="isMissing(path)"
                    class="missing-badge"
                    data-cy="relevantFileMissing"
                    :title="`This file no longer exists on branch ${branch}`"
                >
                    <span class="mdi mdi-alert" aria-hidden="true"></span>
                    not found
                </span>
                <button
                    type="button"
                    class="row-del"
                    title="Remove"
                    data-cy="relevantFileRemove"
                    @click="removeFile(index)"
                >
                    <span class="mdi mdi-delete-outline" aria-hidden="true"></span>
                </button>
            </li>
        </ul>

        <button
            type="button"
            class="btn btn-outline add-btn"
            data-cy="relevantFilesPick"
            :disabled="!repository"
            @click="showPicker = true"
        >
            <span class="mdi mdi-file-link-outline" aria-hidden="true"></span>
            Add files…
        </button>

        <DialogRelevantFiles
            v-if="repository"
            v-model="showPicker"
            :repo-full-name="repository.fullName"
            :branch="branch"
            :selected="adr.relevantFiles"
            @apply="applySelection"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import DialogRelevantFiles from "./DialogRelevantFiles.vue";
import { getActiveProvider } from "@/plugins/git";
import { fetchFileList, getCachedFileList } from "@/plugins/git/fileListCache";
import { store } from "@/plugins/store";
import type { ArchitecturalDecisionRecord } from "@/plugins/classes";

const props = defineProps<{ adr: ArchitecturalDecisionRecord }>();

const showPicker = ref(false);
const repository = computed(() => store.currentRepository);
const branch = computed(() => repository.value?.activeBranch ?? "");
const providerName = computed(() => (getActiveProvider().id === "gitlab" ? "GitLab" : "GitHub"));

// Tri-state existence: undefined means the listing is unknown this session, so no warning is shown.
const fileList = ref<string[] | undefined>(undefined);
const fileSet = computed(() => (fileList.value ? new Set(fileList.value) : undefined));

watch(
    () => (repository.value ? `${repository.value.fullName}@${branch.value}` : ""),
    () => {
        const repo = repository.value;
        fileList.value = repo ? getCachedFileList(repo.fullName, branch.value) : undefined;
        // The tour's demo repository is transient and has no provider behind it.
        if (repo && !repo.transient && !fileList.value) {
            fetchFileList(repo.fullName, branch.value)
                .then((files) => {
                    fileList.value = files;
                })
                .catch((error: unknown) => {
                    console.error(error);
                });
        }
    },
    { immediate: true }
);

function isMissing(path: string): boolean {
    return fileSet.value !== undefined && !fileSet.value.has(path);
}

function fileUrl(path: string): string | undefined {
    const repo = repository.value;
    if (!repo || repo.transient) {
        return undefined;
    }
    return getActiveProvider().fileWebUrl(repo.fullName, branch.value, path);
}

function removeFile(index: number): void {
    props.adr.relevantFiles.splice(index, 1);
}

function applySelection(files: string[]): void {
    // Mutated in place so useAdrEditor's deep watch sees the change on the shared record.
    props.adr.relevantFiles.splice(0, props.adr.relevantFiles.length, ...files);
    const repo = repository.value;
    if (repo) {
        fileList.value = getCachedFileList(repo.fullName, branch.value) ?? fileList.value;
    }
}
</script>

<style scoped>
.relevant-files {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.hint {
    margin: 0;
    color: var(--adr-ink-3);
    font-size: var(--adr-text-sm);
}

.file-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
}

.file-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
}

.file-row:hover {
    background: var(--adr-surface-1);
}

.file-row > .mdi-file-outline {
    color: var(--adr-ink-3);
    font-size: 17px;
    flex: 0 0 auto;
}

.file-link {
    font-family: var(--adr-font-mono);
    font-size: 13px;
    color: var(--adr-teal);
    text-decoration: none;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-link:hover {
    text-decoration: underline;
}

.file-link.plain {
    color: var(--adr-ink);
}

.missing-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--adr-error);
    font-size: var(--adr-text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    flex: 0 0 auto;
}

.missing-badge .mdi {
    font-size: 15px;
}

.row-del {
    flex: 0 0 34px;
    margin-left: auto;
    display: flex;
    justify-content: center;
    opacity: 0;
    color: var(--adr-ink-3);
    cursor: pointer;
    border: 0;
    background: transparent;
    padding: 0;
}

.file-row:hover .row-del {
    opacity: 1;
}

.row-del:hover {
    color: var(--adr-error);
}

.row-del .mdi {
    font-size: 18px;
}

.add-btn {
    align-self: flex-start;
}
</style>
