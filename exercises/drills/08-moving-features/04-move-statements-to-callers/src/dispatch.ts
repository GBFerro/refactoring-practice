import { renderDispatchNote } from "./note";
import type { DispatchStop } from "./types";

/** Produced when a stop goes out for delivery on one of the co-op's own routes. */
export function dispatchToDriver(stop: DispatchStop): string[] {
  return renderDispatchNote(stop, false);
}

/** Produced when a stop is outside every route and a paid courier carries it instead. */
export function dispatchToCourier(stop: DispatchStop): string[] {
  return renderDispatchNote(stop, true);
}
