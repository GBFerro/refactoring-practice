import type { ParsedRegistration, RegistrationCharge } from "./registration";

const BASE_FEE_CENTS: Record<string, number> = {
  "5K": 1500,
  "10K": 2200,
  HALF: 4000,
  FUN: 399,
};

const MEMBER_DISCOUNT_RATE = 0.15;
const EARLY_BIRD_DISCOUNT_CENTS = 500;

/**
 * Turns facts about a runner into money owed. Knows the price list and the
 * discount rules, and nothing about `|` or how the facts were read.
 */
export function priceRegistration(entry: ParsedRegistration): RegistrationCharge {
  const baseFeeCents = baseFeeFor(entry.distanceCode);
  const { memberDiscountCents, subtotalCents } = memberDiscount(baseFeeCents, entry);
  const promoDiscountCents = promoDiscount(subtotalCents, entry.hasEarlyBirdPromo);
  return {
    runnerName: entry.runnerName,
    baseFeeCents,
    memberDiscountCents,
    promoDiscountCents,
    totalCents: subtotalCents - promoDiscountCents,
  };
}

function baseFeeFor(distanceCode: string): number {
  const feeCents = BASE_FEE_CENTS[distanceCode];
  if (feeCents === undefined) {
    throw new Error(`Unknown distance: ${distanceCode}`);
  }
  return feeCents;
}

/** The member discount, and what is left of the base fee once it is taken off. */
function memberDiscount(
  baseFeeCents: number,
  entry: ParsedRegistration,
): { memberDiscountCents: number; subtotalCents: number } {
  const memberDiscountCents = entry.isMember
    ? Math.round(baseFeeCents * MEMBER_DISCOUNT_RATE)
    : 0;
  return { memberDiscountCents, subtotalCents: baseFeeCents - memberDiscountCents };
}

function promoDiscount(subtotalCents: number, hasEarlyBirdPromo: boolean): number {
  return hasEarlyBirdPromo ? Math.min(EARLY_BIRD_DISCOUNT_CENTS, subtotalCents) : 0;
}
