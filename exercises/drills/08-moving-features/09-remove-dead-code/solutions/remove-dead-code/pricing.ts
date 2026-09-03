import type { Order, OrderItem } from "./order";

/** Years of continuous wholesale ordering before the founding-account rate applies. */
const FOUNDING_ACCOUNT_YEARS = 5;
const FOUNDING_ACCOUNT_DISCOUNT = 0.15;

function subtotalCents(items: readonly OrderItem[]): number {
  return items.reduce((total, item) => total + item.unitPriceCents * item.quantity, 0);
}

/**
 * The five founding cafes were handed a "FOUNDER-RATE" code at signup, back when checkout
 * still asked for one. The checkout form dropped the field once the co-op started granting
 * the same rate automatically at the five-year mark - so the code below is now supplied by
 * this function instead of typed in by a person, for exactly the accounts it always meant.
 */
function effectivePromoCode(order: Order): string | undefined {
  if (order.promoCode !== undefined) return order.promoCode;
  return order.customer.yearsActive >= FOUNDING_ACCOUNT_YEARS
    ? "FOUNDER-RATE"
    : undefined;
}

function promoDiscountCents(subtotal: number, promoCode: string | undefined): number {
  if (promoCode === "FOUNDER-RATE") {
    return Math.round(subtotal * FOUNDING_ACCOUNT_DISCOUNT);
  }
  return 0;
}

export function priceOrderCents(order: Order): number {
  const subtotal = subtotalCents(order.items);
  return subtotal - promoDiscountCents(subtotal, effectivePromoCode(order));
}
