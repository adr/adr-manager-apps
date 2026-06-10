/**
 * Global state of the ADR-Manager, shared between components as a typed
 * `reactive()` singleton. Consumers react to changes by watching slices of it,
 * e.g. `watch(() => store.currentlyEditedAdr, ...)` or `watch(() => store.mode, ...)`.
 */
import { reactive } from "vue";
import sanitize from "sanitize-filename";
import { ArchitecturalDecisionRecord, Repository, isValidAdr, isValidRepoList } from "@/plugins/classes";
import { adr2md, naturalCase2snakeCase } from "@/plugins/parser";
import { setInfosForApi, getUserName, getUserEmail } from "@/plugins/api";
import { lsGet, lsSet } from "@/plugins/storage";
import type { AdrFile } from "@/types/adr";
import type { Mode } from "@/types/store";
import type { CommitFile, FileStatus, PushedFile } from "@/types/commit";

export const store = reactive({
    currentRepository: undefined as Repository | undefined,
    currentlyEditedAdr: undefined as AdrFile | undefined,
    addedRepositories: [] as Repository[],
    mode: "basic" as Mode,
    currentRepositoryForCommit: undefined as Repository | undefined,
    name: "",
    userMail: "",
    branchCommit: "",

    reload(): void {
        this.addedRepositories = [];
        const addedRepos = lsGet("addedRepositories");
        if (addedRepos !== null) {
            const parsed: unknown = JSON.parse(addedRepos);
            if (isValidRepoList(parsed)) {
                this.addRepositories(parsed.map((repo) => Repository.constructFromString(JSON.stringify(repo))));
            } else {
                console.error("Invalid repos: ", parsed);
            }
        }
        // Load mode from local storage (default to "basic" for anything unexpected).
        this.mode = lsGet("mode") === "professional" ? "professional" : "basic";
    },

    updateLocalStorageRepositories(): void {
        lsSet("addedRepositories", JSON.stringify(this.addedRepositories));
    },

    addRepositories(repoList: Repository[]): void {
        const alreadyAddedRepos = repoList.filter((repoToAdd) =>
            this.addedRepositories.map((repo) => repo.fullName).includes(repoToAdd.fullName)
        );
        if (alreadyAddedRepos.length > 0) {
            throw new Error(
                "I won't add an already added repository to the store! " +
                    alreadyAddedRepos.map((repo) => repo.fullName).join(", ")
            );
        }
        this.addedRepositories = this.addedRepositories.concat(repoList);
        this.updateLocalStorageRepositories();
        this.ensureSomeAdrIsOpened();
    },

    removeRepository(repoToRemove: Repository): void {
        this.addedRepositories = this.addedRepositories.filter((repo) => repo.fullName !== repoToRemove.fullName);
        this.ensureSomeAdrIsOpened();
        this.updateLocalStorageRepositories();
    },

    updateRepository(updatedRepository: Repository): void {
        const index = this.addedRepositories.findIndex((repo) => repo.fullName === updatedRepository.fullName);
        const oldRepo = this.addedRepositories[index];
        if (index >= 0) {
            this.addedRepositories.splice(index, 1, updatedRepository);
        }
        const current = this.currentlyEditedAdr;
        if (oldRepo && current && oldRepo.adrs.includes(current)) {
            const replacement = updatedRepository.adrs.find((adr) => adr.path === current.path);
            if (replacement) {
                this.openAdr(replacement);
            }
        }
        this.updateLocalStorageRepositories();
    },

    setActiveBranch(activeBranch: string): void {
        if (this.currentRepository) {
            this.currentRepository.activeBranch = activeBranch;
        }
    },

    ensureSomeAdrIsOpened(): void {
        const current = this.currentlyEditedAdr;
        if (
            current === undefined ||
            !isValidAdr(current) ||
            !this.addedRepositories.some((repo) => repo.adrs.includes(current))
        ) {
            this.currentlyEditedAdr = undefined;
            this.currentRepository = undefined;
            this.openAnyAdr();
        }
    },

    openAnyAdr(): void {
        const reposWithAdrs = this.addedRepositories.filter((repo) => repo.adrs[0]);
        if (this.currentRepository && reposWithAdrs.includes(this.currentRepository)) {
            const someAdr = this.currentRepository.adrs[0];
            if (someAdr) {
                this.openAdr(someAdr);
            }
        } else if (reposWithAdrs.length > 0) {
            const someAdr = reposWithAdrs[0]?.adrs[0];
            if (someAdr) {
                this.openAdr(someAdr);
            }
        } else if (this.currentRepository === undefined) {
            this.currentRepository = this.addedRepositories[0];
        }
    },

    openAdrBy(repoFullName: string, adrName: string | undefined): AdrFile | undefined {
        const repo = this.addedRepositories.find((r) => r.fullName === repoFullName);
        const adr = repo?.adrs.find((a) => a.path.split("/").pop() === adrName);
        if (adr) {
            this.openAdr(adr);
        }
        return adr;
    },

    openAdr(adr: AdrFile): void {
        if (adr === this.currentlyEditedAdr) {
            return;
        }
        const repo = this.addedRepositories.find((r) => r.adrs.includes(adr));
        if (isValidAdr(adr) && repo !== undefined) {
            this.currentRepository = repo;
            this.currentlyEditedAdr = adr;
        } else {
            console.error("This is not a valid ADR", adr);
        }
    },

    updateMdOfCurrentAdr(md: string): void {
        const current = this.currentlyEditedAdr;
        if (!current) {
            return;
        }
        current.editedMd = md;

        if (this.currentRepository && this.currentRepository.addedAdrs.includes(current)) {
            const path = current.path.split("/");
            // The title heading is not necessarily the first line (4.0.0 starts with front matter).
            const titleLine = md.split("\n").find((line) => /^# /.test(line)) ?? "";
            const title = titleLine.replace(/^#+/, "").trim();
            path[path.length - 1] = sanitize(
                current.id.toString().padStart(4, "0") + "-" + naturalCase2snakeCase(title) + ".md"
            );
            current.path = path.join("/");
        }

        this.updateLocalStorageRepositories();
    },

    createNewAdr(repo: Repository): AdrFile | undefined {
        if (this.addedRepositories.includes(repo)) {
            // Per the MADR template every field is a placeholder, so a new ADR starts empty.
            const adr = new ArchitecturalDecisionRecord();
            const md = adr2md(adr);
            const id = Math.max(...repo.adrs.map((a) => a.id), 0) + 1;
            const newAdr: AdrFile = {
                originalMd: "",
                editedMd: md,
                id,
                path: repo.adrPath + id.toString().padStart(4, "0") + "-" + adr.title + ".md",
                newAdr: true
            };
            repo.addAdr(newAdr);
            this.updateLocalStorageRepositories();
            return newAdr;
        }
        return undefined;
    },

    deleteAdr(adr: AdrFile, repo: Repository): void {
        const adrIndexAdr = repo.adrs.findIndex((adrEl) => adrEl === adr);
        const adrIndexNewAdr = repo.addedAdrs.findIndex((adrEl) => adrEl === adr);

        const removed = adrIndexAdr >= 0 ? repo.adrs.splice(adrIndexAdr, 1)[0] : undefined;
        if (adrIndexNewAdr >= 0) {
            repo.addedAdrs.splice(adrIndexNewAdr, 1);
        } else if (removed) {
            repo.deletedAdrs.push(removed);
        }
        this.ensureSomeAdrIsOpened();
        this.updateLocalStorageRepositories();
    },

    setMode(mode: Mode): void {
        if (mode === "basic" || mode === "professional") {
            this.mode = mode;
            lsSet("mode", mode);
        } else {
            console.error("Invalid mode", mode);
        }
    },

    setCurrentRepositoryForCommit(repoName: string): void {
        for (const repo of this.addedRepositories) {
            if (repoName === repo.fullName) {
                this.currentRepositoryForCommit = repo;
                this.branchCommit = repo.activeBranch;
            }
        }
    },

    async setName(): Promise<void> {
        try {
            const res = await getUserName();
            if (!res) {
                return;
            }
            this.name = res.name === null ? res.login : res.name;
        } catch (error) {
            console.error(error);
        }
    },

    async setEmail(): Promise<void> {
        try {
            const res = await getUserEmail();
            if (res && res.length >= 1) {
                for (const emailEntry of res) {
                    if (!this.userMail || emailEntry.primary) {
                        this.userMail = emailEntry.email;
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    },

    getUserEmail(): string {
        return this.userMail;
    },

    getUserName(): string {
        return this.name;
    },

    getBranchCommit(): string {
        return this.branchCommit;
    },

    changedFilesInRepo(): CommitFile[] {
        const repo = this.currentRepositoryForCommit;
        if (!repo) {
            return [];
        }
        const changedFiles: CommitFile[] = [];
        for (const changedFile of repo.adrs) {
            if (!("newAdr" in changedFile)) {
                if (changedFile.editedMd !== changedFile.originalMd) {
                    changedFiles.push(this.dataStructureCommit(changedFile, "changed"));
                }
            }
        }
        return changedFiles;
    },

    deletedFilesInRepo(): CommitFile[] {
        const repo = this.currentRepositoryForCommit;
        if (!repo) {
            return [];
        }
        return repo.deletedAdrs.map(
            (deletedFile): CommitFile => ({
                title: deletedFile.path.split("/")[2] ?? "",
                value: "",
                path: deletedFile.path,
                fileSelected: false,
                fileStatus: "deleted"
            })
        );
    },

    newFilesInRepo(): CommitFile[] {
        const repo = this.currentRepositoryForCommit;
        if (!repo) {
            return [];
        }
        return repo.addedAdrs.map((newFile) => this.dataStructureCommit(newFile, "new"));
    },

    dataStructureCommit(file: AdrFile, fileType: FileStatus): CommitFile {
        const splitPath = file.path.split("/");
        return {
            title: splitPath[splitPath.length - 1] ?? "",
            value: file.editedMd,
            path: file.path,
            fileSelected: false,
            fileStatus: fileType
        };
    },

    async setInfoForCommit(): Promise<void> {
        await this.setName();
        await this.setEmail();
        const repo = this.currentRepositoryForCommit;
        if (!repo) {
            return;
        }
        const [owner, name] = repo.fullName.split("/");
        setInfosForApi(owner ?? "", name ?? "", repo.activeBranch);
    },

    updateLocalStorageAfterCommit(pushedFiles: PushedFile[]): void {
        for (const file of pushedFiles) {
            switch (file.type) {
                case "new":
                    this.handleUpdateLocalStorageNew(file);
                    break;
                case "changed":
                    this.handleUpdateLocalStorageChanged(file);
                    break;
                case "deleted":
                    this.handleUpdateLocalStorageDeleted(file);
                    break;
            }
        }
        this.updateLocalStorageRepositories();
    },

    handleUpdateLocalStorageNew(file: PushedFile): void {
        const repo = this.currentRepositoryForCommit;
        if (!repo) {
            return;
        }
        for (const repoEntry of repo.addedAdrs) {
            if (file.path === repoEntry.path) {
                const index = repo.addedAdrs.indexOf(repoEntry);
                repo.addedAdrs.splice(index, 1);
            }
        }
        for (const repoEntry of repo.adrs) {
            if (file.path === repoEntry.path) {
                delete repoEntry.newAdr;
                repoEntry.originalMd = repoEntry.editedMd;
            }
        }
    },

    handleUpdateLocalStorageChanged(file: PushedFile): void {
        const repo = this.currentRepositoryForCommit;
        if (!repo) {
            return;
        }
        for (const repoEntry of repo.adrs) {
            if (file.path === repoEntry.path) {
                repoEntry.originalMd = repoEntry.editedMd;
            }
        }
    },

    handleUpdateLocalStorageDeleted(file: PushedFile): void {
        const repo = this.currentRepositoryForCommit;
        if (!repo) {
            return;
        }
        for (const repoEntry of repo.deletedAdrs) {
            if (file.path === repoEntry.path) {
                const index = repo.deletedAdrs.indexOf(repoEntry);
                repo.deletedAdrs.splice(index, 1);
            }
        }
    }
});

store.reload();
