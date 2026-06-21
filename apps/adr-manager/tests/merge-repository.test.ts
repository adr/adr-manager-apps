import { Repository } from "@/plugins/classes";
import { mergeRefreshedRepository } from "@/plugins/git";
import type { AdrFile } from "@/types/adr";

function adr(path: string, originalMd: string, editedMd = originalMd): AdrFile {
    const parsedId = Number(path.split("/").pop()?.split("-")[0]);
    return { path, originalPath: path, id: Number.isNaN(parsedId) ? -1 : parsedId, originalMd, editedMd };
}

function repo(adrs: AdrFile[], adrPath = "docs/decisions/"): Repository {
    return new Repository({
        fullName: "acme/decisions",
        activeBranch: "main",
        branches: [],
        adrs,
        adrPath
    });
}

test("a clean cached ADR is replaced by the fresh content", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "old")]);
    const fresh = repo([adr("docs/decisions/0001-a.md", "new from remote")]);

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged).not.toBeNull();
    expect(merged?.adrs).toHaveLength(1);
    expect(merged?.adrs[0]?.originalMd).toBe("new from remote");
    expect(merged?.adrs[0]?.editedMd).toBe("new from remote");
});

test("a dirty cached ADR keeps its local edit on top of the fresh base", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "base", "local edit")]);
    const fresh = repo([adr("docs/decisions/0001-a.md", "remote edit")]);

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged?.adrs[0]?.originalMd).toBe("remote edit");
    expect(merged?.adrs[0]?.editedMd).toBe("local edit");
});

test("a dirty ADR whose edit reached the remote becomes clean", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "base", "committed elsewhere")]);
    const fresh = repo([adr("docs/decisions/0001-a.md", "committed elsewhere")]);

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged?.adrs[0]?.originalMd).toBe("committed elsewhere");
    expect(merged?.adrs[0]?.editedMd).toBe("committed elsewhere");
});

test("a locally added ADR absent remotely is carried over as added", () => {
    const added: AdrFile = { ...adr("docs/decisions/0002-new.md", "", "draft"), newAdr: true };
    const cached = repo([adr("docs/decisions/0001-a.md", "base"), added]);
    cached.addedAdrs.push(added);
    const fresh = repo([adr("docs/decisions/0001-a.md", "base changed remotely")]);

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged).not.toBeNull();
    const carried = merged?.adrs.find((file) => file.path === added.path);
    expect(carried?.newAdr).toBe(true);
    expect(carried?.editedMd).toBe("draft");
    expect(merged?.addedAdrs).toHaveLength(1);
    // The same object must sit in both lists, constructFromString relies on it.
    expect(merged?.addedAdrs[0]).toBe(carried);
});

test("a locally added ADR that now exists remotely adopts the remote base", () => {
    const added: AdrFile = { ...adr("docs/decisions/0002-new.md", "", "draft"), newAdr: true };
    const cached = repo([added]);
    cached.addedAdrs.push(added);
    const fresh = repo([adr("docs/decisions/0002-new.md", "remote version")]);

    const merged = mergeRefreshedRepository(cached, fresh, []);

    const adopted = merged?.adrs[0];
    expect(adopted?.originalMd).toBe("remote version");
    expect(adopted?.editedMd).toBe("draft");
    expect(adopted?.newAdr).toBeUndefined();
    expect(merged?.addedAdrs).toHaveLength(0);
});

test("a pending deletion stays pending while the file exists remotely", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "base")]);
    cached.deletedAdrs.push(adr("docs/decisions/0002-b.md", "doomed"));
    const fresh = repo([adr("docs/decisions/0001-a.md", "base"), adr("docs/decisions/0002-b.md", "doomed")]);

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged).toBeNull();
});

test("a pending deletion is dropped when the file is gone remotely", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "base")]);
    cached.deletedAdrs.push(adr("docs/decisions/0002-b.md", "doomed"));
    const fresh = repo([adr("docs/decisions/0001-a.md", "base")]);

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged).not.toBeNull();
    expect(merged?.deletedAdrs).toHaveLength(0);
});

test("a remotely deleted but locally dirty ADR is preserved as a new addition", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "base", "important local work")]);
    const fresh = repo([], "");

    const merged = mergeRefreshedRepository(cached, fresh, []);

    const resurrected = merged?.adrs[0];
    expect(resurrected?.originalMd).toBe("");
    expect(resurrected?.editedMd).toBe("important local work");
    expect(resurrected?.newAdr).toBe(true);
    expect(merged?.addedAdrs[0]).toBe(resurrected);
});

test("a remotely deleted clean ADR is dropped", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "stale")]);
    const fresh = repo([], "");

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged?.adrs).toHaveLength(0);
});

test("a failed file read never clobbers the cached content", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "base", "local edit")]);
    const fresh = repo([adr("docs/decisions/0001-a.md", "")]);

    const merged = mergeRefreshedRepository(cached, fresh, ["docs/decisions/0001-a.md"]);

    expect(merged).toBeNull();
});

test("an unchanged repository merges to null", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "same")]);
    const fresh = repo([adr("docs/decisions/0001-a.md", "same")]);

    expect(mergeRefreshedRepository(cached, fresh, [])).toBeNull();
});

test("a known adrPath is not degraded when the remote has no ADRs left", () => {
    const cached = repo([adr("docs/adr/0001-a.md", "base")], "docs/adr/");
    const fresh = repo([], "docs/decisions/");

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged?.adrPath).toBe("docs/adr/");
});

test("a new remote ADR appears in the merged repository", () => {
    const cached = repo([adr("docs/decisions/0001-a.md", "base")]);
    const fresh = repo([adr("docs/decisions/0001-a.md", "base"), adr("docs/decisions/0002-b.md", "brand new")]);

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged?.adrs.map((file) => file.path)).toEqual(["docs/decisions/0001-a.md", "docs/decisions/0002-b.md"]);
});

// A locally renamed ADR whose new name is `path` and committed name is `originalPath`.
function renamed(newPath: string, oldPath: string, originalMd: string, editedMd: string): AdrFile {
    const parsedId = Number(newPath.split("/").pop()?.split("-")[0]);
    return { path: newPath, originalPath: oldPath, id: Number.isNaN(parsedId) ? -1 : parsedId, originalMd, editedMd };
}

test("a pending rename matches its remote file by committed path instead of duplicating it", () => {
    const cached = repo([renamed("docs/decisions/0001-new.md", "docs/decisions/0001-old.md", "# Old\n", "# New\n")]);
    // Remote still has the file at its old path, with an upstream edit so the merge is not a no-op.
    const fresh = repo([adr("docs/decisions/0001-old.md", "# Old\n\nupstream.\n")]);

    const merged = mergeRefreshedRepository(cached, fresh, []);

    expect(merged?.adrs).toHaveLength(1);
    expect(merged?.addedAdrs).toHaveLength(0);
    const file = merged?.adrs[0];
    expect(file?.path).toBe("docs/decisions/0001-new.md");
    expect(file?.originalPath).toBe("docs/decisions/0001-old.md");
    expect(file?.editedMd).toBe("# New\n");
    expect(file?.originalMd).toBe("# Old\n\nupstream.\n");
});

test("a pending rename against unchanged remote content is a no-op (no orphan, no duplicate)", () => {
    const cached = repo([renamed("docs/decisions/0001-new.md", "docs/decisions/0001-old.md", "# Old\n", "# New\n")]);
    const fresh = repo([adr("docs/decisions/0001-old.md", "# Old\n")]);

    // The cached repo already represents the rename correctly, so nothing changes.
    expect(mergeRefreshedRepository(cached, fresh, [])).toBeNull();
});
