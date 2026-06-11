<template>
    <teleport to="body">
        <div v-if="tour.active.value" class="tour-layer">
            <div class="tour-blocker" @wheel.prevent @touchmove.prevent></div>
            <div v-if="spotlight" class="tour-spotlight" :style="spotlightStyle"></div>
            <div v-else class="tour-dim"></div>
            <div
                ref="popoverEl"
                class="tour-popover"
                :class="{ centered: !spotlight }"
                :style="popoverStyle"
                role="dialog"
                aria-modal="true"
                aria-label="Application tour"
                tabindex="-1"
                data-cy="tourPopover"
            >
                <h3 data-cy="tourStepTitle">{{ step?.title }}</h3>
                <p>{{ step?.body }}</p>
                <footer>
                    <span class="count">{{ tour.stepIndex.value + 1 }} / {{ tour.steps.length }}</span>
                    <span class="spacer"></span>
                    <button v-if="!isLast" type="button" class="btn btn-ghost" data-cy="tourSkip" @click="tour.stop()">
                        Skip tour
                    </button>
                    <button
                        v-if="tour.stepIndex.value > 0"
                        type="button"
                        class="btn btn-outline"
                        data-cy="tourBack"
                        @click="tour.prev()"
                    >
                        Back
                    </button>
                    <button type="button" class="btn btn-primary" data-cy="tourNext" @click="tour.next()">
                        {{ isLast ? "Done" : "Next" }}
                    </button>
                </footer>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { useTour } from "@/composables/useTour";
import type { TourStep } from "@/plugins/tour/steps";

const SPOTLIGHT_PAD = 6;
const GAP = 10;
const MARGIN = 12;

interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}

const tour = useTour();
const step = tour.currentStep;
const isLast = computed(() => tour.stepIndex.value === tour.steps.length - 1);

const popoverEl = ref<HTMLElement | null>(null);
const spotlight = ref<Rect | null>(null);
const popoverStyle = ref<Record<string, string>>({});

let currentEl: Element | null = null;
let resizeObserver: ResizeObserver | undefined;

const spotlightStyle = computed(() => {
    const rect = spotlight.value;
    if (!rect) {
        return {};
    }
    return {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
    };
});

function resolveTarget(tourStep: TourStep): Element | null {
    if (typeof tourStep.target === "string") {
        return document.querySelector(tourStep.target);
    }
    return tourStep.target?.() ?? null;
}

function measure(): void {
    if (!tour.active.value) {
        return;
    }
    if (currentEl) {
        const rect = currentEl.getBoundingClientRect();
        spotlight.value = {
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + 2 * SPOTLIGHT_PAD,
            height: rect.height + 2 * SPOTLIGHT_PAD
        };
    } else {
        spotlight.value = null;
    }
    positionPopover();
}

function positionPopover(): void {
    const pop = popoverEl.value;
    const rect = spotlight.value;
    if (!pop || !rect) {
        popoverStyle.value = {};
        return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;

    let placement = step.value?.placement ?? "bottom";
    if (placement === "top" && rect.top - GAP - ph < MARGIN) {
        placement = "bottom";
    } else if (placement === "bottom" && rect.top + rect.height + GAP + ph > vh - MARGIN) {
        placement = "top";
    } else if (placement === "left" && rect.left - GAP - pw < MARGIN) {
        placement = "right";
    } else if (placement === "right" && rect.left + rect.width + GAP + pw > vw - MARGIN) {
        placement = "left";
    }

    let top: number;
    let left: number;
    switch (placement) {
        case "top":
            top = rect.top - GAP - ph;
            left = rect.left + rect.width / 2 - pw / 2;
            break;
        case "left":
            top = rect.top + rect.height / 2 - ph / 2;
            left = rect.left - GAP - pw;
            break;
        case "right":
            top = rect.top + rect.height / 2 - ph / 2;
            left = rect.left + rect.width + GAP;
            break;
        case "over":
            top = rect.top + rect.height / 2 - ph / 2;
            left = rect.left + rect.width / 2 - pw / 2;
            break;
        default:
            top = rect.top + rect.height + GAP;
            left = rect.left + rect.width / 2 - pw / 2;
    }
    top = Math.min(Math.max(top, MARGIN), Math.max(vh - ph - MARGIN, MARGIN));
    left = Math.min(Math.max(left, MARGIN), Math.max(vw - pw - MARGIN, MARGIN));
    popoverStyle.value = { top: `${top}px`, left: `${left}px` };
}

async function syncToStep(): Promise<void> {
    const tourStep = step.value;
    if (!tour.active.value || !tourStep) {
        return;
    }
    const el = resolveTarget(tourStep);
    if (tourStep.target && !el) {
        console.warn(`Tour step "${tourStep.id}" has no visible target, skipping.`);
        tour.skipMissing();
        return;
    }
    currentEl = el;
    resizeObserver?.disconnect();
    if (el) {
        resizeObserver?.observe(el);
        el.scrollIntoView({ block: "nearest" });
    }
    await nextTick();
    // Double rAF lets forced panes (explorer, preview) finish layout before measuring.
    requestAnimationFrame(() =>
        requestAnimationFrame(() => {
            measure();
            popoverEl.value?.focus();
        })
    );
}

function onKeydown(event: KeyboardEvent): void {
    if (!tour.active.value) {
        return;
    }
    if (event.key === "Escape") {
        event.preventDefault();
        tour.stop();
        return;
    }
    if (event.key === "ArrowRight") {
        event.preventDefault();
        tour.next();
        return;
    }
    if (event.key === "ArrowLeft") {
        event.preventDefault();
        tour.prev();
        return;
    }
    if (event.key === "Tab") {
        // The blocker stops clicks but not keyboard focus, so trap Tab in the popover.
        const pop = popoverEl.value;
        if (!pop) {
            return;
        }
        const buttons = Array.from(pop.querySelectorAll<HTMLElement>("button"));
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first || !last) {
            event.preventDefault();
            return;
        }
        const focused = document.activeElement;
        if (!pop.contains(focused)) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && focused === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && focused === last) {
            event.preventDefault();
            first.focus();
        }
    }
}

function onViewportChange(): void {
    measure();
}

watch(
    [() => tour.active.value, () => tour.stepIndex.value],
    ([isActive]) => {
        if (isActive) {
            void syncToStep();
        }
    },
    { flush: "post" }
);

watch(
    () => tour.active.value,
    (isActive) => {
        if (isActive) {
            resizeObserver = new ResizeObserver(() => measure());
            window.addEventListener("keydown", onKeydown);
            window.addEventListener("resize", onViewportChange);
            window.addEventListener("scroll", onViewportChange, true);
        } else {
            teardownListeners();
        }
    }
);

function teardownListeners(): void {
    resizeObserver?.disconnect();
    resizeObserver = undefined;
    currentEl = null;
    spotlight.value = null;
    popoverStyle.value = {};
    window.removeEventListener("keydown", onKeydown);
    window.removeEventListener("resize", onViewportChange);
    window.removeEventListener("scroll", onViewportChange, true);
}

onUnmounted(teardownListeners);
</script>

<style scoped>
.tour-layer {
    position: fixed;
    inset: 0;
    z-index: 100;
}

.tour-blocker {
    position: absolute;
    inset: 0;
}

.tour-dim {
    position: absolute;
    inset: 0;
    background: rgba(1, 0, 37, 0.45);
}

.tour-spotlight {
    position: absolute;
    border-radius: var(--adr-radius-md);
    box-shadow: 0 0 0 200vmax rgba(1, 0, 37, 0.45);
    transition:
        top 0.25s ease,
        left 0.25s ease,
        width 0.25s ease,
        height 0.25s ease;
}

.tour-popover {
    position: absolute;
    width: min(340px, calc(100vw - 24px));
    background: var(--adr-surface);
    border-radius: var(--adr-radius-md);
    box-shadow: var(--adr-shadow-pop);
    padding: 16px 18px 12px;
    outline: none;
    transition:
        top 0.25s ease,
        left 0.25s ease;
}

.tour-popover.centered {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(440px, calc(100vw - 24px));
    transition: none;
}

.tour-popover h3 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--adr-navy);
}

.tour-popover p {
    margin: 0;
    font-size: var(--adr-text-sm);
    line-height: 1.55;
    color: var(--adr-ink-2);
}

.tour-popover footer {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
}

.tour-popover footer .btn {
    white-space: nowrap;
    flex: 0 0 auto;
}

.tour-popover .count {
    font-size: 12px;
    color: var(--adr-ink-3);
    white-space: nowrap;
}

.tour-popover .spacer {
    flex: 1 1 auto;
}
</style>
