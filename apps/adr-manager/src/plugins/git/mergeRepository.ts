import { Repository } from "@/plugins/classes";
import type { AdrFile } from "@/types/adr";

/**
 * Merges freshly fetched repository content into the cached repository without
 * losing pending local work: local edits are rebased onto the new remote base,
 * locally added ADRs and pending deletions are carried over, and conflicts are
 * left for commit time. A pending rename is matched to its remote file by the
 * committed path (`originalPath`), so the new name survives the refresh instead
 * of splitting into an orphan plus a duplicate. Returns null when nothing
 * changed, so callers can skip the store update (and the editor rebind it causes).
 *
 * `cached` must be read from the store at merge time, not before the fetch
 * started, because the user may have edited ADRs while the fetch was in flight.
 */
export function mergeRefreshedRepository(
    cached: Repository,
    fresh: Repository,
    failedFiles: readonly string[]
): Repository | null {
    const merged = new Repository({
        fullName: cached.fullName,
        activeBranch: cached.activeBranch,
        branches: cached.branches,
        adrs: [],
        // Keep the known path when the remote ADR directory vanished or the repo is empty.
        adrPath: fresh.adrs.length > 0 ? fresh.adrPath : cached.adrPath
    });

    const failedPaths = new Set(failedFiles);
    const cachedByPath = new Map(cached.adrs.map((adr) => [adr.path, adr]));
    const addedPaths = new Set(cached.addedAdrs.map((adr) => adr.path));
    const freshPaths = new Set(fresh.adrs.map((adr) => adr.path));
    // Pending renames keyed by their committed (remote) path. Added files have path === originalPath,
    // so they never enter this map.
    const renamedByCommittedPath = new Map(
        cached.adrs.filter((adr) => adr.path !== adr.originalPath).map((adr) => [adr.originalPath, adr])
    );

    // A pending deletion stays pending while the file still exists remotely.
    // When the file is gone upstream, the deletion already happened and is dropped.
    const pendingDeletionPaths = new Set<string>();
    for (const deleted of cached.deletedAdrs) {
        if (freshPaths.has(deleted.path)) {
            pendingDeletionPaths.add(deleted.path);
            merged.deletedAdrs.push(cloneAdr(deleted));
        }
    }

    for (const freshAdr of fresh.adrs) {
        if (pendingDeletionPaths.has(freshAdr.path)) {
            continue;
        }
        const cachedAdr = cachedByPath.get(freshAdr.path);
        if (!cachedAdr) {
            const renamed = renamedByCommittedPath.get(freshAdr.path);
            if (renamed) {
                // This remote file was renamed locally: rebase the edit onto the latest remote content,
                // keeping originalPath at the remote path so the commit still deletes it.
                merged.adrs.push(
                    failedPaths.has(freshAdr.path)
                        ? cloneAdr(renamed)
                        : {
                              path: renamed.path,
                              originalPath: freshAdr.path,
                              id: freshAdr.id,
                              originalMd: freshAdr.originalMd,
                              editedMd: renamed.editedMd
                          }
                );
                continue;
            }
            merged.adrs.push(cloneAdr(freshAdr));
            continue;
        }
        if (failedPaths.has(freshAdr.path)) {
            const keep = cloneAdr(cachedAdr);
            merged.adrs.push(keep);
            if (addedPaths.has(cachedAdr.path)) {
                merged.addedAdrs.push(keep);
            }
            continue;
        }
        if (cachedAdr.editedMd === cachedAdr.originalMd || cachedAdr.editedMd === freshAdr.originalMd) {
            // Cached is clean, or the remote caught up with the local edit.
            merged.adrs.push(cloneAdr(freshAdr));
        } else {
            // The file exists remotely now, so it is no longer "added" regardless of its history.
            merged.adrs.push({
                path: freshAdr.path,
                originalPath: freshAdr.path,
                id: freshAdr.id,
                originalMd: freshAdr.originalMd,
                editedMd: cachedAdr.editedMd
            });
        }
    }

    for (const added of cached.addedAdrs) {
        if (!freshPaths.has(added.path)) {
            const carried = cloneAdr(added);
            merged.adrs.push(carried);
            merged.addedAdrs.push(carried);
        }
    }

    // Cached files that disappeared remotely: clean ones were stale and are dropped,
    // dirty ones are preserved as new additions so the local work can be re-committed.
    // A pending rename is judged by its committed path, which the fresh loop already handled.
    for (const cachedAdr of cached.adrs) {
        if (freshPaths.has(cachedAdr.originalPath) || addedPaths.has(cachedAdr.path)) {
            continue;
        }
        if (cachedAdr.editedMd !== cachedAdr.originalMd) {
            const resurrected: AdrFile = {
                path: cachedAdr.path,
                originalPath: cachedAdr.path,
                id: cachedAdr.id,
                originalMd: "",
                editedMd: cachedAdr.editedMd,
                newAdr: true
            };
            merged.adrs.push(resurrected);
            merged.addedAdrs.push(resurrected);
        }
    }

    return persistedShape(merged) === persistedShape(cached) ? null : merged;
}

function cloneAdr(adr: AdrFile): AdrFile {
    return {
        path: adr.path,
        originalPath: adr.originalPath,
        id: adr.id,
        originalMd: adr.originalMd,
        editedMd: adr.editedMd,
        ...(adr.newAdr && { newAdr: true })
    };
}

/** Canonical serialization of everything the merge can change, key order fixed. */
function persistedShape(repo: Repository): string {
    return JSON.stringify({
        adrPath: repo.adrPath,
        adrs: repo.adrs.map(adrShape),
        addedAdrs: repo.addedAdrs.map(adrShape),
        deletedAdrs: repo.deletedAdrs.map(adrShape)
    });
}

function adrShape(adr: AdrFile): Record<string, unknown> {
    return {
        path: adr.path,
        id: adr.id,
        originalMd: adr.originalMd,
        editedMd: adr.editedMd,
        newAdr: adr.newAdr === true
    };
}
