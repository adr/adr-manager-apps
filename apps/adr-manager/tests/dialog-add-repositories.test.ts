import { flushPromises, mount } from "@vue/test-utils";
import DialogAddRepositories from "@/components/DialogAddRepositories.vue";
import { getActiveProvider } from "@/plugins/git";
import type { RepoPage, RepoSummary } from "@/types/git";

vi.mock("@/plugins/git", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/plugins/git")>();
    return { ...actual, getActiveProvider: vi.fn(), loadAllRepositoryContent: vi.fn() };
});

const listRepositories = vi.fn();

function summary(fullName: string): RepoSummary {
    return { fullName, defaultBranch: "main", description: null, updatedAt: "2026-06-01T00:00:00Z" };
}

function repoPage(repositories: RepoSummary[], totalPages?: number): RepoPage {
    return { repositories, ...(totalPages !== undefined && { totalPages }) };
}

function mountDialog() {
    return mount(DialogAddRepositories, {
        props: { modelValue: true },
        global: { stubs: { teleport: true } }
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getActiveProvider).mockReturnValue({
        listRepositories,
        searchRepositories: vi.fn().mockResolvedValue([])
    } as never);
});

test("repositories are requested in pages of 20", async () => {
    listRepositories.mockResolvedValue(repoPage([summary("acme/a")], 1));

    const wrapper = mountDialog();
    await flushPromises();

    expect(listRepositories).toHaveBeenCalledWith(1, 20);
    expect(wrapper.findAll("[data-cy=listRepo]")).toHaveLength(1);
});

test("a textual loading status is shown while repositories are fetched", async () => {
    let resolveLoad!: (page: RepoPage) => void;
    listRepositories.mockReturnValue(new Promise<RepoPage>((resolve) => (resolveLoad = resolve)));

    const wrapper = mountDialog();

    expect(wrapper.text()).toContain("Loading your repositories…");

    resolveLoad(repoPage([summary("acme/a")], 1));
    await flushPromises();

    expect(wrapper.text()).not.toContain("Loading your repositories…");
});

test("a failed repository fetch shows a readable inline error and Retry reloads", async () => {
    listRepositories
        .mockRejectedValueOnce(
            Object.assign(new Error("Request failed with status code 500"), {
                isAxiosError: true,
                response: { status: 500, headers: {} }
            })
        )
        .mockResolvedValueOnce(repoPage([summary("acme/a")], 1));

    const wrapper = mountDialog();
    await flushPromises();

    const errorBlock = wrapper.find("[data-cy=repoListError]");
    expect(errorBlock.exists()).toBe(true);
    expect(errorBlock.text()).toContain("The Git provider is having problems (HTTP 500). Please try again later.");
    expect(wrapper.find("[data-cy=noRepo]").exists()).toBe(false);

    await wrapper.find("[data-cy=repoListRetry]").trigger("click");
    await flushPromises();

    expect(listRepositories).toHaveBeenCalledTimes(2);
    expect(wrapper.find("[data-cy=repoListError]").exists()).toBe(false);
    expect(wrapper.findAll("[data-cy=listRepo]")).toHaveLength(1);
});

test("the pagination shows the current page and the total page count", async () => {
    listRepositories.mockResolvedValue(repoPage([summary("acme/a")], 7));

    const wrapper = mountDialog();
    await flushPromises();

    expect(wrapper.find("[data-cy=pageIndicator]").text()).toBe("Page 1 of 7");

    await wrapper.find("[data-cy=nextPage]").trigger("click");
    await flushPromises();

    expect(listRepositories).toHaveBeenLastCalledWith(2, 20);
    expect(wrapper.find("[data-cy=pageIndicator]").text()).toBe("Page 2 of 7");
});

test("Back is disabled on the first page and Next on the last", async () => {
    listRepositories.mockResolvedValue(repoPage([summary("acme/a")], 2));

    const wrapper = mountDialog();
    await flushPromises();

    expect(wrapper.find("[data-cy=prevPage]").attributes("disabled")).toBeDefined();
    expect(wrapper.find("[data-cy=nextPage]").attributes("disabled")).toBeUndefined();

    await wrapper.find("[data-cy=nextPage]").trigger("click");
    await flushPromises();

    expect(wrapper.find("[data-cy=prevPage]").attributes("disabled")).toBeUndefined();
    expect(wrapper.find("[data-cy=nextPage]").attributes("disabled")).toBeDefined();
});

test("the pagination is hidden when everything fits on one page", async () => {
    listRepositories.mockResolvedValue(repoPage([summary("acme/a")], 1));

    const wrapper = mountDialog();
    await flushPromises();

    expect(wrapper.find("[data-cy=pagination]").exists()).toBe(false);
});

test("without a reported total the indicator shows only the current page", async () => {
    const fullPage = Array.from({ length: 20 }, (_, index) => summary(`acme/repo-${index}`));
    listRepositories.mockResolvedValue(repoPage(fullPage));

    const wrapper = mountDialog();
    await flushPromises();

    expect(wrapper.find("[data-cy=pageIndicator]").text()).toBe("Page 1");
    expect(wrapper.find("[data-cy=nextPage]").attributes("disabled")).toBeUndefined();
});
