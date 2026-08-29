import type { BorrowOutcome, MemberAccount } from "./account";

export function borrowItem(
  account: MemberAccount,
  itemId: string,
  dueOn: string,
): BorrowOutcome {
  return account.borrow(itemId, dueOn);
}
