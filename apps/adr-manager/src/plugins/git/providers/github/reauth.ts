import { ref } from "vue";

export const reconnectVisible = ref(false);

let pending: Promise<boolean> | null = null;
let resolvePending: ((ok: boolean) => void) | null = null;

/** Single-flight: concurrent 401s share one reconnect prompt. */
export function requestReauth(): Promise<boolean> {
    if (!pending) {
        pending = new Promise<boolean>((resolve) => {
            resolvePending = resolve;
        });
        reconnectVisible.value = true;
    }
    return pending;
}

export function settleReauth(ok: boolean): void {
    reconnectVisible.value = false;
    resolvePending?.(ok);
    pending = null;
    resolvePending = null;
}
