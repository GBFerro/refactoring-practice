/** A timing-mat reading during a training run: cumulative distance and elapsed time. */
export interface Checkpoint {
  readonly markerKm: number;
  readonly elapsedSeconds: number;
}

/** One runner's checkpoint log for a single training session. */
export interface SplitLog {
  readonly runner: string;
  readonly session: string;
  readonly checkpoints: readonly Checkpoint[];
}
