import type { ContractPlan } from "./contract-plan";

/** One wholesale account: a bakery customer buying under a negotiated contract plan. */
export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly plan: ContractPlan;
  discountRate: number;
}

export function openCustomer(id: string, name: string, plan: ContractPlan): Customer {
  return { id, name, plan, discountRate: plan.discountRate };
}
