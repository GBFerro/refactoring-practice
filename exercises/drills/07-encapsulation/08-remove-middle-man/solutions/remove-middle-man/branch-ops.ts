import type { Branch } from "./branch";

export function formatManagerCard(branch: Branch): string {
  const manager = branch.manager;
  return [manager.name(), manager.email(), manager.phone()].join("\n");
}

export function canApproveRareBookLoan(branch: Branch): boolean {
  return branch.manager.isCertifiedForRareBooks() && !branch.manager.isOnLeave();
}

export function managerSeniorityBadge(branch: Branch): string {
  return branch.manager.yearsOfService() >= 10 ? "Senior" : "Standard";
}

export function escalationContact(branch: Branch): string {
  if (branch.manager.isOnLeave()) {
    return "Manager unavailable — contact head office";
  }
  return `${branch.manager.name()} at ${branch.manager.phone()}`;
}

export function managerEmailDomain(branch: Branch): string {
  return branch.manager.email().split("@")[1] ?? "";
}

export function totalYearsOfService(branches: readonly Branch[]): number {
  return branches.reduce((total, one) => total + one.manager.yearsOfService(), 0);
}
