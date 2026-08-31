/** One delivery on a route: who it is for, and the leg distance to reach them. */
export interface Stop {
  readonly customerId: string;
  /** Distance from the previous stop, or from the bakery for the first stop. */
  readonly legDistanceKm: number;
  /** Rough window the driver expects to arrive in, e.g. "07:00-07:30". */
  readonly arrivalWindow: string;
}

/** One driver's morning run: an ordered list of stops, and how the run ends. */
export interface Route {
  readonly id: string;
  /** The name printed on the route sheet, e.g. "Riverside Loop". */
  readonly name: string;
  readonly driverName: string;
  /** Time the driver leaves the bakery, e.g. "06:30". */
  readonly departsAt: string;
  readonly stops: readonly Stop[];
  /** Distance from the last stop back to the bakery, when the route loops back. */
  readonly returnLegKm: number;
  /** False when the driver's day ends at the last delivery instead of at the bakery. */
  readonly loopsBackToDepot: boolean;
}
