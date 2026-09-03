import type { Order, OrderItem } from "./order";

/** Years of continuous wholesale ordering before the founding-account rate applies. */
const FOUNDING_ACCOUNT_YEARS = 5;
const FOUNDING_ACCOUNT_DISCOUNT = 0.15;
const WELCOME_CAFE_DISCOUNT = 0.1;
const HARVEST_FAIR_2019_DISCOUNT_CENTS = 500;

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

// Zeroed out the price for a walk-in "try it before you buy a crate" sample program, run
// out of the old storefront counter. The program ended when the co-op moved to
// order-ahead-only in 2022, and the till that used to hand out this code went with it.
function sampleCrateWaiver(subtotal: number, promoCode: string | undefined): number {
  return promoCode === "SAMPLE-CRATE-FREE" ? subtotal : 0;
}

function promoDiscountCents(subtotal: number, promoCode: string | undefined): number {
  // one-time 10% new-account discount for the first three wholesale signups; all three
  // have since closed or moved off this rate
  if (promoCode === "WELCOME-CAFE") {
    return Math.round(subtotal * WELCOME_CAFE_DISCOUNT);
  }
  // a single-weekend discount for a fair booth the co-op ran once, three years ago
  if (promoCode === "HARVEST-FAIR-2019") {
    return HARVEST_FAIR_2019_DISCOUNT_CENTS;
  }
  const waiver = sampleCrateWaiver(subtotal, promoCode);
  if (waiver > 0) {
    return waiver;
  }
  if (promoCode === "FOUNDER-RATE") {
    return Math.round(subtotal * FOUNDING_ACCOUNT_DISCOUNT);
  }
  return 0;
}

export function priceOrderCents(order: Order): number {
  const subtotal = subtotalCents(order.items);
  return subtotal - promoDiscountCents(subtotal, effectivePromoCode(order));
}
