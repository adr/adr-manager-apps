import { loadRepositoryContent } from "@/plugins/git/repositoryContent";
import { getActiveProvider } from "@/plugins/git/factory";

vi.mock("@/plugins/git/factory", () => ({ getActiveProvider: vi.fn() }));

const listFiles = vi.fn();
const readFile = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getActiveProvider).mockReturnValue({ id: "github", listFiles, readFile } as never);
});

test("only markdown files under the ADR path are loaded as ADRs", async () => {
    listFiles.mockResolvedValue([
        "docs/decisions/0001-foo.md",
        "docs/decisions/0002-bar.md",
        "docs/decisions/assets/0001-diagram.png"
    ]);
    readFile.mockResolvedValue("# A decision");

    const { repository, failedFiles } = await loadRepositoryContent("acme/repo", "main");

    expect(repository.adrs.map((adr) => adr.path)).toEqual([
        "docs/decisions/0001-foo.md",
        "docs/decisions/0002-bar.md"
    ]);
    expect(repository.adrPath).toBe("docs/decisions/");
    expect(readFile).toHaveBeenCalledTimes(2);
    expect(readFile).not.toHaveBeenCalledWith("acme/repo", "main", "docs/decisions/assets/0001-diagram.png");
    expect(failedFiles).toEqual([]);
});
