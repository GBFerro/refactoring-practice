/** The money owed for one runner's registration, and the numbers that explain it. */
export interface RegistrationCharge {
  readonly runnerName: string;
  readonly baseFeeCents: number;
  readonly memberDiscountCents: number;
  readonly promoDiscountCents: number;
  readonly totalCents: number;
}
