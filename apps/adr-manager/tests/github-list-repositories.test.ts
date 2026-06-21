import axios from "axios";
import { listRepositories } from "@/plugins/git/providers/github/api";

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

const get = vi.mocked(axios.get);

function githubRepo(fullName: string) {
    return { full_name: fullName, default_branch: "main", description: null, updated_at: "2026-06-01T00:00:00Z" };
}

function link(entries: Array<[page: number, rel: string]>): string {
    return entries
        .map(([page, rel]) => `<https://api.github.com/user/repos?sort=updated&page=${page}&per_page=20>; rel="${rel}"`)
        .join(", ");
}

beforeEach(() => {
    vi.clearAllMocks();
});

test("the total page count is parsed from the Link header", async () => {
    get.mockResolvedValue({
        data: [githubRepo("acme/a")],
        headers: {
            link: link([
                [2, "next"],
                [7, "last"]
            ])
        }
    });

    const result = await listRepositories(1, 20);

    expect(result.totalPages).toBe(7);
    expect(result.repositories[0]?.fullName).toBe("acme/a");
});

test("the last page reports itself as the total because rel=last is absent there", async () => {
    get.mockResolvedValue({
        data: [githubRepo("acme/a")],
        headers: {
            link: link([
                [6, "prev"],
                [1, "first"]
            ])
        }
    });

    expect((await listRepositories(7, 20)).totalPages).toBe(7);
});

test("a response without a Link header counts as a single page", async () => {
    get.mockResolvedValue({ data: [githubRepo("acme/a")], headers: {} });

    expect((await listRepositories(1, 20)).totalPages).toBe(1);
});
