import type { Customer } from "./customer";

export function invoiceTotalCents(customer: Customer, subtotalCents: number): number {
  const discount = Math.round(subtotalCents * customer.discountRate);
  return subtotalCents - discount;
}
