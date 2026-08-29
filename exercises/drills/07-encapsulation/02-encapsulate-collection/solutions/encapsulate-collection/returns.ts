import type { MemberAccount } from "./account";

export function returnItem(account: MemberAccount, itemId: string): boolean {
  return account.returnItem(itemId);
}
