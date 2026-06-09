import { store } from "@/plugins/store";

test("store starts in basic mode and reacts to setMode (persisting to localStorage)", () => {
    expect(store.mode).toBe("basic");

    store.setMode("professional");
    expect(store.mode).toBe("professional");
    expect(localStorage.getItem("mode")).toBe("professional");

    store.setMode("basic");
    expect(store.mode).toBe("basic");
});

test("store starts with no repositories or edited ADR", () => {
    expect(store.addedRepositories).toEqual([]);
    expect(store.currentlyEditedAdr).toBeUndefined();
});
