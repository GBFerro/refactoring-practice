import type { Customer } from "./customer";

/** Changes a plan's wholesale rate for every customer currently on it. */
export function renegotiatePlanRate(
  customers: readonly Customer[],
  planId: string,
  newRate: number,
): void {
  const plan = customers.find((customer) => customer.plan.id === planId)?.plan;
  plan?.renegotiate(newRate);
  for (const customer of customers) {
    if (customer.plan.id === planId) {
      customer.discountRate = newRate;
    }
  }
}
