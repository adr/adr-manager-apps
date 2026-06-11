import { store } from "@/plugins/store";
import { Repository } from "@/plugins/classes";
import { DEMO_REPO_FULL_NAME } from "@/plugins/tour/constants";

afterEach(() => {
    store.currentlyEditedAdr = undefined;
    store.currentRepository = undefined;
    store.addedRepositories = [];
    localStorage.clear();
});

test("store starts in basic mode and reacts to setMode (persisting to localStorage)", () => {
    expect(store.mode).toBe("basic");

    store.setMode("professional");
    expect(store.mode).toBe("professional");
    expect(localStorage.getItem("mode")).toBe("professional");

    store.setMode("basic");
    expect(store.mode).toBe("basic");
});

test("store starts with no repositories or edited ADR", () => {
    expect(store.addedRepositories).toEqual([]);
    expect(store.currentlyEditedAdr).toBeUndefined();
});

test("transient repositories are never written to localStorage", () => {
    const real = new Repository({ fullName: "acme/decisions", activeBranch: "main", branches: [] });
    const demo = new Repository({ fullName: DEMO_REPO_FULL_NAME, activeBranch: "main", branches: [] });
    demo.transient = true;
    store.addedRepositories = [real, demo];

    store.updateLocalStorageRepositories();

    const stored = localStorage.getItem("addedRepositories") ?? "";
    expect(stored).toContain("acme/decisions");
    expect(stored).not.toContain(DEMO_REPO_FULL_NAME);
});

test("reload drops a leaked demo repository from localStorage", () => {
    const real = new Repository({ fullName: "acme/decisions", activeBranch: "main", branches: [] });
    const leaked = new Repository({ fullName: DEMO_REPO_FULL_NAME, activeBranch: "main", branches: [] });
    localStorage.setItem("addedRepositories", JSON.stringify([real, leaked]));

    store.reload();

    expect(store.addedRepositories.map((repo) => repo.fullName)).toEqual(["acme/decisions"]);
});
