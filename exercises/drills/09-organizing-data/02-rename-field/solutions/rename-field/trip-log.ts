import type { Trip } from "./trip";

/**
 * The row shape already published to Riverline's analytics warehouse. An external
 * batch job reads these exact keys from a CSV export; nothing in this repository
 * consumes them, so nothing in this repository gets to rename them.
 */
export interface TripLogRow {
  readonly dt: number;
  readonly st: string;
  readonly en: string;
}

export function tripLogRow(trip: Trip): TripLogRow {
  return { dt: trip.durationMinutes, st: trip.startStationId, en: trip.endStationId };
}
