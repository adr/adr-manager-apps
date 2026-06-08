import type { AdrInit, AdrFile, Option, DecisionOutcome } from "@/types/adr";
import type { Branch, RepositoryInit, RepositoryChanges, StoredRepository } from "@/types/repository";

export class ArchitecturalDecisionRecord {
    title: string;
    status: string;
    deciders: string;
    date: string;
    technicalStory: string;
    contextAndProblemStatement: string;
    decisionDrivers: string[];
    highestOptionId: number;
    consideredOptions: Option[];
    decisionOutcome: DecisionOutcome;
    links: string[];

    constructor(init: AdrInit = {}) {
        this.title = init.title ?? "";
        this.status = init.status ?? "";
        this.deciders = init.deciders ?? "";
        this.date = init.date ?? "";
        this.technicalStory = init.technicalStory ?? "";
        this.contextAndProblemStatement = init.contextAndProblemStatement ?? "";
        this.decisionDrivers = init.decisionDrivers ?? [];
        this.highestOptionId = 0;
        this.consideredOptions = [];
        if (init.consideredOptions) {
            for (const opt of init.consideredOptions) {
                this.addOption(opt);
            }
        }
        // Assure invariants for the decisionOutcome attribute (all fields present).
        const outcome = init.decisionOutcome;
        this.decisionOutcome = {
            chosenOption: outcome?.chosenOption ?? "",
            explanation: outcome?.explanation ?? "",
            positiveConsequences: outcome?.positiveConsequences ?? [],
            negativeConsequences: outcome?.negativeConsequences ?? []
        };
        this.links = init.links ?? [];

        this.cleanUp();
    }

    addOption({ title, description, pros, cons }: Partial<Option> = {}): Option {
        const id = this.highestOptionId;
        this.highestOptionId = this.highestOptionId + 1;
        const newOpt: Option = {
            title: title ?? "",
            description: description ?? "",
            pros: pros ?? [],
            cons: cons ?? [],
            id
        };
        this.consideredOptions.push(newOpt);
        return newOpt;
    }

    getOptionByTitle(title: string): Option | undefined {
        return this.consideredOptions.find((el) => el.title.startsWith(title));
    }

    /**
     * Cleans up the ADR:
     *  - Asserts that all string attributes contain a string value.
     *  - Trims all strings.
     *
     * NOTE: this intentionally preserves the original (pre-migration) behavior, including its
     * quirks: `negativeConsequences` is not trimmed and `links` is not filtered. Changing these
     * would alter parser round-trip output that existing fixtures depend on.
     */
    cleanUp(): void {
        this.title = cleanUpString(this.title);
        this.status = cleanUpString(this.status);
        this.date = cleanUpString(this.date);
        this.deciders = cleanUpString(this.deciders);
        this.technicalStory = cleanUpString(this.technicalStory);
        this.contextAndProblemStatement = cleanUpString(this.contextAndProblemStatement);

        this.decisionDrivers = this.decisionDrivers.map((el) => cleanUpString(el)).filter((el) => el !== "");

        this.consideredOptions.forEach((opt) => {
            opt.title = cleanUpString(opt.title);
            opt.description = cleanUpString(opt.description);
            opt.pros = opt.pros.map((el) => cleanUpString(el)).filter((el) => el !== "");
            opt.cons = opt.cons.map((el) => cleanUpString(el)).filter((el) => el !== "");
        });

        this.decisionOutcome.chosenOption = cleanUpString(this.decisionOutcome.chosenOption);
        this.decisionOutcome.explanation = cleanUpString(this.decisionOutcome.explanation);
        this.decisionOutcome.positiveConsequences = this.decisionOutcome.positiveConsequences.map((el) =>
            cleanUpString(el)
        );

        this.links = this.links.map((el) => cleanUpString(el));
    }

    static createNewAdr(): ArchitecturalDecisionRecord {
        return new ArchitecturalDecisionRecord({
            status: "proposed",
            date: new Date().toISOString().substr(0, 10),
            decisionOutcome: {
                explanation: "comes out best."
            }
        });
    }
}

function cleanUpString(value: string | undefined | null): string {
    if (typeof value === "string") {
        return value.trim();
    }
    return "";
}

export class Repository {
    fullName: string;
    activeBranch: string;
    branches: Branch[];
    adrs: AdrFile[];
    adrPath: string;
    addedAdrs: AdrFile[];
    deletedAdrs: AdrFile[];

    constructor({ fullName, activeBranch, branches, adrs, adrPath }: RepositoryInit = {}) {
        if (adrs && adrs.length > 0 && !adrPath) {
            console.warn("There are ADRs but no adr path is given. ADRs:", adrs, " ADR path:", adrPath);
        }
        this.fullName = fullName ?? "";
        this.activeBranch = activeBranch ?? "";
        this.branches = branches ?? [];
        this.adrs = adrs ?? [];
        this.adrPath = adrPath || "docs/decisions/";
        this.addedAdrs = [];
        this.deletedAdrs = [];
    }

    static constructFromString(json: string): Repository {
        // JSON.parse returns `any`; the caller validates structure via isValidRepoList first.
        const repoData: StoredRepository = JSON.parse(json);
        const repo = new Repository(repoData);
        repoData.addedAdrs.forEach((adr) => {
            const equalAdr = repoData.adrs.find(
                (el) => el.path === adr.path && el.editedMd === adr.editedMd && el.originalMd === adr.originalMd
            );
            if (equalAdr) {
                repo.addedAdrs.push(equalAdr);
            } else {
                throw new Error("There was an added adr in the parameter string that didn't match!");
            }
        });
        return repo;
    }

    getChanges(): RepositoryChanges {
        return {
            added: this.addedAdrs,
            changed: this.adrs.filter((adr) => adr.originalMd !== adr.editedMd && !this.addedAdrs.includes(adr)),
            deleted: this.deletedAdrs
        };
    }

    hasChanges(): boolean {
        const changes = this.getChanges();
        return changes.changed.length !== 0 || changes.added.length !== 0 || changes.deleted.length !== 0;
    }

    addAdr(newAdr: AdrFile): void {
        this.adrs.push(newAdr);
        this.addedAdrs.push(newAdr);
    }
}

export function createShortTitle(title: string): string {
    if (!title) {
        return "";
    }
    let result = title;

    // Strip off short description text in the title
    // Example:
    //   In: [MADR](https://adr.github.io/madr/) 2.1.2 – The Markdown Architectural Decision Records
    //   Out: [MADR](https://adr.github.io/madr/) 2.1.2
    let idx = title.indexOf(" - ");
    if (idx > 0) {
        result = title.substr(0, idx);
    } else {
        idx = title.indexOf(" – ");
        if (idx > 0) {
            result = title.substr(0, idx);
        } else {
            idx = title.indexOf(" | ");
            if (idx > 0) {
                result = title.substr(0, idx);
            } else {
                idx = title.indexOf(", e.g.");
                if (idx > 0) {
                    result = title.substr(0, idx);
                } else {
                    // Handle case "Add ... (similar to https://...)" --> content of braces removed for short title
                    idx = title.indexOf(" (");
                    const idxClosing = title.indexOf(")");
                    if (idx > 0 && idxClosing == title.length - 1 && (idx = title.lastIndexOf(" ("))) {
                        result = title.substr(0, idx);
                    }
                }
            }
        }
    }

    // Strip out markdown link
    // Example:
    //   In: [MADR](https://adr.github.io/madr/) 2.1.2  ->  Out: MADR 2.1.2
    //   In: Include in [adr-tools](https://github.com/npryce/adr-tools)  ->  Out: Include in adr-tools
    const idxOpeningBracket = result.indexOf("[");
    const idxClosingBracket = result.indexOf("]");
    const idxOpeningRoundedBracket = result.indexOf("(");
    const idxClosingRoundedBracket = result.indexOf(")");
    if (
        idxOpeningBracket >= 0 &&
        idxOpeningBracket < idxClosingBracket &&
        idxOpeningRoundedBracket == idxClosingBracket + 1 &&
        idxClosingRoundedBracket > idxOpeningRoundedBracket
    ) {
        result =
            (idxOpeningBracket > 0 ? result.substr(0, idxOpeningBracket) : "") +
            result.substr(idxOpeningBracket + 1, idxClosingBracket - idxOpeningBracket - 1) +
            (result.length > idxClosingRoundedBracket + 1 ? result.substr(idxClosingRoundedBracket + 1) : "");
    }
    return result;
}

/**
 * Type guard: checks the minimal shape of a persisted ADR file (originalMd, editedMd, path).
 */
export function isValidAdr(adr: unknown): adr is AdrFile {
    return typeof adr === "object" && adr !== null && "originalMd" in adr && "editedMd" in adr && "path" in adr;
}

/**
 * Type guard for an array of persisted repositories (as loaded from localStorage).
 * Each repo must have the bookkeeping arrays and every contained ADR must be valid.
 */
export function isValidRepoList(repos: unknown): repos is StoredRepository[] {
    return (
        Array.isArray(repos) &&
        repos.every((repo) => {
            const valid =
                typeof repo === "object" &&
                repo !== null &&
                "fullName" in repo &&
                "activeBranch" in repo &&
                "branches" in repo &&
                "addedAdrs" in repo &&
                "deletedAdrs" in repo &&
                "adrs" in repo &&
                Array.isArray(repo.adrs) &&
                repo.adrs.every(isValidAdr);
            if (!valid) {
                console.log("Invalid repository", repo);
            }
            return valid;
        })
    );
}
