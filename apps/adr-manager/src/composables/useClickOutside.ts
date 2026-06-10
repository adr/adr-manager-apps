import { onBeforeUnmount, onMounted } from "vue";
import type { Ref } from "vue";

/**
 * Calls the handler when a pointer-down lands outside the given element.
 * Used by the custom dropdown menus to close themselves.
 */
export function useClickOutside(target: Ref<HTMLElement | null>, handler: () => void): void {
    const onMousedown = (event: MouseEvent): void => {
        if (target.value && !target.value.contains(event.target as Node)) {
            handler();
        }
    };

    onMounted(() => document.addEventListener("mousedown", onMousedown));
    onBeforeUnmount(() => document.removeEventListener("mousedown", onMousedown));
}
