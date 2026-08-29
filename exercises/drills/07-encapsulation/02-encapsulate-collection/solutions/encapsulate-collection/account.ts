import type { Loan } from "./loan";
import { daysBetween } from "./loan";

const MAX_LOANS_PER_MEMBER = 5;

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
export class MemberAccount {
  readonly memberId: string;
  #loans: Loan[];

  constructor(memberId: string) {
    this.memberId = memberId;
    this.#loans = [];
  }

  get loanCount(): number {
    return this.#loans.length;
  }

  borrow(itemId: string, dueOn: string): BorrowOutcome {
    if (this.#loans.length >= MAX_LOANS_PER_MEMBER) {
      return { borrowed: false, reason: `${this.memberId} is at the loan limit` };
    }
    if (this.#loans.some((loan) => loan.itemId === itemId)) {
      return { borrowed: false, reason: `${this.memberId} already holds ${itemId}` };
    }
    this.#loans.push({ itemId, dueOn });
    return { borrowed: true };
  }

  returnItem(itemId: string): boolean {
    const index = this.#loans.findIndex((loan) => loan.itemId === itemId);
    if (index === -1) {
      return false;
    }
    this.#loans.splice(index, 1);
    return true;
  }

  loansDueSoon(today: string, withinDays: number): DueSoonEntry[] {
    return this.#loans
      .map((loan) => toDueSoonEntry(loan, today))
      .filter((entry) => entry.daysUntilDue >= 0 && entry.daysUntilDue <= withinDays)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  }
}

function toDueSoonEntry(loan: Loan, today: string): DueSoonEntry {
  return {
    itemId: loan.itemId,
    dueOn: loan.dueOn,
    daysUntilDue: daysBetween(today, loan.dueOn),
  };
}

export function openAccount(memberId: string): MemberAccount {
  return new MemberAccount(memberId);
}

export function currentLoanCount(account: MemberAccount): number {
  return account.loanCount;
}
