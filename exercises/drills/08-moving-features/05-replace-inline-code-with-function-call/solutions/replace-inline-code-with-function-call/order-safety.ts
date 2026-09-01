import { productIsSafeFor } from "./menu";
import type { Order, OrderItem } from "./order";

/**
 * Items on the order that conflict with what the customer asked us to avoid, so
 * production can double-check or substitute before baking starts.
 */
export function itemsWithAllergenConflict(order: Order): OrderItem[] {
  const flagged: OrderItem[] = [];
  for (const item of order.items) {
    if (!productIsSafeFor(item.product, order.mustAvoidAllergens)) {
      flagged.push(item);
    }
  }
  return flagged;
}
