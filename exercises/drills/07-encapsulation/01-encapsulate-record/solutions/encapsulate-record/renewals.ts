import type { Loan, RenewalOutcome } from "./loan";

export function renewLoan(loan: Loan, today: string): RenewalOutcome {
  return loan.renew(today);
}
