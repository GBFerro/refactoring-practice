export interface Race {
  readonly name: string;
  /** ISO calendar date, `yyyy-mm-dd`. */
  readonly date: string;
  readonly distanceKm: number;
}

export interface Season {
  readonly club: string;
  readonly year: number;
  /** The day the season opened, ISO. */
  readonly opensOn: string;
  readonly races: readonly Race[];
}
