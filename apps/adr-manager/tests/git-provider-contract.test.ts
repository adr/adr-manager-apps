import axios from "axios";
import { githubProvider } from "@/plugins/git/providers/github";
import { gitlabProvider } from "@/plugins/git/providers/gitlab";
import type { GitProvider } from "@/plugins/git";

vi.mock("axios", async (importOriginal) => {
    const actual = await importOriginal<typeof import("axios")>();
    return {
        ...actual,
        default: {
            ...actual.default,
            create: vi.fn(),
            get: vi.fn(),
            post: vi.fn()
        }
    };
});

interface ContractCase {
    provider: GitProvider;
    /** Persists a fake session the way the provider's sign-in flow would. */
    authenticate: () => void;
}

const cases: ContractCase[] = [
    {
        provider: githubProvider,
        authenticate: () => localStorage.setItem("authId", "token")
    },
    {
        provider: gitlabProvider,
        authenticate: () =>
            localStorage.setItem(
                "gitlabTokens",
                JSON.stringify({ accessToken: "token", refreshToken: "refresh", expiresAt: Date.now() + 7200_000 })
            )
    }
];

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    vi.mocked(axios.post).mockResolvedValue({ data: {} });
});

describe("fileWebUrl", () => {
    test("github builds a blob URL with encoded path segments", () => {
        expect(githubProvider.fileWebUrl("owner/repo", "main", "src/my file (v2).ts")).toBe(
            "https://github.com/owner/repo/blob/main/src/my%20file%20(v2).ts"
        );
    });

    test("github keeps slashes in branch names", () => {
        expect(githubProvider.fileWebUrl("owner/repo", "feature/x", "src/a.ts")).toBe(
            "https://github.com/owner/repo/blob/feature/x/src/a.ts"
        );
    });

    test("gitlab builds a blob URL under the configured base url", () => {
        expect(gitlabProvider.fileWebUrl("group/project", "main", "src/päth.ts")).toBe(
            "https://gitlab.com/group/project/-/blob/main/src/p%C3%A4th.ts"
        );
        localStorage.setItem("gitlabBaseUrl", "https://gitlab.example.org");
        expect(gitlabProvider.fileWebUrl("group/project", "main", "src/a.ts")).toBe(
            "https://gitlab.example.org/group/project/-/blob/main/src/a.ts"
        );
    });
});

cases.forEach(({ provider, authenticate }) => {
    describe(`${provider.id} provider contract`, () => {
        test("starts unauthenticated", () => {
            expect(provider.isAuthenticated()).toBe(false);
        });

        test("isAuthenticated follows the persisted session and signOut clears it", () => {
            authenticate();
            expect(provider.isAuthenticated()).toBe(true);
            provider.signOut();
            expect(provider.isAuthenticated()).toBe(false);
        });

        test("completeSignIn is a no-op without a pending redirect", async () => {
            await expect(provider.completeSignIn()).resolves.toBe(false);
        });

        test("restoreSession is safe without a session", () => {
            expect(() => provider.restoreSession()).not.toThrow();
        });

        test("declares a non-negative commit cooldown", () => {
            expect(provider.commitCooldownMs).toBeGreaterThanOrEqual(0);
        });
    });
});
