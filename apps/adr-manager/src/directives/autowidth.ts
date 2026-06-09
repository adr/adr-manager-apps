import type { Directive } from "vue";

/** Options for the {@link vAutowidth} directive (mirrors the old vue-input-autowidth options). */
export interface AutowidthOptions {
    maxWidth?: string;
    minWidth?: string;
    comfortZone?: number;
}

const handlers = new WeakMap<HTMLInputElement, () => void>();

function resize(el: HTMLInputElement, options: AutowidthOptions): void {
    const styles = window.getComputedStyle(el);
    const span = document.createElement("span");
    span.style.position = "absolute";
    span.style.visibility = "hidden";
    span.style.whiteSpace = "pre";
    span.style.font = styles.font;
    span.style.fontSize = styles.fontSize;
    span.style.fontFamily = styles.fontFamily;
    span.style.letterSpacing = styles.letterSpacing;
    span.textContent = el.value || el.placeholder || "";
    document.body.appendChild(span);
    let width = span.getBoundingClientRect().width + (options.comfortZone ?? 0);
    document.body.removeChild(span);

    if (options.minWidth) {
        width = Math.max(width, Number.parseFloat(options.minWidth));
    }
    if (options.maxWidth) {
        width = Math.min(width, Number.parseFloat(options.maxWidth));
    }
    el.style.width = `${width}px`;
}

/**
 * Resizes an `<input>` element to fit its content. Replaces the Vue-2-only `vue-input-autowidth`.
 */
export const vAutowidth: Directive<HTMLInputElement, AutowidthOptions | undefined> = {
    mounted(el, binding) {
        const handler = (): void => resize(el, binding.value ?? {});
        handlers.set(el, handler);
        handler();
        el.addEventListener("input", handler);
    },
    updated(el, binding) {
        resize(el, binding.value ?? {});
    },
    unmounted(el) {
        const handler = handlers.get(el);
        if (handler) {
            el.removeEventListener("input", handler);
            handlers.delete(el);
        }
    }
};
