<template>
    <BaseDialog v-model="show" title="Select Relevant Files" icon="file-link" :width="700">
        <template #header-extra>
            <div class="search-wrap">
                <input v-model="searchText" data-cy="relevantFilesSearch" class="field" placeholder="Search files…" />
                <span class="mdi mdi-magnify search-icon" aria-hidden="true"></span>
            </div>
            <button
                type="button"
                class="btn btn-outline refresh-btn"
                title="Reload the file listing"
                data-cy="relevantFilesRefresh"
                :disabled="loading"
                @click="reload"
            >
                <span class="mdi mdi-refresh" aria-hidden="true"></span>
            </button>
        </template>

        <div class="progress" :class="{ active: loading }"></div>

        <div v-if="loading" class="status" role="status" aria-live="polite">
            <span class="mdi mdi-loading mdi-spin" aria-hidden="true"></span>
            Loading the repository files…
        </div>

        <div v-else-if="errorMessage" data-cy="relevantFilesError" class="error-block">
            <span class="mdi mdi-alert-circle" aria-hidden="true"></span>
            <span class="error-text">{{ errorMessage }}</span>
            <button type="button" data-cy="relevantFilesRetry" class="btn btn-outline" @click="reload">
                <span class="mdi mdi-refresh" aria-hidden="true"></span>
                Retry
            </button>
        </div>

        <template v-else-if="files">
            <ul v-if="missingSelected.length > 0" class="file-list missing-list">
                <li v-for="path in missingSelected" :key="path" data-cy="relevantFilesMissingRow">
                    <label class="file-row">
                        <input type="checkbox" :checked="checked.has(path)" @change="toggle(path)" />
                        <span class="mdi mdi-alert" aria-hidden="true"></span>
                        <span class="file-name missing">{{ path }}</span>
                        <span class="missing-tag">not found</span>
                    </label>
                </li>
            </ul>

            <ul v-if="searchText.trim() !== ''" class="file-list" data-cy="relevantFilesResults">
                <li v-if="searchResults.length === 0" class="empty-row">No files match "{{ searchText }}"</li>
                <li v-for="path in searchResults" :key="path">
                    <label class="file-row">
                        <input type="checkbox" :checked="checked.has(path)" @change="toggle(path)" />
                        <span class="mdi mdi-file-outline" aria-hidden="true"></span>
                        <span class="file-name">{{ path }}</span>
                    </label>
                </li>
                <li v-if="searchTruncated" class="empty-row">Refine the search to see more matches…</li>
            </ul>

            <ul v-else class="file-list" data-cy="relevantFilesTree">
                <li v-for="row in visibleTreeRows" :key="row.path">
                    <button
                        v-if="!row.isFile"
                        type="button"
                        class="file-row folder-row"
                        :style="{ paddingLeft: `${row.depth * 18 + 8}px` }"
                        @click="toggleFolder(row.path)"
                    >
                        <span
                            class="mdi"
                            :class="expanded.has(row.path) ? 'mdi-chevron-down' : 'mdi-chevron-right'"
                            aria-hidden="true"
                        ></span>
                        <span class="mdi mdi-folder-outline" aria-hidden="true"></span>
                        <span class="file-name">{{ row.name }}</span>
                    </button>
                    <label v-else class="file-row" :style="{ paddingLeft: `${row.depth * 18 + 8}px` }">
                        <input type="checkbox" :checked="checked.has(row.path)" @change="toggle(row.path)" />
                        <span class="mdi mdi-file-outline" aria-hidden="true"></span>
                        <span class="file-name">{{ row.name }}</span>
                    </label>
                </li>
            </ul>
        </template>

        <div class="selected-head">
            <h3 class="selected-title">Selected files</h3>
            <span class="selected-count" data-cy="relevantFilesCount">{{ checked.size }}</span>
        </div>

        <template #actions>
            <button type="button" data-cy="relevantFilesApply" class="btn btn-text-success" @click="apply">
                Apply
            </button>
            <button type="button" class="btn btn-text-error" @click="show = false">Cancel</button>
        </template>
    </BaseDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BaseDialog from "./BaseDialog.vue";
import { describeGitError } from "@/plugins/git";
import { fetchFileList, invalidateFileList } from "@/plugins/git/fileListCache";

interface TreeRow {
    name: string;
    path: string;
    depth: number;
    isFile: boolean;
}

interface TreeNode {
    name: string;
    path: string;
    isFile: boolean;
    children: TreeNode[];
}

const MAX_SEARCH_RESULTS = 200;

const props = defineProps<{ repoFullName: string; branch: string; selected: string[] }>();
const emit = defineEmits<{ apply: [files: string[]] }>();

const show = defineModel<boolean>({ default: false });

const files = ref<string[] | undefined>(undefined);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const searchText = ref("");
const checked = ref(new Set<string>());
const expanded = ref(new Set<string>());

watch(
    show,
    (open) => {
        if (open) {
            checked.value = new Set(props.selected);
            searchText.value = "";
            load();
        }
    },
    { immediate: true }
);

async function load(): Promise<void> {
    loading.value = true;
    errorMessage.value = null;
    try {
        files.value = await fetchFileList(props.repoFullName, props.branch);
    } catch (error) {
        console.error(error);
        files.value = undefined;
        errorMessage.value = describeGitError(error);
    } finally {
        loading.value = false;
    }
}

function reload(): void {
    invalidateFileList(props.repoFullName, props.branch);
    load();
}

const missingSelected = computed(() => {
    if (!files.value) {
        return [];
    }
    const present = new Set(files.value);
    return [...checked.value].filter((path) => !present.has(path)).sort();
});

const searchResults = computed(() => {
    const query = searchText.value.trim().toLowerCase();
    if (!files.value || query === "") {
        return [];
    }
    return files.value.filter((path) => path.toLowerCase().includes(query)).slice(0, MAX_SEARCH_RESULTS + 1);
});

const searchTruncated = computed(() => searchResults.value.length > MAX_SEARCH_RESULTS);

/** The file listing as a nested tree, folders before files, both sorted by name. */
function buildTree(paths: string[]): TreeNode[] {
    interface MutableNode {
        name: string;
        path: string;
        isFile: boolean;
        children: Map<string, MutableNode>;
    }
    const root: MutableNode = { name: "", path: "", isFile: false, children: new Map() };
    for (const path of paths) {
        const segments = path.split("/");
        let node = root;
        segments.forEach((segment, index) => {
            let child = node.children.get(segment);
            if (!child) {
                child = {
                    name: segment,
                    path: segments.slice(0, index + 1).join("/"),
                    isFile: index === segments.length - 1,
                    children: new Map()
                };
                node.children.set(segment, child);
            }
            node = child;
        });
    }
    const toSorted = (node: MutableNode): TreeNode => ({
        name: node.name,
        path: node.path,
        isFile: node.isFile,
        children: [...node.children.values()]
            .sort((a, b) => Number(a.isFile) - Number(b.isFile) || a.name.localeCompare(b.name))
            .map(toSorted)
    });
    return toSorted(root).children;
}

const tree = computed(() => (files.value ? buildTree(files.value) : []));

const visibleTreeRows = computed<TreeRow[]>(() => {
    const rows: TreeRow[] = [];
    const visit = (nodes: TreeNode[], depth: number): void => {
        for (const node of nodes) {
            rows.push({ name: node.name, path: node.path, depth, isFile: node.isFile });
            if (!node.isFile && expanded.value.has(node.path)) {
                visit(node.children, depth + 1);
            }
        }
    };
    visit(tree.value, 0);
    return rows;
});

function toggle(path: string): void {
    if (checked.value.has(path)) {
        checked.value.delete(path);
    } else {
        checked.value.add(path);
    }
}

function toggleFolder(path: string): void {
    if (expanded.value.has(path)) {
        expanded.value.delete(path);
    } else {
        expanded.value.add(path);
    }
}

function apply(): void {
    emit("apply", [...checked.value].sort());
    show.value = false;
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

.refresh-btn {
    flex: 0 0 auto;
    height: 36px;
    padding: 0 10px;
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

.file-list {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
    max-height: 320px;
    overflow-y: auto;
    border: 1px solid var(--adr-line);
    border-radius: var(--adr-radius-md);
}

.missing-list {
    max-height: 120px;
    border-color: var(--adr-error);
}

.file-row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    cursor: pointer;
    border: 0;
    background: transparent;
    font: inherit;
    color: var(--adr-ink);
    text-align: left;
}

.file-row:hover {
    background: var(--adr-surface-2);
}

.file-row .mdi {
    color: var(--adr-ink-3);
    font-size: 17px;
    flex: 0 0 auto;
}

.missing-list .mdi-alert {
    color: var(--adr-error);
}

.file-name {
    font-size: 13px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-name.missing {
    color: var(--adr-ink-2);
    text-decoration: line-through;
}

.missing-tag {
    margin-left: auto;
    color: var(--adr-error);
    font-size: var(--adr-text-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.empty-row {
    padding: 10px 12px;
    color: var(--adr-ink-3);
    font-size: 13px;
}

.selected-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0 0;
    padding-top: 12px;
    border-top: 1px solid var(--adr-line);
}

.selected-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--adr-ink-2);
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.selected-count {
    background: var(--accent-050);
    color: var(--accent-600);
    font-size: var(--adr-text-xs);
    font-weight: 700;
    border-radius: 999px;
    padding: 1px 8px;
}
</style>
