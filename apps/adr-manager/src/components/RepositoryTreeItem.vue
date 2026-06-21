<template>
    <div class="repo" :class="{ open }">
        <div class="repo-head" data-cy="repoHead" @click="emit('select')">
            <span class="mdi mdi-chevron-right chev" aria-hidden="true"></span>
            <span class="mdi mdi-source-repository rico" aria-hidden="true"></span>
            <span class="repo-name">
                <span class="owner">{{ owner }}/</span>{{ shortName }}
            </span>
            <span class="repo-acts" @click.stop>
                <button
                    type="button"
                    class="icon-btn"
                    data-cy="pushIcon"
                    title="Commit and push"
                    @click="emit('commit')"
                >
                    <span class="mdi mdi-publish" aria-hidden="true"></span>
                </button>
                <button
                    type="button"
                    class="icon-btn danger"
                    data-cy="removeRepo"
                    title="Remove repository"
                    @click="emit('remove')"
                >
                    <span class="mdi mdi-close" aria-hidden="true"></span>
                </button>
            </span>
        </div>

        <div v-if="open" class="adr-files">
            <div
                v-for="file in visibleAdrs"
                :key="file.path"
                data-cy="adrList"
                class="adr-file"
                :class="{ active: file === activeAdr }"
                :title="file.path"
                @click="emit('open-file', file)"
            >
                <span class="mdi mdi-file-document-outline fico" aria-hidden="true"></span>
                <span class="fname">
                    <span class="fname-text">{{ fileLabel(file) }}</span>
                    <span v-if="isDirty(file)" class="fstar">*</span>
                </span>
                <button
                    type="button"
                    class="icon-btn danger file-del"
                    data-cy="deleteAdrBtn"
                    title="Delete ADR"
                    @click.stop="emit('delete-adr', file)"
                >
                    <span class="mdi mdi-delete-outline" aria-hidden="true"></span>
                </button>
            </div>

            <button
                v-if="hiddenCount > 0"
                type="button"
                class="adr-show-more"
                data-cy="adrShowMore"
                @click.stop="expanded = true"
            >
                <span class="mdi mdi-chevron-down" aria-hidden="true"></span>
                {{ hiddenCount }} more
            </button>
            <button
                v-else-if="expanded"
                type="button"
                class="adr-show-more"
                data-cy="adrShowLess"
                @click.stop="expanded = false"
            >
                <span class="mdi mdi-chevron-up" aria-hidden="true"></span>
                Show less
            </button>

            <button type="button" data-cy="newADR" class="adr-new" @click.prevent.stop="emit('new-adr')">
                <span class="mdi mdi-plus" aria-hidden="true"></span>
                New ADR
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { sortedAdrs, fileLabel, isDirty } from "@/utils/adrFiles";
import type { Repository } from "@/plugins/classes";
import type { AdrFile } from "@/types/adr";

const PAGE_SIZE = 10;

const props = defineProps<{
    repo: Repository;
    open: boolean;
    activeAdr: AdrFile | null;
    /** Pre-filtered list from RepositoryExplorer when a search is active. Undefined = show all. */
    filteredAdrs?: AdrFile[];
}>();

// Full candidate list. Filtered when search is active, sorted full list otherwise.
const allAdrs = computed(() => props.filteredAdrs ?? sortedAdrs(props.repo));

// When a search is active we show every match; pagination only applies to the full list.
const paginated = computed(() => props.filteredAdrs !== undefined);

const expanded = ref(false);

// Collapse back to PAGE_SIZE whenever the underlying list changes (e.g. new search).
watch(allAdrs, () => {
    expanded.value = false;
});

const visibleAdrs = computed(() =>
    paginated.value || expanded.value ? allAdrs.value : allAdrs.value.slice(0, PAGE_SIZE)
);

const hiddenCount = computed(() =>
    paginated.value || expanded.value ? 0 : Math.max(0, allAdrs.value.length - PAGE_SIZE)
);

const emit = defineEmits<{
    select: [];
    "open-file": [AdrFile];
    commit: [];
    remove: [];
    "delete-adr": [AdrFile];
    "new-adr": [];
}>();

const owner = computed(() => props.repo.fullName.split("/")[0] ?? "");
const shortName = computed(() => props.repo.fullName.split("/").slice(1).join("/"));
</script>

<style scoped>
.repo {
    margin-bottom: 2px;
}

.repo-head {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 38px;
    padding: 0 6px 0 8px;
    border-radius: 7px;
    cursor: pointer;
    color: var(--adr-ink);
    user-select: none;
}

.repo-head:hover {
    background: var(--adr-surface-2);
}

.repo-head .chev {
    font-size: 18px;
    color: var(--adr-ink-3);
    transition: transform 0.14s;
    flex: 0 0 auto;
}

.repo.open .repo-head .chev {
    transform: rotate(90deg);
}

.repo-head .rico {
    font-size: 18px;
    color: var(--adr-ink-2);
    flex: 0 0 auto;
}

.repo-name {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.repo-name .owner {
    color: var(--adr-ink-3);
    font-weight: 500;
}

.repo-acts {
    display: flex;
    align-items: center;
    gap: 0;
    opacity: 0;
    flex: 0 0 auto;
}

.repo-head:hover .repo-acts {
    opacity: 1;
}

.repo-acts .icon-btn {
    width: 26px;
    height: 26px;
}

.repo-acts .icon-btn .mdi {
    font-size: 15px;
}

/* ---- ADR file list ---- */
.adr-files {
    padding: 2px 0 4px 0;
    margin-left: 13px;
    border-left: 1px solid var(--adr-line);
}

.adr-file {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 4px 0 12px;
    margin-left: 5px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--adr-ink-2);
    position: relative;
}

.adr-file:hover {
    background: var(--adr-surface-2);
    color: var(--adr-ink);
}

.adr-file.active {
    background: var(--adr-teal-050);
    color: var(--adr-teal);
    font-weight: 600;
}

.adr-file.active::before {
    content: "";
    position: absolute;
    left: -6px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    border-radius: 2px;
    background: var(--adr-teal);
}

.adr-file .fico {
    font-size: 15px;
    flex: 0 0 auto;
    color: var(--adr-ink-3);
}

.adr-file.active .fico {
    color: var(--adr-teal);
}

.adr-file .fname {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 12.5px;
    font-family: var(--adr-font-mono);
    letter-spacing: -0.01em;
}

.adr-file .fname-text {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.adr-file .fstar {
    flex: 0 0 auto;
    color: var(--adr-warning);
    font-weight: 700;
}

.file-del {
    width: 24px;
    height: 24px;
    flex: 0 0 auto;
    opacity: 0;
}

.file-del .mdi {
    font-size: 15px;
}

.adr-file:hover .file-del {
    opacity: 1;
}

.adr-show-more {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 26px;
    padding: 0 8px 0 12px;
    margin: 1px 0 0 5px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--adr-ink-3);
    font-size: 11.5px;
    font-weight: 600;
    background: transparent;
    border: 0;
    font-family: inherit;
    width: calc(100% - 5px);
    white-space: nowrap;
}

.adr-show-more:hover {
    background: var(--adr-surface-2);
    color: var(--adr-ink-2);
}

.adr-show-more .mdi {
    font-size: 14px;
}

.adr-new {
    display: flex;
    align-items: center;
    gap: 7px;
    height: 30px;
    padding: 0 8px 0 12px;
    margin: 2px 0 0 5px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--accent-600);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2px;
    background: transparent;
    border: 0;
    font-family: inherit;
    width: calc(100% - 5px);
    white-space: nowrap;
    text-transform: uppercase;
}

.adr-new:hover {
    background: var(--accent-050);
}

.adr-new .mdi {
    font-size: 16px;
}
</style>
