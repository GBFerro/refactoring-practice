import type { Loan } from "./loan";
import { daysLate } from "./loan";

const GRACE_DAYS = 3;
const FINE_CAP_CENTS = 1500;
const DAILY_RATE_CENTS: Record<Loan["itemKind"], number> = {
  book: 10,
  dvd: 50,
  equipment: 100,
};

/** Days a loan is actually charged for, once the grace period is subtracted. */
export function chargeableDays(loan: Loan, today: string): number {
  return Math.max(0, daysLate(loan, today) - GRACE_DAYS);
}

function rawFineCents(loan: Loan, today: string): number {
  return chargeableDays(loan, today) * DAILY_RATE_CENTS[loan.itemKind];
}

/** The fine owed, in cents, after the per-item cap is applied. */
export function fineCents(loan: Loan, today: string): number {
  return Math.min(rawFineCents(loan, today), FINE_CAP_CENTS);
}

/** True when the cap actually reduced the fine below what the days and rate imply. */
export function fineWasCapped(loan: Loan, today: string): boolean {
  return rawFineCents(loan, today) > FINE_CAP_CENTS;
}
