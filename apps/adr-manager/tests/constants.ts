import type { GitHubRepoSummary } from "@/plugins/git/providers/github/types";
import type { RepoSummary } from "@/types/git";

type RepoFixture = Pick<GitHubRepoSummary, "full_name" | "default_branch" | "description" | "updated_at">;

function repoFixture(overrides: Partial<RepoFixture>): RepoFixture {
    return {
        full_name: "adr/adr-manager",
        default_branch: "main",
        description: "ADR-Manager",
        updated_at: "2023-12-03T18:23:48Z",
        ...overrides
    };
}

const foodApp = repoFixture({
    full_name: "tasbihaasim/foodapp",
    default_branch: "master",
    description: null,
    updated_at: "2023-05-31T15:26:12Z"
});

const chatApplication = repoFixture({
    full_name: "Moneexa/Chatapplication",
    default_branch: "master",
    description: null,
    updated_at: "2021-05-17T11:25:46Z"
});

export function toExpectedSummaries(repos: RepoFixture[]): RepoSummary[] {
    return repos.map((repo) => ({
        fullName: repo.full_name,
        defaultBranch: repo.default_branch,
        description: repo.description,
        updatedAt: repo.updated_at
    }));
}

export const searchTermRepoPairs: { searchTerm: string; results: RepoFixture[] }[] = [
    {
        searchTerm: "ap",
        results: [foodApp, chatApplication]
    }
];

export const mockedValues: { data: RepoFixture[]; headers: Record<string, string> } = {
    headers: {},
    data: [
        repoFixture({}),
        foodApp,
        chatApplication
    ]
};
