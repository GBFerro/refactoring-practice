import type { MemberAccount } from "./account";

export function returnItem(account: MemberAccount, itemId: string): boolean {
  const index = account.loans.findIndex((loan) => loan.itemId === itemId);
  if (index === -1) {
    return false;
  }
  account.loans.splice(index, 1);
  return true;
}
