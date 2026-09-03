import type { Trip } from "./trip";

/** Fare for a completed trip, at a flat per-minute rate. */
export function fareCents(trip: Trip, centsPerMinute: number): number {
  return trip.dt * centsPerMinute;
}
