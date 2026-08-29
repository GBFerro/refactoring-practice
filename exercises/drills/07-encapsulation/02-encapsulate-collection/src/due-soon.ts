import type { DueSoonEntry, MemberAccount } from "./account";
import type { Loan } from "./loan";
import { daysBetween } from "./loan";

export function loansDueSoon(
  account: MemberAccount,
  today: string,
  withinDays: number,
): readonly DueSoonEntry[] {
  return account.loans
    .map((loan) => toDueSoonEntry(loan, today))
    .filter((entry) => entry.daysUntilDue >= 0 && entry.daysUntilDue <= withinDays)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

function toDueSoonEntry(loan: Loan, today: string): DueSoonEntry {
  return {
    itemId: loan.itemId,
    dueOn: loan.dueOn,
    daysUntilDue: daysBetween(today, loan.dueOn),
  };
}
