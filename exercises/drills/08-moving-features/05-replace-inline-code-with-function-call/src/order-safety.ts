import type { Order, OrderItem } from "./order";

/**
 * Items on the order that conflict with what the customer asked us to avoid, so
 * production can double-check or substitute before baking starts.
 */
export function itemsWithAllergenConflict(order: Order): OrderItem[] {
  const flagged: OrderItem[] = [];
  for (const item of order.items) {
    let conflict = false;
    for (const allergen of order.mustAvoidAllergens) {
      if (item.product.allergens.includes(allergen)) {
        conflict = true;
      }
    }
    if (conflict) {
      flagged.push(item);
    }
  }
  return flagged;
}
