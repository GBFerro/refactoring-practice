export interface Entry {
  readonly name: string;
  readonly club: string;
  /** Chip time in whole seconds, or null when the runner did not finish. */
  readonly seconds: number | null;
}

export interface Race {
  readonly name: string;
  readonly date: string;
  readonly distanceKm: number;
  readonly entries: readonly Entry[];
}

export interface Finisher extends Entry {
  readonly seconds: number;
}
