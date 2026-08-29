import type { Member } from "./member";

export function canBorrowMore(member: Member, itemsOnLoan: number): boolean {
  return itemsOnLoan < member.loanLimit();
}

export function remainingLoanAllowance(member: Member, itemsOnLoan: number): number {
  return Math.max(0, member.loanLimit() - itemsOnLoan);
}

export function formatLoanLimitLine(member: Member): string {
  return `${member.name}: loan limit ${String(member.loanLimit())}`;
}

export function isApproachingLoanLimit(member: Member, itemsOnLoan: number): boolean {
  return itemsOnLoan >= member.loanLimit() - 1;
}

export function holdQueueCapacity(member: Member): number {
  return member.loanLimit() * 2;
}

export function totalBranchLoanCapacity(members: readonly Member[]): number {
  return members.reduce((total, one) => total + one.loanLimit(), 0);
}
