import type { ContractPlan } from "./contract-plan";

/** One wholesale account: a bakery customer buying under a negotiated contract plan. */
export class Customer {
  readonly id: string;
  readonly name: string;
  readonly plan: ContractPlan;

  constructor(id: string, name: string, plan: ContractPlan) {
    this.id = id;
    this.name = name;
    this.plan = plan;
  }

  get discountRate(): number {
    return this.plan.discountRate;
  }
}

export function openCustomer(id: string, name: string, plan: ContractPlan): Customer {
  return new Customer(id, name, plan);
}
