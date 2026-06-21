import axios from "axios";
import type { AxiosResponse } from "axios";
import { githubProvider } from "@/plugins/git/providers/github";
import { searchTermRepoPairs, mockedValues, toExpectedSummaries } from "./constants";

vi.mock("axios", async (importOriginal) => {
    const actual = await importOriginal<typeof import("axios")>();
    const get = vi.fn();
    const instance = {
        get,
        post: vi.fn(),
        request: vi.fn(),
        interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }
    };
    return { ...actual, default: { ...actual.default, get, create: () => instance } };
});

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("authId", "abc....");
    vi.mocked(axios.get).mockResolvedValue(mockedValues as AxiosResponse);
});

searchTermRepoPairs.forEach(({ searchTerm, results }) => {
    test(`searchRepositories returns mapped matches for ${searchTerm}`, async () => {
        const list = await githubProvider.searchRepositories(searchTerm, 2);
        expect(list).toStrictEqual(toExpectedSummaries(results));
    });

    test(`searchRepositories stops after the only page for ${searchTerm}`, async () => {
        const list = await githubProvider.searchRepositories(searchTerm, 3);
        expect(list).toStrictEqual(toExpectedSummaries(results));
        expect(axios.get).toHaveBeenCalledTimes(1);
    });
});

test("searchRepositories returns what was accumulated when a page fails", async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error("HTTP 500"));
    await expect(githubProvider.searchRepositories("ap", 2)).resolves.toStrictEqual([]);
});

test("isAuthenticated reflects the stored token", () => {
    expect(githubProvider.isAuthenticated()).toBe(true);
    localStorage.removeItem("authId");
    expect(githubProvider.isAuthenticated()).toBe(false);
});
