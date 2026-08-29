import type { Loan } from "./loan";
import { daysBetween } from "./loan";

const FINE_PER_DAY_CENTS = 20;
const MAX_FINE_CENTS = 1000;

export function overdueFineCents(loan: Loan, today: string): number {
  const endDate = loan.returnedOn ?? today;
  if (endDate <= loan.dueOn) {
    return 0;
  }
  const daysLate = daysBetween(loan.dueOn, endDate);
  return Math.min(daysLate * FINE_PER_DAY_CENTS, MAX_FINE_CENTS);
}
