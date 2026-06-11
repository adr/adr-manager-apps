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
