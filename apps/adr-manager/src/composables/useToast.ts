import { readonly, ref } from "vue";

export type ToastVariant = "success" | "error";

interface Toast {
    text: string;
    variant: ToastVariant;
}

const toast = ref<Toast | null>(null);
let hideTimer: ReturnType<typeof setTimeout> | undefined;

function show(text: string, variant: ToastVariant, durationMs: number): void {
    toast.value = { text, variant };
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        toast.value = null;
    }, durationMs);
}

/**
 * App-wide toast notifications, rendered by AppToast.
 */
export function useToast() {
    const showToast = (text: string, durationMs = 2200): void => {
        show(text, "success", durationMs);
    };

    const showErrorToast = (text: string, durationMs = 6000): void => {
        show(text, "error", durationMs);
    };

    return { toast: readonly(toast), showToast, showErrorToast };
}
