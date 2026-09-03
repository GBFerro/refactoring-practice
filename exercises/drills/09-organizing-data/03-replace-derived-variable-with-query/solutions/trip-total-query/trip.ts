/** One ride on a Riverline bike, from dock to dock. */
export interface Trip {
  readonly id: string;
  readonly riderId: string;
  readonly startStationId: string;
  readonly endStationId: string;
  /**
   * What the rider is charged for this trip, in cents. Not fixed at ride's end - see
   * applyLateReturnFee, which can still change it hours later.
   */
  fareCents: number;
}
