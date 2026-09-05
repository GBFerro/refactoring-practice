/** Someone who teaches at Beckworth. */
export interface Tutor {
  readonly name: string;
  readonly hourlyRateCents: number;
}

/** Someone enrolled in a lesson. */
export interface Student {
  readonly name: string;
}
