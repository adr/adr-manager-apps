import axios from "axios";
import { lsGet, lsRemove, lsSet } from "@/plugins/storage";

const OAUTH_SCOPES = "repo read:user gist workflow read:org";

/**
 * Runs the Firebase GitHub popup flow and persists the resulting token.
 * Firebase is imported lazily so the GitLab path (and unit tests) never load it.
 */
export async function signInWithGitHubPopup(): Promise<void> {
    const [{ signInWithPopup, GithubAuthProvider, getAdditionalUserInfo }, { auth, GithubProvider }] =
        await Promise.all([import("firebase/auth"), import("@/plugins/firebase/client")]);
    GithubProvider.addScope(OAUTH_SCOPES);
    const result = await signInWithPopup(auth, GithubProvider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
        throw new Error("GitHub sign-in returned no access token.");
    }
    lsSet("authId", credential.accessToken);
    lsSet("user", getAdditionalUserInfo(result)?.username ?? "");
    applyAuthHeader();
}

export function applyAuthHeader(): void {
    const token = lsGet("authId");
    if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
}

export async function clearSession(): Promise<void> {
    lsRemove("authId");
    lsRemove("user");
    delete axios.defaults.headers.common["Authorization"];
    const [{ signOut }, { auth }] = await Promise.all([import("firebase/auth"), import("@/plugins/firebase/client")]);
    await signOut(auth);
}
