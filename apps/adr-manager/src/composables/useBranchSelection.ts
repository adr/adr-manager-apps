import { ref, watch } from "vue";
import type { ComputedRef } from "vue";
import { getActiveProvider, loadRepositoryContent } from "@/plugins/git";
import { store } from "@/plugins/store";
import { useAlert } from "@/composables/useAlert";
import type { EditorRouteData } from "@/composables/useEditorRouteSync";

/**
 * Drives the branch dropdown in the status bar. Branch names are loaded lazily on
 * click, and switching branches reloads the repository content after confirmation.
 */
export function useBranchSelection(routeData: ComputedRef<EditorRouteData>) {
    const { confirm } = useAlert();

    const selected = ref("");
    const oldSelected = ref("");
    const branchNames = ref<string[]>([]);
    const currentRepo = ref("");
    const loadedOnClick = ref(false);

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
            .then(() => {
                loadRepositoryContent(currentRepo.value, selected.value).then((repoObject) => {
                    oldSelected.value = selected.value;
                    store.updateRepository(repoObject);
                });
            })
            .catch(() => {
                selected.value = oldSelected.value;
                store.setActiveBranch(oldSelected.value);
            });
    }

    function loadBranchNames(): void {
        getActiveProvider()
            .listBranches(currentRepo.value)
            .then((branches) => {
                if (!branches) {
                    return;
                }
                branchNames.value = [...new Set(branches.map((branch) => branch.name))];
            });
    }

    function updateBranches(repoName: string): void {
        loadedOnClick.value = false;
        if (repoName === "") {
            branchNames.value = [];
        } else {
            currentRepo.value = repoName;
            loadBranchNames();
        }
    }

    function onBranchSelectClick(): void {
        if (currentRepo.value !== "") {
            if (branchNames.value.length === 1 && loadedOnClick.value) {
                currentRepo.value = routeData.value.repoFullName ?? "";
                loadBranchNames();
            }
        } else if (routeData.value.repoFullName !== undefined) {
            currentRepo.value = routeData.value.repoFullName;
            loadBranchNames();
        }
    }

    return { selected, branchNames, setActiveBranch, onSelectedBranch, updateBranches, onBranchSelectClick };
}
