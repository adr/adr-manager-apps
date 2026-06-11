/**
 * Pure positioning math for the tour overlay, kept DOM-free so it can be unit tested.
 */
export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Placement = "top" | "bottom" | "left" | "right";

export function computeSpotlightRect(target: Rect, padding: number): Rect {
  return {
    top: target.top - padding,
    left: target.left - padding,
    width: target.width + 2 * padding,
    height: target.height + 2 * padding
  };
}

/**
 * Places the popover on the preferred side of the target, flips to the opposite
 * side when there is no room, and clamps the result into the viewport.
 */
export function computePopoverPosition(
  target: Rect,
  popover: Size,
  viewport: Size,
  preferred: Placement,
  gap = 10,
  margin = 12
): { top: number; left: number; placement: Placement } {
  let placement = preferred;
  if (placement === "top" && target.top - gap - popover.height < margin) {
    placement = "bottom";
  } else if (placement === "bottom" && target.top + target.height + gap + popover.height > viewport.height - margin) {
    placement = "top";
  } else if (placement === "left" && target.left - gap - popover.width < margin) {
    placement = "right";
  } else if (placement === "right" && target.left + target.width + gap + popover.width > viewport.width - margin) {
    placement = "left";
  }

  let top: number;
  let left: number;
  switch (placement) {
    case "top":
      top = target.top - gap - popover.height;
      left = target.left + target.width / 2 - popover.width / 2;
      break;
    case "left":
      top = target.top + target.height / 2 - popover.height / 2;
      left = target.left - gap - popover.width;
      break;
    case "right":
      top = target.top + target.height / 2 - popover.height / 2;
      left = target.left + target.width + gap;
      break;
    default:
      top = target.top + target.height + gap;
      left = target.left + target.width / 2 - popover.width / 2;
  }
  top = Math.min(Math.max(top, margin), Math.max(viewport.height - popover.height - margin, margin));
  left = Math.min(Math.max(left, margin), Math.max(viewport.width - popover.width - margin, margin));
  return { top: top, left: left, placement: placement };
}
