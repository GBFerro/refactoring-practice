/** One week of a plan, expressed relative to a runner rather than in absolute numbers. */
export interface TrainingWeek {
  readonly label: string;
  /** Multiplies the runner's own weekly base to get that week's target distance. */
  readonly loadFactor: number;
  /** Added to the runner's threshold pace to get that week's target pace. */
  readonly paceOffsetSecondsPerKm: number;
  readonly recovery: boolean;
}

/** A named block of weeks building toward one race, shared by every runner who follows it. */
export interface TrainingPlan {
  readonly race: string;
  readonly weeks: readonly TrainingWeek[];
}
