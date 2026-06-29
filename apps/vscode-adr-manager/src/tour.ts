export type TourKind = "main" | "editor";
export type TourCloseReason = "finished" | "skipped" | "declined";

export interface TourStateResponse {
  command: "getTourState";
  seen: boolean;
  forceStart: boolean;
}

const DEMO_ADR_PATH_PREFIX = "__tour-demo__/";

export function getDemoAdrPath(fileName: string): string {
  return `${DEMO_ADR_PATH_PREFIX}${fileName}`;
}

export function isDemoAdrPath(path: unknown): path is string {
  return typeof path === "string" && path.startsWith(DEMO_ADR_PATH_PREFIX);
}

export function consumeQueuedTourStart(queue: Set<TourKind>, kind: TourKind): boolean {
  return queue.delete(kind);
}
