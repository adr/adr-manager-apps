import { store } from "@/plugins/store";
import { Repository } from "@/plugins/classes";
import { naturalCase2snakeCase } from "@/plugins/parser";
import { DEMO_REPO_FULL_NAME } from "@/plugins/tour/constants";

afterEach(() => {
    store.currentlyEditedAdr = undefined;
    store.currentRepository = undefined;
    store.currentRepositoryForCommit = undefined;
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

test("a newly created ADR defaults to the latest MADR template (4.0.0)", () => {
    const repo = new Repository({
        fullName: "acme/decisions",
        activeBranch: "main",
        branches: [],
        adrPath: "docs/decisions/"
    });
    store.addedRepositories = [repo];

    const created = store.createNewAdr(repo);

    expect(created?.editedMd).toContain('<!-- adr-manager-madr-version: "4.0.0" -->');
});

test("editing an existing ADR's title renames its path but keeps the committed baseline", () => {
    const adr = {
        path: "docs/decisions/0000-old-title.md",
        originalPath: "docs/decisions/0000-old-title.md",
        originalMd: "# Old Title\n",
        editedMd: "# Old Title\n",
        id: 0
    };
    const repo = new Repository({
        fullName: "acme/decisions",
        activeBranch: "main",
        branches: [],
        adrs: [adr],
        adrPath: "docs/decisions/"
    });
    store.addedRepositories = [repo];
    store.openAdr(adr);

    store.updateMdOfCurrentAdr("# Brand New Title\n");

    expect(adr.path).toBe(`docs/decisions/0000-${naturalCase2snakeCase("Brand New Title")}.md`);
    expect(adr.editedMd).toBe("# Brand New Title\n");
    // Baseline stays put so the file reads as dirty and the rename can delete the old path on commit.
    expect(adr.originalMd).toBe("# Old Title\n");
    expect(adr.originalPath).toBe("docs/decisions/0000-old-title.md");
});

test("committing a renamed ADR advances its baseline so it is no longer pending", () => {
    const adr = {
        path: "docs/decisions/0000-new-title.md",
        originalPath: "docs/decisions/0000-old-title.md",
        originalMd: "# Old Title\n",
        editedMd: "# New Title\n",
        id: 0
    };
    const repo = new Repository({
        fullName: "acme/decisions",
        activeBranch: "main",
        branches: [],
        adrs: [adr],
        adrPath: "docs/decisions/"
    });
    store.addedRepositories = [repo];
    store.currentRepositoryForCommit = repo;

    store.updateLocalStorageAfterCommit([
        { path: adr.path, type: "changed" },
        { path: adr.originalPath, type: "deleted" }
    ]);

    expect(adr.originalMd).toBe("# New Title\n");
    expect(adr.originalPath).toBe("docs/decisions/0000-new-title.md");
});

test("reload drops a leaked demo repository from localStorage", () => {
    const real = new Repository({ fullName: "acme/decisions", activeBranch: "main", branches: [] });
    const leaked = new Repository({ fullName: DEMO_REPO_FULL_NAME, activeBranch: "main", branches: [] });
    localStorage.setItem("addedRepositories", JSON.stringify([real, leaked]));

    store.reload();

    expect(store.addedRepositories.map((repo) => repo.fullName)).toEqual(["acme/decisions"]);
});
