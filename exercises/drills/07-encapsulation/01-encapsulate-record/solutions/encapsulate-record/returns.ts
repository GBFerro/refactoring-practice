import type { Loan } from "./loan";

export function returnLoan(loan: Loan, returnedOn: string): void {
  loan.markReturned(returnedOn);
}
