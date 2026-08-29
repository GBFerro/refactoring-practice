import type { Loan } from "./loan";
import { daysBetween } from "./loan";

const GRACE_DAYS = 3;
const FINE_CAP_CENTS = 1500;
const DAILY_RATE_CENTS: Record<Loan["itemKind"], number> = {
  book: 10,
  dvd: 50,
  equipment: 100,
};

/**
 * The one line shown for a loan on the billing job's printed run. Grown one policy detail
 * at a time - a grace period here, a per-item rate there, a cap after that - and each
 * detail left behind a variable this function has been carrying around ever since.
 */
export function overdueNotice(loan: Loan, today: string): string {
  const effectiveDate = loan.returnedOn ?? today;
  const late = daysBetween(loan.dueOn, effectiveDate);

  if (late <= 0) {
    return "Not overdue.";
  }

  const chargeable = Math.max(0, late - GRACE_DAYS);
  if (chargeable === 0) {
    return `${String(late)} day(s) overdue, within the grace period - no fine.`;
  }

  const dailyRateCents = DAILY_RATE_CENTS[loan.itemKind];
  const rawFineCents = chargeable * dailyRateCents;
  const wasCapped = rawFineCents > FINE_CAP_CENTS;
  const fineCents = Math.min(rawFineCents, FINE_CAP_CENTS);

  const amount = `$${(fineCents / 100).toFixed(2)}`;
  const capNote = wasCapped ? " (capped)" : "";
  return `${String(late)} day(s) overdue (${String(chargeable)} chargeable) - fine ${amount}${capNote}.`;
}
