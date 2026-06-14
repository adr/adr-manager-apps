import { useTour } from "@/composables/useTour";
import { Repository } from "@/plugins/classes";
import { store } from "@/plugins/store";
import { DEMO_REPO_FULL_NAME } from "@/plugins/tour/constants";
import { tourSteps } from "@/plugins/tour/steps";

const tour = useTour();

function stepIndexOf(id: string): number {
    const index = tourSteps.findIndex((step) => step.id === id);
    if (index < 0) {
        throw new Error(`Unknown tour step: ${id}`);
    }
    return index;
}

function goTo(id: string): void {
    while (tour.stepIndex.value < stepIndexOf(id)) {
        tour.next();
    }
}

afterEach(() => {
    tour.stop();
    store.currentlyEditedAdr = undefined;
    store.currentRepository = undefined;
    store.addedRepositories = [];
    store.mode = "basic";
    localStorage.clear();
});

test("starting over an empty workspace injects the demo repository", () => {
    tour.start();

    expect(tour.active.value).toBe(true);
    expect(tour.stepIndex.value).toBe(0);
    expect(store.addedRepositories.map((repo) => repo.fullName)).toContain(DEMO_REPO_FULL_NAME);
});

test("prev does not move below the first step", () => {
    tour.start();
    tour.prev();
    expect(tour.stepIndex.value).toBe(0);
});

test("the toggle-fields step forces professional mode and restores it on exit", () => {
    tour.start();
    expect(store.mode).toBe("basic");

    goTo("toggle-fields");
    expect(store.mode).toBe("professional");

    tour.next(); // exits toggle-fields, enters field-visibility (also forces professional)
    expect(store.mode).toBe("professional");

    tour.next(); // exits field-visibility, restores mode to original
    expect(store.mode).toBe("basic");
});

test("next on the final step finishes the tour and removes the demo", () => {
    tour.start();
    goTo("replay");
    expect(tour.active.value).toBe(true);

    tour.next();

    expect(tour.active.value).toBe(false);
    expect(store.addedRepositories).toEqual([]);
    expect(store.currentlyEditedAdr).toBeUndefined();
});

test("dismissing mid-tour restores mode and removes the demo", () => {
    store.mode = "professional";
    tour.start();
    goTo("toggle-fields");
    store.mode = "basic"; // What clicking the (blocked) toggle would have done.

    tour.stop();

    expect(tour.active.value).toBe(false);
    expect(store.mode).toBe("professional");
    expect(store.addedRepositories).toEqual([]);
});

test("a replay over real state does not inject the demo", () => {
    const adr = { path: "docs/decisions/0001-real.md", originalMd: "# Real\n", editedMd: "# Real\n", id: 1 };
    const repo = new Repository({
        fullName: "acme/decisions",
        activeBranch: "main",
        branches: [],
        adrs: [adr],
        adrPath: "docs/decisions/"
    });
    store.addedRepositories = [repo];
    store.currentRepository = repo;
    store.currentlyEditedAdr = adr;

    tour.start();

    expect(store.addedRepositories.map((r) => r.fullName)).toEqual(["acme/decisions"]);

    tour.stop();
    expect(store.currentlyEditedAdr).toStrictEqual(adr);
});
