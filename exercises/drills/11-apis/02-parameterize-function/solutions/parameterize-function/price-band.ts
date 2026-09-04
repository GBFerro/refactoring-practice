/** A price band on sale for one performance, e.g. "Stalls" or "Rear Circle Restricted View". */
export interface PriceBand {
  readonly code: string;
  readonly name: string;
  readonly pricePounds: number;
}

/** How close a performance is to selling out its remaining capacity. */
export type DemandTier = "low" | "medium" | "high";

/** The band code the box office uses for seats with a partially blocked sightline. */
export const RESTRICTED_VIEW_CODE = "RESTRICTED_VIEW";
