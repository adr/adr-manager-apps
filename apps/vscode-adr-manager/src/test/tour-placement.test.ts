import { describe, expect, test } from "vitest";
import { computePopoverPosition, computeSpotlightRect } from "../../web/tour/placement";

const VIEWPORT = { width: 1000, height: 600 };
const POPOVER = { width: 300, height: 150 };

describe("computeSpotlightRect", () => {
  test("pads the target rect on all sides", () => {
    const rect = computeSpotlightRect({ top: 100, left: 200, width: 50, height: 20 }, 6);
    expect(rect).toEqual({ top: 94, left: 194, width: 62, height: 32 });
  });
});

describe("computePopoverPosition", () => {
  test("places the popover below the target by default", () => {
    const target = { top: 100, left: 400, width: 100, height: 40 };
    const position = computePopoverPosition(target, POPOVER, VIEWPORT, "bottom");
    expect(position.placement).toBe("bottom");
    expect(position.top).toBe(100 + 40 + 10);
    expect(position.left).toBe(400 + 50 - 150);
  });

  test("flips from bottom to top when there is no room below", () => {
    const target = { top: 520, left: 400, width: 100, height: 40 };
    const position = computePopoverPosition(target, POPOVER, VIEWPORT, "bottom");
    expect(position.placement).toBe("top");
    expect(position.top).toBe(520 - 10 - 150);
  });

  test("flips from right to left when there is no room on the right", () => {
    const target = { top: 200, left: 850, width: 100, height: 40 };
    const position = computePopoverPosition(target, POPOVER, VIEWPORT, "right");
    expect(position.placement).toBe("left");
    expect(position.left).toBe(850 - 10 - 300);
  });

  test("clamps the popover into the viewport", () => {
    const target = { top: 10, left: 10, width: 30, height: 20 };
    const position = computePopoverPosition(target, POPOVER, VIEWPORT, "bottom");
    expect(position.left).toBe(12);
    expect(position.top).toBeGreaterThanOrEqual(12);
  });

  test("never returns negative coordinates even for tiny viewports", () => {
    const target = { top: 0, left: 0, width: 10, height: 10 };
    const position = computePopoverPosition(target, POPOVER, { width: 200, height: 100 }, "top");
    expect(position.top).toBeGreaterThanOrEqual(12);
    expect(position.left).toBeGreaterThanOrEqual(12);
  });
});
