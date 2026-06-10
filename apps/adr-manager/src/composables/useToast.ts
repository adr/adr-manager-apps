import { readonly, ref } from "vue";

const message = ref<string | null>(null);
let hideTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * App-wide toast notifications, rendered by AppToast.
 */
export function useToast() {
    const showToast = (text: string, durationMs = 2200): void => {
        message.value = text;
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            message.value = null;
        }, durationMs);
    };

    return { toastMessage: readonly(message), showToast };
}
