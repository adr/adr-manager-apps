import axios from "axios";
import type { AxiosResponse } from "axios";
import { searchRepositoryList } from "@/plugins/api";
import { searchTermRepoPairs, mockedValues } from "./constants";
import type { GitHubRepoSummary } from "@/types/github";

vi.mock("axios");

beforeEach(() => {
    localStorage.setItem("authId", "abc....");
    vi.mocked(axios.get).mockResolvedValue(mockedValues as AxiosResponse);
});

searchTermRepoPairs.forEach(({ searchTerm, results }) => {
    test(`Test Searching Repos with list in parameter. Searching for ${searchTerm}`, async () => {
        const list: GitHubRepoSummary[] = [];
        await searchRepositoryList(searchTerm, 2, list);
        expect(list).toStrictEqual(results);
    });

    test(`Test Searching Repos without passing list. Searching for ${searchTerm}`, async () => {
        const list = await searchRepositoryList(searchTerm, 3);
        expect(list).toStrictEqual(results.slice(0, 30));
    });
});
