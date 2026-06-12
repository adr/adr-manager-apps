import { useToast } from "@/composables/useToast";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
});

test("showToast shows a success toast that auto-dismisses after 2200ms", () => {
    const { toast, showToast } = useToast();

    showToast("Saved");

    expect(toast.value).toEqual({ text: "Saved", variant: "success" });
    vi.advanceTimersByTime(2199);
    expect(toast.value).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(toast.value).toBeNull();
});

test("showErrorToast shows an error toast that stays for 6000ms", () => {
    const { toast, showErrorToast } = useToast();

    showErrorToast("Something failed");

    expect(toast.value).toEqual({ text: "Something failed", variant: "error" });
    vi.advanceTimersByTime(5999);
    expect(toast.value).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(toast.value).toBeNull();
});

test("a newer toast replaces the current one and resets the dismiss timer", () => {
    const { toast, showToast, showErrorToast } = useToast();

    showErrorToast("First");
    vi.advanceTimersByTime(5000);
    showToast("Second");

    expect(toast.value).toEqual({ text: "Second", variant: "success" });
    vi.advanceTimersByTime(1500);
    expect(toast.value).not.toBeNull();
    vi.advanceTimersByTime(700);
    expect(toast.value).toBeNull();
});
