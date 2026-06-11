import { lsGet, lsSet } from "@/plugins/storage";
import { githubProvider } from "./providers/github";
import { gitlabProvider } from "./providers/gitlab";
import type { GitProvider } from "./provider";
import type { GitProviderId } from "@/types/git";

const providers: Record<GitProviderId, GitProvider> = {
    github: githubProvider,
    gitlab: gitlabProvider
};

/** A missing or unknown key falls back to GitHub (sessions from before provider support). */
export function getActiveProvider(): GitProvider {
    const id = lsGet("gitProvider");
    return id === "github" || id === "gitlab" ? providers[id] : githubProvider;
}

export function setActiveProvider(id: GitProviderId): void {
    lsSet("gitProvider", id);
}

export function getProvider(id: GitProviderId): GitProvider {
    return providers[id];
}

/** Lets a redirect-based sign-in (e.g. GitLab OAuth) finish on app boot. */
export async function completePendingSignIn(): Promise<boolean> {
    for (const provider of Object.values(providers)) {
        if (await provider.completeSignIn()) {
            return true;
        }
    }
    return false;
}
