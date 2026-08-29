import type { BorrowOutcome, MemberAccount } from "./account";

const MAX_LOANS_PER_MEMBER = 5;

export function borrowItem(
  account: MemberAccount,
  itemId: string,
  dueOn: string,
): BorrowOutcome {
  if (account.loans.length >= MAX_LOANS_PER_MEMBER) {
    return { borrowed: false, reason: `${account.memberId} is at the loan limit` };
  }
  if (account.loans.some((loan) => loan.itemId === itemId)) {
    return { borrowed: false, reason: `${account.memberId} already holds ${itemId}` };
  }
  account.loans.push({ itemId, dueOn });
  return { borrowed: true };
}
