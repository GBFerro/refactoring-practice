/** One per-minute pricing band. Bands are contiguous and ordered by minMinutes. */
export interface Tier {
  readonly minMinutes: number;
  /** Open-ended when null - Riverline's top band has no ceiling. */
  readonly maxMinutes: number | null;
  readonly centsPerMinute: number;
}

/** A station-to-station bike rental, priced by however many tiers its duration crosses. */
export interface Tariff {
  readonly tiers: readonly Tier[];
  /** Refundable hold taken at unlock; released once the bike is confirmed docked. */
  readonly depositCents: number;
}

export interface Trip {
  readonly durationMinutes: number;
  readonly dockConfirmed: boolean;
}

/** What a rider owes once a trip is closed out: the meter's answer and the deposit's. */
export interface TripCost {
  readonly meteredFareCents: number;
  readonly depositRefundCents: number;
  readonly totalDueCents: number;
}
