/**
 * Demo state for the first-time tour. While the tour runs over an empty workspace,
 * a transient repository with one sample ADR is pushed into the store so every tour
 * step can point at real UI. It is removed on teardown and (via the `transient`
 * filter in the store) never written to localStorage.
 */
import { Repository } from "@/plugins/classes";
import { serializeMadr } from "@/plugins/parser";
import { store } from "@/plugins/store";
import { DEMO_REPO_FULL_NAME } from "@/plugins/tour/constants";
import type { AdrFile } from "@/types/adr";
import type { Mode } from "@/types/store";
import { buildPrimaryDemoAdrFixture, setTagsInMd } from "@adr-manager/core";

export interface TourSnapshot {
    currentRepository: Repository | undefined;
    currentlyEditedAdr: AdrFile | undefined;
    mode: Mode;
}

/**
 * The markdown is serialized from the shared demo fixture (never hand-written)
 * so it survives the round-trip check in useAdrEditor and opens in the form editor
 * instead of the convert view. Professional-only fields (drivers, consequences) are
 * populated so the Basic/Professional tour step visibly reveals content.
 */
export function buildDemoRepository(): Repository {
    const fixture = buildPrimaryDemoAdrFixture();
    const md = setTagsInMd(serializeMadr(fixture.record, fixture.templateVersion), fixture.tags);
    const path = `docs/decisions/${fixture.fileName}`;
    const adrFile: AdrFile = {
        originalMd: md,
        editedMd: md,
        id: 1,
        path,
        originalPath: path
    };
    const repo = new Repository({
        fullName: DEMO_REPO_FULL_NAME,
        activeBranch: "main",
        branches: [{ name: "main" }],
        adrs: [adrFile],
        adrPath: "docs/decisions/"
    });
    repo.transient = true;
    return repo;
}

export function snapshotEditorState(): TourSnapshot {
    return {
        currentRepository: store.currentRepository,
        currentlyEditedAdr: store.currentlyEditedAdr,
        mode: store.mode
    };
}

export function injectDemo(): Repository {
    const repo = buildDemoRepository();
    // Bypasses addRepositories(): the demo must not be persisted and must not
    // trigger ensureSomeAdrIsOpened side effects.
    store.addedRepositories.push(repo);
    const sampleAdr = repo.adrs[0];
    if (sampleAdr) {
        store.openAdr(sampleAdr);
    }
    return repo;
}

export function teardownDemo(snapshot: TourSnapshot): void {
    store.addedRepositories = store.addedRepositories.filter((repo) => !repo.transient);
    const restored = snapshot.currentlyEditedAdr;
    store.currentRepository = snapshot.currentRepository;
    store.currentlyEditedAdr =
        restored && store.addedRepositories.some((repo) => repo.adrs.includes(restored)) ? restored : undefined;
    // Direct assignment: setMode would persist, but localStorage still holds the
    // user's pre-tour mode because the tour never wrote it.
    store.mode = snapshot.mode;
}
