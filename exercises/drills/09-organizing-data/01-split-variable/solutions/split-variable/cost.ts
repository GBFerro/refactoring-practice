import type { Tariff, Tier, Trip, TripCost } from "./trip";

/** How many of a trip's minutes fall inside one pricing tier. */
function minutesInTier(durationMinutes: number, tier: Tier): number {
  const tierEnd = tier.maxMinutes ?? Infinity;
  if (durationMinutes <= tier.minMinutes) return 0;
  return Math.min(durationMinutes, tierEnd) - tier.minMinutes;
}

export function tripCostCents(trip: Trip, tariff: Tariff): TripCost {
  let meteredFareCents = 0;
  for (const tier of tariff.tiers) {
    meteredFareCents += minutesInTier(trip.durationMinutes, tier) * tier.centsPerMinute;
  }

  const depositRefundCents = trip.dockConfirmed ? tariff.depositCents : 0;

  return {
    meteredFareCents,
    depositRefundCents,
    totalDueCents: Math.max(meteredFareCents - depositRefundCents, 0),
  };
}
