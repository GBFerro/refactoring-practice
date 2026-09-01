import { renderStopSummary, totalWeightGrams } from "./note";
import type { DispatchStop } from "./types";

/** Produced when a stop goes out for delivery on one of the co-op's own routes. */
export function dispatchToDriver(stop: DispatchStop): string[] {
  const grams = totalWeightGrams(stop.items);
  return [
    ...renderStopSummary(stop),
    `Total weight: ${grams} g`,
    "Please sign at the door to confirm receipt.",
  ];
}

/** Produced when a stop is outside every route and a paid courier carries it instead. */
export function dispatchToCourier(stop: DispatchStop): string[] {
  const kilograms = totalWeightGrams(stop.items) / 1000;
  return [
    ...renderStopSummary(stop),
    `Total weight: ${formatKilograms(kilograms)} kg`,
    "Courier handoff — Ashgrove liability ends at pickup.",
  ];
}

function formatKilograms(kilograms: number): string {
  return kilograms.toFixed(1);
}
