import { defineComponent } from "vue";
import type { TourCloseReason, TourKind, TourStateResponse } from "../../src/tour";

// The VS Code API is acquired once in the webview HTML (see WebPanel) under the constant "vscode"
declare const vscode: { postMessage(message: { command: string; data?: unknown }): void };

/**
 * Shared tour protocol for the webview pages. The host keeps the persistent
 * "seen" flags in globalState; the page asks for them on mount (getTourState)
 * and reports back when the user has answered the offer or closed the tour
 * (setTourSeen). Each page requests and consumes the state for its own tour kind.
 *
 * A component using this mixin may define `beforeTourStart()` (e.g. to inject
 * demo data) and `afterTourClosed(reason)` (e.g. to remove it) as hooks.
 */
export default function createTourMixin(kind: TourKind) {
  return defineComponent({
    data() {
      return {
        tourActive: false,
        // Assume seen until the host says otherwise so the tour never double-fires.
        tourSeen: true,
        tourOffer: false
      };
    },
    mounted() {
      window.addEventListener("message", this.handleTourStateMessage);
      vscode.postMessage({ command: "getTourState", data: { kind } });
    },
    beforeUnmount() {
      window.removeEventListener("message", this.handleTourStateMessage);
    },
    methods: {
      handleTourStateMessage(event: MessageEvent) {
        const message = event.data as TourStateResponse;
        if (message.command !== "getTourState") {
          return;
        }
        this.tourSeen = message.seen;
        if (!message.seen || message.forceStart) {
          this.startTour();
        }
      },
      startTour() {
        if (this.tourActive) {
          return;
        }
        this.tourOffer = kind === "main" && !this.tourSeen;
        // The hook may be async (the main view waits for the initial ADR list
        // before deciding whether to show demo entries).
        const hook = (this as unknown as { beforeTourStart?: () => void | Promise<void> }).beforeTourStart?.();
        Promise.resolve(hook).then(() => {
          this.$nextTick(() => {
            this.tourActive = true;
          });
        });
      },
      onTourOfferAnswered() {
        this.markTourSeen();
      },
      onTourClosed(reason: TourCloseReason) {
        if (kind === "editor") {
          this.markTourSeen();
        }
        (this as unknown as { afterTourClosed?: (reason: TourCloseReason) => void }).afterTourClosed?.(reason);
      },
      markTourSeen() {
        if (!this.tourSeen) {
          this.tourSeen = true;
          vscode.postMessage({ command: "setTourSeen", data: { tour: kind } });
        }
      }
    }
  });
}
