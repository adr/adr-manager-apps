import { computed, readonly, ref } from "vue";
import { injectDemo, snapshotEditorState, teardownDemo } from "@/plugins/tour/demoRepository";
import { tourSteps } from "@/plugins/tour/steps";
import { store } from "@/plugins/store";
import type { TourSnapshot } from "@/plugins/tour/demoRepository";

const active = ref(false);
const stepIndex = ref(0);
const direction = ref<"forward" | "back">("forward");
let snapshot: TourSnapshot | undefined;

/**
 * App-wide guided tour, rendered by TourOverlay. Module-level singleton so the
 * topbar replay button, the welcome dialog and the overlay share one state.
 */
export function useTour() {
    const currentStep = computed(() => tourSteps[stepIndex.value]);

    function start(): void {
        if (active.value) {
            return;
        }
        snapshot = snapshotEditorState();
        // With an ADR already open the tour runs over the real state. Otherwise a
        // transient demo repository provides every anchor (see demoRepository.ts).
        if (!(store.currentRepository && store.currentlyEditedAdr)) {
            injectDemo();
        }
        stepIndex.value = 0;
        direction.value = "forward";
        tourSteps[0]?.onEnter?.();
        active.value = true;
    }

    function stop(): void {
        if (!active.value) {
            return;
        }
        currentStep.value?.onExit?.();
        active.value = false;
        if (snapshot) {
            // Safe in both modes: without demo state the snapshot matches the live state.
            teardownDemo(snapshot);
            snapshot = undefined;
        }
    }

    function next(): void {
        if (!active.value) {
            return;
        }
        if (stepIndex.value >= tourSteps.length - 1) {
            stop();
            return;
        }
        currentStep.value?.onExit?.();
        direction.value = "forward";
        stepIndex.value += 1;
        currentStep.value?.onEnter?.();
    }

    function prev(): void {
        if (!active.value || stepIndex.value === 0) {
            return;
        }
        currentStep.value?.onExit?.();
        direction.value = "back";
        stepIndex.value -= 1;
        currentStep.value?.onEnter?.();
    }

    /** Called by the overlay when a step's target is missing from the DOM. */
    function skipMissing(): void {
        if (direction.value === "back" && stepIndex.value > 0) {
            prev();
        } else {
            next();
        }
    }

    return {
        active: readonly(active),
        stepIndex: readonly(stepIndex),
        steps: tourSteps,
        currentStep,
        start,
        stop,
        next,
        prev,
        skipMissing
    };
}
