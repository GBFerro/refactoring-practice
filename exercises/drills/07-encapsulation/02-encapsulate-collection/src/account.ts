import type { Loan } from "./loan";

export interface BorrowOutcome {
  readonly borrowed: boolean;
  readonly reason?: string;
}

export interface DueSoonEntry {
  readonly itemId: string;
  readonly dueOn: string;
  readonly daysUntilDue: number;
}

/** One member's account: who they are, and what they currently have on loan. */
export interface MemberAccount {
  readonly memberId: string;
  loans: Loan[];
}

export function openAccount(memberId: string): MemberAccount {
  return { memberId, loans: [] };
}

export function currentLoanCount(account: MemberAccount): number {
  return account.loans.length;
}
