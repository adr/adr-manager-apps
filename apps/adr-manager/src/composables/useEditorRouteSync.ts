import { computed, watch } from "vue";
import { useRouter } from "vue-router";
import { store } from "@/plugins/store";

export interface EditorRouteProps {
    repoFullName: string | undefined;
    branch: string | undefined;
    adr: string | undefined;
}

export interface EditorRouteData {
    repoFullName: string | undefined;
    branch: string | undefined;
    adrName: string | undefined;
}

/**
 * Keeps the URL and the store in sync in both directions: store changes push a new
 * route, and route (prop) changes open the matching repository, branch, and ADR.
 */
export function useEditorRouteSync(props: EditorRouteProps) {
    const router = useRouter();

    const routeDataFromStore = computed<EditorRouteData>(() => ({
        repoFullName: store.currentRepository?.fullName,
        branch: store.currentRepository?.activeBranch,
        adrName: store.currentlyEditedAdr?.path.split("/").pop()
    }));

    watch(routeDataFromStore, (newRouteData) => {
        if (
            props.repoFullName === newRouteData.repoFullName &&
            props.branch === newRouteData.branch &&
            props.adr === newRouteData.adrName
        ) {
            return;
        }
        // Push to the named sub-route that actually declares these params (Router 4 discards
        // params that the target route's path doesn't define).
        const [organization, repo] = (newRouteData.repoFullName ?? "").split("/");
        if (organization && repo && newRouteData.branch && newRouteData.adrName) {
            void router.push({
                name: "EditorWithSpecifiedAdr",
                params: { organization, repo, branch: newRouteData.branch, adr: newRouteData.adrName }
            });
        } else if (organization && repo && newRouteData.branch) {
            void router.push({
                name: "EditorWithSpecifiedRepo",
                params: { organization, repo, branch: newRouteData.branch }
            });
        } else {
            void router.push({ name: "EditorUnspecified" });
        }
    });

    watch(
        () => props.repoFullName,
        (newVal) => {
            if (newVal !== undefined && routeDataFromStore.value.repoFullName !== newVal) {
                store.openAdrBy(newVal, props.adr);
            }
        }
    );

    watch(
        () => props.branch,
        (newVal) => {
            if (
                newVal !== undefined &&
                routeDataFromStore.value.branch !== newVal &&
                (store.currentRepository?.branches.some((branch) => branch.name === newVal) ?? false)
            ) {
                store.setActiveBranch(newVal);
            }
        }
    );

    watch(
        () => props.adr,
        (newVal) => {
            if (routeDataFromStore.value.adrName !== newVal && props.repoFullName !== undefined) {
                store.openAdrBy(props.repoFullName, newVal);
            }
        }
    );

    return { routeDataFromStore };
}
