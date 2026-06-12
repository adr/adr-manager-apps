import { ref, watch } from "vue";
import type { ComputedRef } from "vue";
import { describeGitError, getActiveProvider, loadRepositoryContent } from "@/plugins/git";
import { store } from "@/plugins/store";
import { useAlert } from "@/composables/useAlert";
import { useToast } from "@/composables/useToast";
import type { EditorRouteData } from "@/composables/useEditorRouteSync";

/**
 * Drives the branch dropdown in the status bar. Branch names are loaded lazily on
 * click, and switching branches reloads the repository content after confirmation.
 */
export function useBranchSelection(routeData: ComputedRef<EditorRouteData>) {
    const { confirm } = useAlert();
    const { showErrorToast } = useToast();

    const selected = ref("");
    const oldSelected = ref("");
    const branchNames = ref<string[]>([]);
    const currentRepo = ref("");
    const loadedOnClick = ref(false);
    const branchesLoading = ref(false);
    const branchError = ref<string | null>(null);
    const switchingBranch = ref(false);

    watch(routeData, (newRouteData) => {
        loadedOnClick.value = true;
        branchNames.value = newRouteData.branch ? [newRouteData.branch] : [];
        selected.value = newRouteData.branch ?? "";
        oldSelected.value = newRouteData.branch ?? "";
    });

    function setActiveBranch(activeBranch: string): void {
        store.setActiveBranch(activeBranch);
        oldSelected.value = activeBranch;
        selected.value = activeBranch;
    }

    function onSelectedBranch(): void {
        confirm("Do you really want to change branch?")
            .then(() => switchBranch(selected.value))
            .catch(() => {
                selected.value = oldSelected.value;
                store.setActiveBranch(oldSelected.value);
            });
    }

    async function switchBranch(branchName: string): Promise<void> {
        switchingBranch.value = true;
        try {
            const { repository, failedFiles } = await loadRepositoryContent(currentRepo.value, branchName);
            oldSelected.value = branchName;
            store.updateRepository(repository);
            if (failedFiles.length > 0) {
                showErrorToast(`Couldn't read ${failedFiles.length} ADR file(s) on "${branchName}".`);
            }
        } catch (error) {
            console.error(error);
            selected.value = oldSelected.value;
            store.setActiveBranch(oldSelected.value);
            showErrorToast(`Couldn't switch to branch "${branchName}": ${describeGitError(error)}`);
        } finally {
            switchingBranch.value = false;
        }
    }

    async function loadBranchNames(): Promise<void> {
        branchesLoading.value = true;
        branchError.value = null;
        try {
            const branches = await getActiveProvider().listBranches(currentRepo.value);
            branchNames.value = [...new Set(branches.map((branch) => branch.name))];
        } catch (error) {
            console.error(error);
            branchError.value = describeGitError(error);
        } finally {
            branchesLoading.value = false;
        }
    }

    function retryLoadBranches(): void {
        if (currentRepo.value !== "") {
            void loadBranchNames();
        }
    }

    function updateBranches(repoName: string): void {
        loadedOnClick.value = false;
        if (repoName === "") {
            branchNames.value = [];
        } else {
            currentRepo.value = repoName;
            void loadBranchNames();
        }
    }

    function onBranchSelectClick(): void {
        if (currentRepo.value !== "") {
            if (branchNames.value.length === 1 && loadedOnClick.value) {
                currentRepo.value = routeData.value.repoFullName ?? "";
                void loadBranchNames();
            }
        } else if (routeData.value.repoFullName !== undefined) {
            currentRepo.value = routeData.value.repoFullName;
            void loadBranchNames();
        }
    }

    return {
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
    };
}
