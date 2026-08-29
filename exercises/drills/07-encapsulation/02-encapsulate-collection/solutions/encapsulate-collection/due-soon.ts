import type { DueSoonEntry, MemberAccount } from "./account";

export function loansDueSoon(
  account: MemberAccount,
  today: string,
  withinDays: number,
): readonly DueSoonEntry[] {
  return account.loansDueSoon(today, withinDays);
}
