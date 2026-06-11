import { matchesIgnoringFormatting } from "@adr-manager/core";
import { Repository } from "@/plugins/classes";
import { adr2md, md2adr } from "@/plugins/parser";
import { store } from "@/plugins/store";
import { DEMO_REPO_FULL_NAME } from "@/plugins/tour/constants";
import { buildDemoRepository, injectDemo, snapshotEditorState, teardownDemo } from "@/plugins/tour/demoRepository";

afterEach(() => {
    store.currentlyEditedAdr = undefined;
    store.currentRepository = undefined;
    store.addedRepositories = [];
    store.mode = "basic";
    localStorage.clear();
});

test("the demo ADR round-trips through the MADR parser", () => {
    const repo = buildDemoRepository();
    const md = repo.adrs[0]?.editedMd ?? "";
    // A failed round-trip would open the demo in the convert view and break the tour anchors.
    expect(matchesIgnoringFormatting(md, adr2md(md2adr(md)))).toBe(true);
});

test("the demo repository is transient and opens its sample ADR", () => {
    const snapshot = snapshotEditorState();
    const repo = injectDemo();

    expect(repo.transient).toBe(true);
    // The reactive store returns proxies, so compare structurally rather than by identity.
    expect(store.currentRepository).toStrictEqual(repo);
    expect(store.currentlyEditedAdr).toStrictEqual(repo.adrs[0]);

    teardownDemo(snapshot);
});

test("editing the demo ADR never persists it to localStorage", () => {
    const snapshot = snapshotEditorState();
    injectDemo();

    // What the useAdrEditor markdown watcher does on every edit.
    store.updateMdOfCurrentAdr("# Changed title\n");

    expect(localStorage.getItem("addedRepositories") ?? "").not.toContain(DEMO_REPO_FULL_NAME);

    teardownDemo(snapshot);
    expect(localStorage.getItem("addedRepositories") ?? "").not.toContain(DEMO_REPO_FULL_NAME);
});

test("teardown removes the demo and restores the previous editor state", () => {
    const realAdr = { path: "docs/decisions/0001-real.md", originalMd: "# Real\n", editedMd: "# Real\n", id: 1 };
    const realRepo = new Repository({
        fullName: "acme/decisions",
        activeBranch: "main",
        branches: [],
        adrs: [realAdr],
        adrPath: "docs/decisions/"
    });
    store.addedRepositories = [realRepo];
    store.currentRepository = realRepo;
    store.currentlyEditedAdr = realAdr;
    store.mode = "professional";

    const snapshot = snapshotEditorState();
    injectDemo();
    store.mode = "basic";

    teardownDemo(snapshot);

    expect(store.addedRepositories).toEqual([realRepo]);
    expect(store.currentRepository).toStrictEqual(realRepo);
    expect(store.currentlyEditedAdr).toStrictEqual(realAdr);
    expect(store.mode).toBe("professional");
});

test("teardown over an empty workspace returns to the empty state", () => {
    const snapshot = snapshotEditorState();
    injectDemo();

    teardownDemo(snapshot);

    expect(store.addedRepositories).toEqual([]);
    expect(store.currentRepository).toBeUndefined();
    expect(store.currentlyEditedAdr).toBeUndefined();
});
