/** A seat under consideration for a surprise upgrade offer. */
export interface Seat {
  readonly section: string;
  readonly distanceFromStageMeters: number;
  readonly offsetFromCenterMeters: number;
  readonly hasRestrictedView: boolean;
}

/** A general-admission standing spot, ranked the same way but not a seat at all. */
export interface StandingSpot {
  readonly label: string;
  readonly distanceFromStageMeters: number;
  readonly offsetFromCenterMeters: number;
}
