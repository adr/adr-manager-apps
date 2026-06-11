<template>
  <div v-if="active" class="tour-layer">
    <div class="tour-blocker" @wheel.prevent @touchmove.prevent></div>
    <div v-if="spotlight" class="tour-spotlight" :style="spotlightStyle"></div>
    <div v-else class="tour-dim"></div>
    <div
      ref="popover"
      class="tour-popover"
      :class="{ centered: !spotlight }"
      :style="popoverStyle"
      role="dialog"
      aria-modal="true"
      aria-label="Tour"
      tabindex="-1"
      data-tour-popover
    >
      <h3>{{ step?.title }}</h3>
      <p>{{ step?.body }}</p>
      <footer v-if="isOfferStep">
        <span class="spacer"></span>
        <button type="button" class="btn btn-ghost" @click="answerOffer(false)">No thanks</button>
        <button type="button" class="btn btn-primary" @click="answerOffer(true)">Start tour</button>
      </footer>
      <footer v-else>
        <span class="count">{{ stepIndex + 1 }} / {{ steps.length }}</span>
        <span class="spacer"></span>
        <button v-if="!isLast" type="button" class="btn btn-ghost" @click="close('skipped')">Skip</button>
        <button v-if="stepIndex > 0" type="button" class="btn btn-outline" @click="prev">Back</button>
        <button type="button" class="btn btn-primary" @click="next">{{ isLast ? doneLabel : "Next" }}</button>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import { computePopoverPosition, computeSpotlightRect, type Rect } from "../tour/placement";
import type { TourStep } from "../tour/types";

const SPOTLIGHT_PAD = 6;
// Frames a step target may stay unresolved (async list renders) before the step is skipped.
const MISSING_FRAME_LIMIT = 12;

export default defineComponent({
  name: "TourOverlay",
  props: {
    steps: {
      type: Array as PropType<TourStep[]>,
      required: true
    },
    active: {
      type: Boolean,
      required: true
    },
    /** Renders the first step as the one-time offer (No thanks / Start tour). */
    offer: {
      type: Boolean,
      default: false
    },
    doneLabel: {
      type: String,
      default: "Done"
    }
  },
  emits: ["update:active", "offer-answered", "closed"],
  data() {
    return {
      stepIndex: 0,
      direction: 1,
      spotlight: null as Rect | null,
      popoverStyle: {} as Record<string, string>,
      currentEl: null as Element | null,
      missingFrames: 0,
      scrollPending: false,
      rafId: 0
    };
  },
  computed: {
    step(): TourStep | undefined {
      return this.steps[this.stepIndex];
    },
    isLast(): boolean {
      return this.stepIndex === this.steps.length - 1;
    },
    isOfferStep(): boolean {
      return this.offer && this.stepIndex === 0;
    },
    spotlightStyle(): Record<string, string> {
      if (!this.spotlight) {
        return {};
      }
      return {
        top: `${this.spotlight.top}px`,
        left: `${this.spotlight.left}px`,
        width: `${this.spotlight.width}px`,
        height: `${this.spotlight.height}px`
      };
    }
  },
  watch: {
    active(isActive: boolean) {
      if (isActive) {
        this.enterStep(0);
        window.addEventListener("keydown", this.onKeydown);
        this.rafId = requestAnimationFrame(this.syncFrame);
      } else {
        window.removeEventListener("keydown", this.onKeydown);
        cancelAnimationFrame(this.rafId);
        this.spotlight = null;
        this.popoverStyle = {};
        this.currentEl = null;
      }
    }
  },
  unmounted() {
    window.removeEventListener("keydown", this.onKeydown);
    cancelAnimationFrame(this.rafId);
  },
  methods: {
    enterStep(index: number) {
      this.stepIndex = index;
      this.currentEl = null;
      this.missingFrames = 0;
      this.scrollPending = true;
      this.steps[index]?.onEnter?.();
      this.$nextTick(() => {
        (this.$refs["popover"] as HTMLElement | undefined)?.focus();
      });
    },
    next() {
      this.step?.onExit?.();
      if (this.isLast) {
        this.close("finished");
        return;
      }
      this.direction = 1;
      this.enterStep(this.stepIndex + 1);
    },
    prev() {
      if (this.stepIndex === 0) {
        return;
      }
      this.step?.onExit?.();
      this.direction = -1;
      this.enterStep(this.stepIndex - 1);
    },
    answerOffer(accepted: boolean) {
      this.$emit("offer-answered", accepted);
      if (accepted) {
        this.next();
      } else {
        this.close("declined");
      }
    },
    close(reason: "finished" | "skipped" | "declined") {
      if (reason !== "finished") {
        this.step?.onExit?.();
      }
      this.$emit("update:active", false);
      this.$emit("closed", reason);
    },
    /**
     * Per-frame sync: re-resolves the target when the list re-renders underneath the
     * tour, follows panel resizes and scrolling, and skips steps whose target stays
     * missing. Early-exits on unchanged geometry to keep the loop cheap.
     */
    syncFrame() {
      if (!this.active) {
        return;
      }
      const step = this.step;
      if (step?.target) {
        if (!this.currentEl || !this.currentEl.isConnected) {
          this.currentEl = document.querySelector(step.target);
        }
        if (!this.currentEl) {
          this.missingFrames += 1;
          if (this.missingFrames > MISSING_FRAME_LIMIT) {
            console.warn(`Tour step "${step.id}" has no target, skipping.`);
            if (this.direction < 0 && this.stepIndex > 0) {
              this.prev();
            } else {
              this.next();
            }
          }
        } else {
          if (this.scrollPending) {
            this.currentEl.scrollIntoView({ block: "center" });
            this.scrollPending = false;
          }
          const rect = this.currentEl.getBoundingClientRect();
          const next = computeSpotlightRect(
            { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
            SPOTLIGHT_PAD
          );
          const prev = this.spotlight;
          if (
            !prev ||
            prev.top !== next.top ||
            prev.left !== next.left ||
            prev.width !== next.width ||
            prev.height !== next.height
          ) {
            this.spotlight = next;
          }
          this.positionPopover(next);
        }
      } else if (this.spotlight) {
        this.spotlight = null;
        this.popoverStyle = {};
      }
      this.rafId = requestAnimationFrame(this.syncFrame);
    },
    positionPopover(target: Rect) {
      const popover = this.$refs["popover"] as HTMLElement | undefined;
      if (!popover) {
        return;
      }
      const position = computePopoverPosition(
        target,
        { width: popover.offsetWidth, height: popover.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
        this.step?.placement ?? "bottom"
      );
      const top = `${position.top}px`;
      const left = `${position.left}px`;
      if (this.popoverStyle["top"] !== top || this.popoverStyle["left"] !== left) {
        this.popoverStyle = { top: top, left: left };
      }
    },
    onKeydown(event: KeyboardEvent) {
      if (!this.active) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        if (this.isOfferStep) {
          this.answerOffer(false);
        } else {
          this.close("skipped");
        }
        return;
      }
      if (event.key === "ArrowRight" && !this.isOfferStep) {
        event.preventDefault();
        this.next();
        return;
      }
      if (event.key === "ArrowLeft" && !this.isOfferStep) {
        event.preventDefault();
        this.prev();
        return;
      }
      if (event.key === "Tab") {
        // The blocker stops clicks but not keyboard focus, so trap Tab in the popover.
        const popover = this.$refs["popover"] as HTMLElement | undefined;
        if (!popover) {
          return;
        }
        const buttons = Array.from(popover.querySelectorAll<HTMLElement>("button"));
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first || !last) {
          event.preventDefault();
          return;
        }
        const focused = document.activeElement;
        if (!popover.contains(focused)) {
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
  }
});
</script>

<style scoped>
.tour-layer {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.tour-blocker {
  position: absolute;
  inset: 0;
}

.tour-dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.tour-spotlight {
  position: absolute;
  border-radius: 10px;
  box-shadow: 0 0 0 200vmax rgba(0, 0, 0, 0.5);
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
  border: 1px solid var(--adr-line);
  border-radius: var(--adr-radius-md);
  box-shadow: var(--adr-shadow-pop);
  padding: 14px 16px 10px;
  outline: none;
}

.tour-popover.centered {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(420px, calc(100vw - 24px));
}

.tour-popover h3 {
  margin: 0 0 6px;
  font-size: var(--adr-text-h3);
  font-weight: 600;
  color: var(--adr-ink);
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
  margin-top: 12px;
}

.tour-popover footer .btn {
  white-space: nowrap;
  flex: 0 0 auto;
}

.tour-popover .count {
  font-size: var(--adr-text-xs);
  color: var(--adr-ink-3);
  white-space: nowrap;
}

.tour-popover .spacer {
  flex: 1 1 auto;
}

/* High contrast zeroes the token shadows, so the cutout needs an explicit outline. */
:global(body.vscode-high-contrast) .tour-spotlight {
  outline: 2px solid var(--adr-focus);
}
</style>
