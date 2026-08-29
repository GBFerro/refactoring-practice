import type { Member } from "./member";

export function canBorrowMore(member: Member, itemsOnLoan: number): boolean {
  return itemsOnLoan < member.membership().tier().loanLimit();
}

export function remainingLoanAllowance(member: Member, itemsOnLoan: number): number {
  return Math.max(0, member.membership().tier().loanLimit() - itemsOnLoan);
}

export function formatLoanLimitLine(member: Member): string {
  return `${member.name}: loan limit ${String(member.membership().tier().loanLimit())}`;
}

export function isApproachingLoanLimit(member: Member, itemsOnLoan: number): boolean {
  return itemsOnLoan >= member.membership().tier().loanLimit() - 1;
}

export function holdQueueCapacity(member: Member): number {
  return member.membership().tier().loanLimit() * 2;
}

export function totalBranchLoanCapacity(members: readonly Member[]): number {
  return members.reduce((total, one) => total + one.membership().tier().loanLimit(), 0);
}
