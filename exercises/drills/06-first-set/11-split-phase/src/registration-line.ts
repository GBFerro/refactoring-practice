import type { RegistrationCharge } from "./registration";

const MEMBER_TOKEN = "MEMBER";
const EARLY_BIRD_TOKEN = "EARLY";

/** What the front desk charges for each distance, before any discount. */
const BASE_FEE_CENTS: Record<string, number> = {
  "5K": 1500,
  "10K": 2200,
  HALF: 4000,
  /** The short fun run the club runs alongside every race weekend. */
  FUN: 399,
};

/** Club members pay 15% less than the price list, rounded to the nearest cent. */
const MEMBER_DISCOUNT_RATE = 0.15;
/** A flat discount for registering before the early-bird cutoff, never below zero owed. */
const EARLY_BIRD_DISCOUNT_CENTS = 500;

/**
 * Prices one raw desk line: `name|distance|membership|promo`. The volunteers at the
 * registration desk key these in from the paper sign-up sheet, so the last two fields
 * are often left off entirely rather than filled in with a "no".
 */
export function priceRegistrationLine(raw: string): RegistrationCharge {
  const [name = "", distance = "", membership = "", promo = ""] = raw.split("|");
  // The coded fields are case- and whitespace-tolerant; the runner's name is not.
  const runnerName = name.trim();
  const distanceCode = distance.trim().toUpperCase();
  const isMember = membership.trim().toUpperCase() === MEMBER_TOKEN;
  const hasEarlyBirdPromo = promo.trim().toUpperCase() === EARLY_BIRD_TOKEN;

  const baseFeeCents = BASE_FEE_CENTS[distanceCode];
  if (baseFeeCents === undefined) {
    throw new Error(`Unknown distance: ${distanceCode}`);
  }
  const memberDiscountCents = isMember
    ? Math.round(baseFeeCents * MEMBER_DISCOUNT_RATE)
    : 0;
  const subtotalCents = baseFeeCents - memberDiscountCents;
  const promoDiscountCents = hasEarlyBirdPromo
    ? Math.min(EARLY_BIRD_DISCOUNT_CENTS, subtotalCents)
    : 0;

  return {
    runnerName,
    baseFeeCents,
    memberDiscountCents,
    promoDiscountCents,
    totalCents: subtotalCents - promoDiscountCents,
  };
}
