import type { Trip } from "./trip";

/** "Elm Street to Pine & 5th" - or the bare station id, if it has since been retired. */
export function routeSummary(
  trip: Trip,
  stationNames: ReadonlyMap<string, string>,
): string {
  const from = stationNames.get(trip.startStationId) ?? trip.startStationId;
  const to = stationNames.get(trip.endStationId) ?? trip.endStationId;
  return `${from} to ${to}`;
}
