import { Repository } from "@/plugins/classes";
import { getActiveProvider } from "./factory";
import type { AdrFile } from "@/types/adr";

const ADR_PATH_CANDIDATES = [
    "/docs/adr/",
    "/docs/adrs/",
    "/docs/ADR/",
    "/doc/adr/",
    "/docs/decisions/",
    "/docs/design/",
    "/technical-overview/adr/"
] as const;

export async function loadAllRepositoryContent(
    repoList: ReadonlyArray<{ fullName: string; branch: string }>
): Promise<Repository[]> {
    return Promise.all(repoList.map((repo) => loadRepositoryContent(repo.fullName, repo.branch)));
}

export async function loadRepositoryContent(repoFullName: string, branchName: string): Promise<Repository> {
    const provider = getActiveProvider();
    const adrPromises: Promise<void>[] = [];
    const repoObject = new Repository({
        fullName: repoFullName,
        activeBranch: branchName,
        adrPath: "",
        adrs: []
    });

    const filePaths = await provider.listFiles(repoFullName, branchName);
    if (filePaths) {
        let adrPath: string | undefined;
        const adrList = filePaths.filter((filePath) => {
            const matchedPaths = ADR_PATH_CANDIDATES.filter(
                (path) => ("/" + filePath).includes(path) || filePath.startsWith("adr/")
            );

            const firstMatch = matchedPaths[0];
            if (!adrPath && matchedPaths.length === 1 && firstMatch) {
                adrPath = firstMatch.slice(1);
            } else if (
                matchedPaths.length > 1 ||
                (matchedPaths.length === 1 && firstMatch && firstMatch.slice(1) !== adrPath)
            ) {
                console.warn("Loading error, unclear ADR path: Found ", [...matchedPaths, adrPath]);
            }

            return matchedPaths.length > 0;
        });
        repoObject.adrPath = adrPath || "docs/decisions/";

        adrList.forEach((filePath) => {
            const parsedId = Number(filePath.split("/").pop()?.split("-")[0]);
            const id = Number.isNaN(parsedId) ? -1 : parsedId;
            const adrObject: AdrFile = { path: filePath, id, originalMd: "", editedMd: "" };
            repoObject.adrs.push(adrObject);
            adrPromises.push(
                provider.readFile(repoFullName, branchName, filePath).then((rawMd) => {
                    adrObject.originalMd = rawMd ?? "";
                    adrObject.editedMd = rawMd ?? "";
                })
            );
        });
    }

    await Promise.all(adrPromises);
    return repoObject;
}
