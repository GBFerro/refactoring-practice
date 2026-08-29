import type { Branch } from "./branch";

export function formatManagerCard(branch: Branch): string {
  return [branch.managerName(), branch.managerEmail(), branch.managerPhone()].join("\n");
}

export function canApproveRareBookLoan(branch: Branch): boolean {
  return branch.isManagerCertifiedForRareBooks() && !branch.isManagerOnLeave();
}

export function managerSeniorityBadge(branch: Branch): string {
  return branch.managerYearsOfService() >= 10 ? "Senior" : "Standard";
}

export function escalationContact(branch: Branch): string {
  if (branch.isManagerOnLeave()) {
    return "Manager unavailable — contact head office";
  }
  return `${branch.managerName()} at ${branch.managerPhone()}`;
}

export function managerEmailDomain(branch: Branch): string {
  return branch.managerEmail().split("@")[1] ?? "";
}

export function totalYearsOfService(branches: readonly Branch[]): number {
  return branches.reduce((total, one) => total + one.managerYearsOfService(), 0);
}
