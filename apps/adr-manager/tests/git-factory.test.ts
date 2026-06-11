import { getActiveProvider, getProvider, setActiveProvider } from "@/plugins/git";

beforeEach(() => {
    localStorage.clear();
});

test("defaults to github when no provider is stored", () => {
    expect(getActiveProvider().id).toBe("github");
});

test("setActiveProvider persists the selection", () => {
    setActiveProvider("github");
    expect(localStorage.getItem("gitProvider")).toBe("github");
    expect(getActiveProvider().id).toBe("github");
});

test("an unknown stored value falls back to github", () => {
    localStorage.setItem("gitProvider", "bitbucket");
    expect(getActiveProvider().id).toBe("github");
});

test("getProvider looks up a provider by id", () => {
    expect(getProvider("github").id).toBe("github");
});
