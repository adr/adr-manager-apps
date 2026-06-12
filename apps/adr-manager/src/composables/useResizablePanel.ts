import { computed, ref } from "vue";
import { lsGet, lsSet } from "@/plugins/storage";
import type { StorageKey } from "@/plugins/storage";

interface ResizablePanelOptions {
    storageKey: StorageKey;
    min: number;
    max: number;
    defaultWidth: number;
    /** Which edge of the panel carries the drag handle. */
    handle: "left" | "right";
    /** Below this raw drag width the panel collapses to `collapseTo`, or closes via `onCollapse` when no `collapseTo` is given. */
    collapseBelow?: number;
    collapseTo?: number;
    onCollapse?: () => void;
}

/**
 * Drag-to-resize behavior for a side panel, persisted to localStorage.
 */
export function useResizablePanel(options: ResizablePanelOptions) {
    const { storageKey, min, max, defaultWidth, handle, collapseBelow, collapseTo, onCollapse } = options;

    const width = ref(restoreWidth());
    const lastExpandedWidth = ref(collapseTo !== undefined && width.value <= collapseTo ? defaultWidth : width.value);
    const collapsed = computed(() => collapseTo !== undefined && width.value <= collapseTo);

    function restoreWidth(): number {
        const stored = parseInt(lsGet(storageKey) ?? "", 10);
        if (collapseTo !== undefined && Number.isFinite(stored) && stored <= collapseTo) {
            return collapseTo;
        }
        const wanted = Number.isFinite(stored) ? clamp(stored) : defaultWidth;
        // Widths persisted on a larger screen must not dominate a smaller one.
        return Math.max(min, Math.min(wanted, Math.floor(window.innerWidth * 0.4)));
    }

    function clamp(value: number): number {
        return Math.min(max, Math.max(min, value));
    }

    function persist(): void {
        lsSet(storageKey, String(width.value));
    }

    function expand(): void {
        width.value = lastExpandedWidth.value;
        persist();
    }

    function startResize(event: MouseEvent): void {
        event.preventDefault();
        const startX = event.clientX;
        const startWidth = width.value;
        document.body.classList.add("resizing-x");
        const stop = (): void => {
            document.body.classList.remove("resizing-x");
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", stop);
            persist();
        };
        const move = (moveEvent: MouseEvent): void => {
            const delta = moveEvent.clientX - startX;
            const raw = handle === "right" ? startWidth + delta : startWidth - delta;
            if (collapseBelow !== undefined && raw < collapseBelow) {
                if (collapseTo !== undefined) {
                    width.value = collapseTo;
                } else {
                    stop();
                    onCollapse?.();
                }
                return;
            }
            width.value = clamp(raw);
            lastExpandedWidth.value = width.value;
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", stop);
    }

    return { width, collapsed, startResize, expand };
}
