import { fetchFileList, getCachedFileList, invalidateFileList, primeFileList } from "@/plugins/git/fileListCache";
import { loadRepositoryContent } from "@/plugins/git/repositoryContent";
import { getActiveProvider } from "@/plugins/git/factory";
import type { GitProvider } from "@/plugins/git";

vi.mock("@/plugins/git/factory", () => ({
    getActiveProvider: vi.fn()
}));

const listFilesMock = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getActiveProvider).mockReturnValue({
        id: "github",
        listFiles: listFilesMock,
        readFile: vi.fn().mockResolvedValue("# ADR\n")
    } as unknown as GitProvider);
});

test("a primed listing is returned without hitting the provider", async () => {
    primeFileList("o/primed", "main", ["src/a.ts"]);
    expect(getCachedFileList("o/primed", "main")).toStrictEqual(["src/a.ts"]);
    expect(await fetchFileList("o/primed", "main")).toStrictEqual(["src/a.ts"]);
    expect(listFilesMock).not.toHaveBeenCalled();
});

test("an unknown listing is fetched once and then cached", async () => {
    listFilesMock.mockResolvedValue(["src/b.ts"]);
    expect(getCachedFileList("o/fetched", "main")).toBeUndefined();
    const [first, second] = await Promise.all([fetchFileList("o/fetched", "main"), fetchFileList("o/fetched", "main")]);
    expect(first).toStrictEqual(["src/b.ts"]);
    expect(second).toStrictEqual(["src/b.ts"]);
    expect(listFilesMock).toHaveBeenCalledTimes(1);
    await fetchFileList("o/fetched", "main");
    expect(listFilesMock).toHaveBeenCalledTimes(1);
});

test("a failed fetch is not cached", async () => {
    listFilesMock.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(["src/c.ts"]);
    await expect(fetchFileList("o/failing", "main")).rejects.toThrow("boom");
    expect(getCachedFileList("o/failing", "main")).toBeUndefined();
    expect(await fetchFileList("o/failing", "main")).toStrictEqual(["src/c.ts"]);
});

test("invalidating drops the listing and the cache is branch-specific", async () => {
    primeFileList("o/branches", "main", ["src/main.ts"]);
    primeFileList("o/branches", "dev", ["src/dev.ts"]);
    invalidateFileList("o/branches", "main");
    expect(getCachedFileList("o/branches", "main")).toBeUndefined();
    expect(getCachedFileList("o/branches", "dev")).toStrictEqual(["src/dev.ts"]);
});

test("loading repository content primes the listing", async () => {
    listFilesMock.mockResolvedValue(["docs/adr/0001-test.md", "src/a.ts"]);
    await loadRepositoryContent("o/loaded", "main");
    expect(getCachedFileList("o/loaded", "main")).toStrictEqual(["docs/adr/0001-test.md", "src/a.ts"]);
});
