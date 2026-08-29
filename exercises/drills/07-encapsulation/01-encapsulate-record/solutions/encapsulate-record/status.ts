import type { Loan } from "./loan";
import { daysBetween } from "./loan";

export function renderLoanStatus(loan: Loan, today: string): string {
  if (loan.returnedOn !== null) {
    return `Returned on ${loan.returnedOn}`;
  }
  if (today > loan.dueOn) {
    return `${String(daysBetween(loan.dueOn, today))} day(s) overdue`;
  }
  return `On loan until ${loan.dueOn}`;
}
