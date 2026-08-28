export interface Split {
  readonly label: string;
  /** Distance from the start line to this timing mat, in kilometres. */
  readonly km: number;
  /** Chip time as the runner crossed this mat, in whole seconds since the gun. */
  readonly elapsedSeconds: number;
}

export interface SplitSheet {
  readonly runner: string;
  readonly club: string;
  /** In the order the runner crossed the mats. */
  readonly splits: readonly Split[];
}

/** One leg of the race: mat to mat, or the start line to the first mat. */
export interface Segment {
  readonly label: string;
  readonly km: number;
  readonly elapsedSeconds: number;
  readonly durationSeconds: number;
}
