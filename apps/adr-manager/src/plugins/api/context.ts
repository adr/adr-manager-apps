interface ApiContext {
    repoOwner: string;
    repoName: string;
    branch: string;
}

const context: ApiContext = { repoOwner: "", repoName: "", branch: "" };

/** Targets subsequent commit and push calls at the given repository and branch. */
export function setInfosForApi(repoOwner: string, repoName: string, branch: string): void {
    context.repoOwner = repoOwner;
    context.repoName = repoName;
    context.branch = branch;
}

export function apiContext(): Readonly<ApiContext> {
    return context;
}
