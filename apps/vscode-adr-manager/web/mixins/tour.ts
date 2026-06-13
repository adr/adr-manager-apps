import { defineComponent } from "vue";

// The VS Code API is acquired once in the webview HTML (see WebPanel) under the constant "vscode"
declare const vscode: { postMessage(message: { command: string; data?: unknown }): void };

/**
 * Shared tour protocol for the webview pages. The host keeps the persistent
 * "seen" flags in globalState; the page asks for them on mount (getTourState)
 * and reports back when the user has answered the offer or closed the tour
 * (setTourSeen). The main page additionally honors the consumed-on-read
 * forceStart flag set by the "ADR Manager: Show Tour" command.
 *
 * A component using this mixin may define `beforeTourStart()` (e.g. to inject
 * demo data) and `afterTourClosed()` (e.g. to remove it) as hooks.
 */
export default function createTourMixin(kind: "main" | "editor") {
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
      vscode.postMessage({ command: "getTourState" });
    },
    beforeUnmount() {
      window.removeEventListener("message", this.handleTourStateMessage);
    },
    methods: {
      handleTourStateMessage(event: MessageEvent) {
        const message = event.data;
        if (message.command !== "getTourState") {
          return;
        }
        const seen = kind === "main" ? message.seenMainTour : message.seenEditorTour;
        this.tourSeen = seen;
        if (!seen || (kind === "main" && message.forceStart)) {
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
      onTourClosed() {
        if (kind === "editor") {
          this.markTourSeen();
        }
        (this as unknown as { afterTourClosed?: () => void }).afterTourClosed?.();
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
