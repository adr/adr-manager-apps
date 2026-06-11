export interface TourStep {
  id: string;
  /** CSS selector for the spotlighted element. Undefined renders a centered card over a full-screen dim. */
  target?: string;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right";
  onEnter?: () => void;
  onExit?: () => void;
}
