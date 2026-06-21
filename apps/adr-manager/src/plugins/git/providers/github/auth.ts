import { lsRemove, lsSet } from "@/plugins/storage";

const OAUTH_SCOPES = "repo read:user gist workflow read:org";

const loadFirebase = () => Promise.all([import("firebase/auth"), import("@/plugins/firebase/client")]);

/**
 * Runs the Firebase GitHub popup flow and persists the resulting token.
 * Firebase is imported lazily so the GitLab path (and unit tests) never load it.
 */
export async function signInWithGitHubPopup(): Promise<void> {
    const [{ signInWithPopup, GithubAuthProvider, getAdditionalUserInfo }, { auth, GithubProvider }] =
        await loadFirebase();
    GithubProvider.addScope(OAUTH_SCOPES);
    const result = await signInWithPopup(auth, GithubProvider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
        throw new Error("GitHub sign-in returned no access token.");
    }
    lsSet("authId", credential.accessToken);
    lsSet("user", getAdditionalUserInfo(result)?.username ?? "");
}

/** Loads Firebase ahead of a popup so the window opens within the user's click gesture. */
export function prewarmGitHubAuth(): Promise<unknown> {
    return loadFirebase();
}

export async function clearSession(): Promise<void> {
    lsRemove("authId");
    lsRemove("user");
    const [{ signOut }, { auth }] = await loadFirebase();
    await signOut(auth);
}
