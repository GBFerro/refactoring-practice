/** One completed ride, from unlock to dock. */
export interface Trip {
  /** Minutes from unlock to dock. */
  readonly dt: number;
  /** Docking station the rider unlocked the bike from. */
  readonly st: string;
  /** Docking station the rider docked the bike at. */
  readonly en: string;
}

/** Assembled once both the unlock and dock events for a ride have arrived. */
export function newTrip(dt: number, st: string, en: string): Trip {
  return { dt, st, en };
}
