import type { Loan, RenewalOutcome } from "./loan";
import { LOAN_PERIOD_DAYS, addDays } from "./loan";

const MAX_RENEWALS = 2;

export function renewLoan(loan: Loan, today: string): RenewalOutcome {
  if (loan.returnedOn !== null) {
    return { renewed: false, reason: `loan ${loan.id} was already returned` };
  }
  if (loan.renewalCount >= MAX_RENEWALS) {
    return { renewed: false, reason: `loan ${loan.id} has no renewals left` };
  }
  loan.dueOn = addDays(today, LOAN_PERIOD_DAYS);
  loan.renewalCount = loan.renewalCount + 1;
  return { renewed: true };
}
