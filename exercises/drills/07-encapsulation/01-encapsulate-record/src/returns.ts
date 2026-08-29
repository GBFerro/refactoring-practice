import type { Loan } from "./loan";

export function returnLoan(loan: Loan, returnedOn: string): void {
  loan.returnedOn = returnedOn;
}
