export interface DebouncedFn<A extends unknown[]> {
    (...args: A): void;
    cancel(): void;
}

/**
 * Returns a debounced version of `fn` that delays invocation until `delay` ms have
 * elapsed since the last call.
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, delay: number): DebouncedFn<A> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const debounced = (...args: A): void => {
        if (timer !== undefined) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            timer = undefined;
            fn(...args);
        }, delay);
    };
    debounced.cancel = (): void => {
        if (timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
        }
    };
    return debounced;
}
