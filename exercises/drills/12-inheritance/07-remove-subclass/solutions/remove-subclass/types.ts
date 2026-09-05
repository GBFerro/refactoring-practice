/** What Beckworth's front desk enters when a student joins for a term. */
export interface EnrolmentInput {
  readonly name: string;
  readonly instrument: string;
  readonly baseFeeCents: number;
  /** A one-term trial before committing to ongoing lessons. */
  readonly trial: boolean;
}
