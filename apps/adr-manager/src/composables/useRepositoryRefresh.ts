import { readonly, ref } from "vue";
import { describeGitError, loadRepositoryContent, mergeRefreshedRepository } from "@/plugins/git";
import { store } from "@/plugins/store";
import { useToast } from "@/composables/useToast";

// Per-file reads inside one repository load are already parallel, so a wider
// outer fan-out risks tripping the providers' abuse detection.
const CONCURRENT_REFRESHES = 3;

const refreshing = ref(false);
const done = ref(0);
const total = ref(0);
let ranThisSession = false;

interface RefreshTarget {
    fullName: string;
    branch: string;
}

/**
 * Background refresh of all added repositories at startup. Cached content stays
 * visible and editable the whole time; refreshed content is merged in per repo
 * as it arrives, and failures fall back to the cache with an error toast.
 */
export function useRepositoryRefresh() {
    return {
        refreshing: readonly(refreshing),
        done: readonly(done),
        total: readonly(total),
        refreshAllRepositories,
        resetSessionGuard
    };
}

async function refreshAllRepositories(): Promise<void> {
    if (ranThisSession || refreshing.value) {
        return;
    }
    ranThisSession = true;
    const targets: RefreshTarget[] = store.addedRepositories
        .filter((repo) => !repo.transient)
        .map((repo) => ({ fullName: repo.fullName, branch: repo.activeBranch }));
    if (targets.length === 0) {
        return;
    }
    refreshing.value = true;
    done.value = 0;
    total.value = targets.length;

    let nextIndex = 0;
    const worker = async (): Promise<void> => {
        for (let index = nextIndex++; index < targets.length; index = nextIndex++) {
            const target = targets[index];
            if (target) {
                await refreshOne(target);
            }
            done.value++;
        }
    };
    try {
        await Promise.all(Array.from({ length: Math.min(CONCURRENT_REFRESHES, targets.length) }, worker));
    } finally {
        refreshing.value = false;
    }
}

async function refreshOne(target: RefreshTarget): Promise<void> {
    const { showErrorToast } = useToast();
    try {
        const { repository: fresh, failedFiles } = await loadRepositoryContent(target.fullName, target.branch);
        // Look the repository up again at apply time: it may have been removed,
        // or switched to another branch, while the fetch was in flight.
        const cached = store.addedRepositories.find((repo) => repo.fullName === target.fullName);
        if (!cached || cached.transient || cached.activeBranch !== target.branch) {
            return;
        }
        const merged = mergeRefreshedRepository(cached, fresh, failedFiles);
        if (merged) {
            store.updateRepository(merged);
        }
        if (failedFiles.length > 0) {
            showErrorToast(
                `${target.fullName}: couldn't read ${failedFiles.length} ADR file(s), showing cached content.`
            );
        }
    } catch (error) {
        console.error(error);
        showErrorToast(`Couldn't refresh ${target.fullName}: ${describeGitError(error)} Showing cached content.`);
    }
}

/** Allows the next sign-in in the same tab to refresh again. */
function resetSessionGuard(): void {
    ranThisSession = false;
}
