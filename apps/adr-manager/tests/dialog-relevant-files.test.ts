import { flushPromises, mount } from "@vue/test-utils";
import DialogRelevantFiles from "@/components/DialogRelevantFiles.vue";
import { invalidateFileList } from "@/plugins/git/fileListCache";
import { getActiveProvider } from "@/plugins/git/factory";
import type { GitProvider } from "@/plugins/git";

vi.mock("@/plugins/git/factory", () => ({
    getActiveProvider: vi.fn()
}));

const listFilesMock = vi.fn();

const FILES = ["README.md", "src/components/Editor.vue", "src/main.ts", "docs/adr/0001-test.md"];

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getActiveProvider).mockReturnValue({
        id: "github",
        listFiles: listFilesMock
    } as unknown as GitProvider);
    listFilesMock.mockResolvedValue([...FILES]);
    invalidateFileList("o/r", "main");
});

async function mountDialog(selected: string[] = []) {
    const wrapper = mount(DialogRelevantFiles, {
        props: { repoFullName: "o/r", branch: "main", selected, modelValue: true },
        global: { stubs: { teleport: true } }
    });
    await flushPromises();
    return wrapper;
}

test("shows the top level of the file tree with folders first", async () => {
    const wrapper = await mountDialog();
    const rows = wrapper.findAll("[data-cy=relevantFilesTree] li");
    expect(rows.map((row) => row.text())).toStrictEqual(["docs", "src", "README.md"]);
});

test("expanding a folder reveals its children", async () => {
    const wrapper = await mountDialog();
    const srcFolder = wrapper.findAll("[data-cy=relevantFilesTree] .folder-row").find((row) => row.text() === "src");
    await srcFolder!.trigger("click");
    const rows = wrapper.findAll("[data-cy=relevantFilesTree] li");
    expect(rows.map((row) => row.text())).toStrictEqual(["docs", "src", "components", "main.ts", "README.md"]);
});

test("searching filters the flat path list", async () => {
    const wrapper = await mountDialog();
    await wrapper.find("[data-cy=relevantFilesSearch]").setValue("main");
    const rows = wrapper.findAll("[data-cy=relevantFilesResults] li");
    expect(rows.map((row) => row.text())).toStrictEqual(["src/main.ts"]);
});

test("already linked files are preselected", async () => {
    const wrapper = await mountDialog(["src/main.ts"]);
    await wrapper.find("[data-cy=relevantFilesSearch]").setValue("main.ts");
    const checkbox = wrapper.find("[data-cy=relevantFilesResults] input[type=checkbox]");
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
    expect(wrapper.find("[data-cy=relevantFilesCount]").text()).toBe("1");
});

test("a selected file that no longer exists is flagged and can be unchecked", async () => {
    const wrapper = await mountDialog(["src/deleted.ts"]);
    const missingRow = wrapper.find("[data-cy=relevantFilesMissingRow]");
    expect(missingRow.text()).toContain("src/deleted.ts");
    expect(missingRow.text()).toContain("not found");
    await missingRow.find("input[type=checkbox]").setValue(false);
    await wrapper.find("[data-cy=relevantFilesApply]").trigger("click");
    expect(wrapper.emitted("apply")).toStrictEqual([[[]]]);
});

test("applying emits the sorted selection and closes the dialog", async () => {
    const wrapper = await mountDialog(["src/main.ts"]);
    await wrapper.find("[data-cy=relevantFilesSearch]").setValue("README");
    await wrapper.find("[data-cy=relevantFilesResults] input[type=checkbox]").setValue(true);
    await wrapper.find("[data-cy=relevantFilesApply]").trigger("click");
    expect(wrapper.emitted("apply")).toStrictEqual([[["README.md", "src/main.ts"]]]);
    expect(wrapper.emitted("update:modelValue")).toStrictEqual([[false]]);
});

test("a failed listing shows an error with a retry", async () => {
    listFilesMock.mockRejectedValueOnce(new Error("boom"));
    const wrapper = await mountDialog();
    expect(wrapper.find("[data-cy=relevantFilesError]").exists()).toBe(true);
    await wrapper.find("[data-cy=relevantFilesRetry]").trigger("click");
    await flushPromises();
    expect(wrapper.find("[data-cy=relevantFilesError]").exists()).toBe(false);
    expect(wrapper.find("[data-cy=relevantFilesTree]").exists()).toBe(true);
});
