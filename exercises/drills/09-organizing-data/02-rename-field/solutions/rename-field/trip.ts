/** One completed ride, from unlock to dock. */
export interface Trip {
  /** Minutes from unlock to dock confirmation. */
  readonly durationMinutes: number;
  /** Docking station the rider unlocked the bike from. */
  readonly startStationId: string;
  /** Docking station the rider docked the bike at. */
  readonly endStationId: string;
}

/** Assembled once both the unlock and dock events for a ride have arrived. */
export function newTrip(
  durationMinutes: number,
  startStationId: string,
  endStationId: string,
): Trip {
  return { durationMinutes, startStationId, endStationId };
}
