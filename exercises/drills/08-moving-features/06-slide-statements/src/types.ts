export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

/** One item the co-op can bake: how it's ordered, and how it's baked in batches. */
export interface BakeItem {
  readonly sku: string;
  readonly name: string;
  /** Where it sits in the shop, e.g. "Bread Wall", "Pastry Case". */
  readonly aisle: string;
  /** Units per oven batch; a bake quantity always rounds up to a multiple of this. */
  readonly batchSize: number;
  /** Fraction of standing-order units added as counter stock, e.g. 0.1 for 10%. */
  readonly wastageAllowance: number;
}

/** A recurring order from a cafe or shop, delivered on the days it names. */
export interface StandingOrder {
  readonly sku: string;
  readonly customer: string;
  readonly daysOfWeek: readonly DayOfWeek[];
  readonly units: number;
}

/** The day a plan is being built for, already resolved to a weekday. */
export interface BakeDate {
  readonly iso: string;
  readonly dayOfWeek: DayOfWeek;
}
