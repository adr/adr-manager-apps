import { Repository } from "@/plugins/classes";
import { loadRepositoryContent } from "@/plugins/git";
import { useRepositoryRefresh } from "@/composables/useRepositoryRefresh";
import { useToast } from "@/composables/useToast";
import { store } from "@/plugins/store";
import type { RepositoryLoadResult } from "@/plugins/git";

vi.mock("@/plugins/git", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/plugins/git")>();
    return { ...actual, loadRepositoryContent: vi.fn() };
});

const loadContent = vi.mocked(loadRepositoryContent);

function repo(fullName: string, md: string, transient = false): Repository {
    const repository = new Repository({
        fullName,
        activeBranch: "main",
        branches: [],
        adrs: [{ path: "docs/decisions/0001-a.md", originalPath: "docs/decisions/0001-a.md", id: 1, originalMd: md, editedMd: md }],
        adrPath: "docs/decisions/"
    });
    repository.transient = transient;
    return repository;
}

function loadResult(fullName: string, md: string): RepositoryLoadResult {
    return { repository: repo(fullName, md), failedFiles: [] };
}

beforeEach(() => {
    vi.clearAllMocks();
    useRepositoryRefresh().resetSessionGuard();
    store.addedRepositories = [];
    localStorage.clear();
});

afterEach(() => {
    store.currentlyEditedAdr = undefined;
    store.currentRepository = undefined;
    store.addedRepositories = [];
    localStorage.clear();
});

test("refresh skips transient repos, merges fresh content, and toasts per failed repo", async () => {
    store.addedRepositories = [repo("acme/a", "cached a"), repo("acme/b", "cached b"), repo("tour/demo", "demo", true)];
    loadContent.mockImplementation(async (fullName) => {
        if (fullName === "acme/a") {
            throw Object.assign(new Error("network down"), { isAxiosError: true });
        }
        return loadResult(fullName, "fresh remote content");
    });

    await useRepositoryRefresh().refreshAllRepositories();

    expect(loadContent).toHaveBeenCalledTimes(2);
    expect(loadContent).not.toHaveBeenCalledWith("tour/demo", expect.anything());

    const repoA = store.addedRepositories.find((entry) => entry.fullName === "acme/a");
    const repoB = store.addedRepositories.find((entry) => entry.fullName === "acme/b");
    expect(repoA?.adrs[0]?.originalMd).toBe("cached a");
    expect(repoB?.adrs[0]?.originalMd).toBe("fresh remote content");
    expect(localStorage.getItem("addedRepositories")).toContain("fresh remote content");

    expect(useToast().toast.value?.variant).toBe("error");
    expect(useToast().toast.value?.text).toContain("acme/a");
    expect(useRepositoryRefresh().refreshing.value).toBe(false);
});

test("refresh runs only once per session", async () => {
    store.addedRepositories = [repo("acme/a", "cached a")];
    loadContent.mockResolvedValue(loadResult("acme/a", "fresh"));

    const refresh = useRepositoryRefresh();
    await refresh.refreshAllRepositories();
    await refresh.refreshAllRepositories();

    expect(loadContent).toHaveBeenCalledTimes(1);
});

test("a repo that switched branch while the fetch was in flight is not merged", async () => {
    store.addedRepositories = [repo("acme/a", "cached a")];
    loadContent.mockImplementation(async () => {
        const cached = store.addedRepositories[0];
        if (cached) {
            cached.activeBranch = "feature";
        }
        return loadResult("acme/a", "fresh from main");
    });

    await useRepositoryRefresh().refreshAllRepositories();

    expect(store.addedRepositories[0]?.adrs[0]?.originalMd).toBe("cached a");
});

test("at most three repositories are fetched concurrently", async () => {
    const names = ["r/1", "r/2", "r/3", "r/4", "r/5"];
    store.addedRepositories = names.map((name) => repo(name, "cached"));

    const pending: Array<() => void> = [];
    loadContent.mockImplementation(
        (fullName) =>
            new Promise<RepositoryLoadResult>((resolve) => {
                pending.push(() => resolve(loadResult(fullName, "fresh")));
            })
    );

    const run = useRepositoryRefresh().refreshAllRepositories();
    expect(loadContent).toHaveBeenCalledTimes(3);

    while (pending.length > 0) {
        pending.shift()?.();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    }
    await run;

    expect(loadContent).toHaveBeenCalledTimes(5);
    expect(useRepositoryRefresh().done.value).toBe(5);
});
