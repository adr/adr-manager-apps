import { useResizablePanel } from "@/composables/useResizablePanel";

function setWindowWidth(width: number): void {
    Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
}

function previewPanel() {
    return useResizablePanel({
        storageKey: "previewWidth",
        min: 340,
        max: 760,
        defaultWidth: 480,
        handle: "left"
    });
}

beforeEach(() => {
    localStorage.clear();
    setWindowWidth(1920);
});

test("a persisted width that fits the window is restored as-is", () => {
    localStorage.setItem("previewWidth", "500");

    expect(previewPanel().width.value).toBe(500);
});

test("a width persisted on a larger screen is capped to 40% of the window", () => {
    localStorage.setItem("previewWidth", "760");
    setWindowWidth(1000);

    expect(previewPanel().width.value).toBe(400);
});

test("the default width is capped on a narrow window but never below min", () => {
    setWindowWidth(900);
    expect(previewPanel().width.value).toBe(360);

    setWindowWidth(600);
    expect(previewPanel().width.value).toBe(340);
});

test("a rail-collapsed explorer stays collapsed regardless of window size", () => {
    localStorage.setItem("explorerWidth", "58");
    setWindowWidth(600);

    const { width, collapsed } = useResizablePanel({
        storageKey: "explorerWidth",
        min: 208,
        max: 440,
        defaultWidth: 288,
        handle: "right",
        collapseBelow: 170,
        collapseTo: 58
    });

    expect(width.value).toBe(58);
    expect(collapsed.value).toBe(true);
});
