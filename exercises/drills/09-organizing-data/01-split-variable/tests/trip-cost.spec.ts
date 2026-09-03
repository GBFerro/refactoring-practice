import { describe, expect, it } from "vitest";
import { tripCostCents, type Tariff, type Trip } from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of splitting the shared variable apart. Do not edit this
 * file: if a refactoring seems to require changing a test, either the refactoring changed
 * behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible Split Variable could silently change - not
 * one per tier. Each test names the move it is guarding against.
 */

function tripFor(durationMinutes: number, dockConfirmed = true): Trip {
  return { durationMinutes, dockConfirmed };
}

const tieredTariff: Tariff = {
  tiers: [
    { minMinutes: 0, maxMinutes: 30, centsPerMinute: 15 },
    { minMinutes: 30, maxMinutes: 90, centsPerMinute: 25 },
    { minMinutes: 90, maxMinutes: null, centsPerMinute: 40 },
  ],
  depositCents: 500,
};

describe("tripCostCents", () => {
  // Guards against the tier loop being replaced by one flat rate times the duration.
  it("meters a short trip against a single tier", () => {
    const cost = tripCostCents(tripFor(20, false), tieredTariff);
    expect(cost.meteredFareCents).toBe(300);
  });

  // Boundary: a trip exactly at a tier's ceiling belongs entirely to the tier below it,
  // not to the tier that starts there. An off-by-one would push a minute into tier two.
  it("charges a trip that lands exactly on a tier boundary at the lower tier's rate", () => {
    const cost = tripCostCents(tripFor(30, false), tieredTariff);
    expect(cost.meteredFareCents).toBe(450);
  });

  // Guards against collapsing the per-tier loop into a single multiplication - this trip
  // only prices correctly if minutes are split 30 / 15 across the first two tiers.
  it("sums the metered fare across every tier a longer trip crosses", () => {
    const cost = tripCostCents(tripFor(45, false), tieredTariff);
    expect(cost.meteredFareCents).toBe(825);
  });

  // Boundary: the top tier has no ceiling. A version that reads maxMinutes without the
  // `?? Infinity` fallback would throw or silently price zero minutes into this tier.
  it("treats the final tier as open-ended once a trip runs past every ceiling", () => {
    const cost = tripCostCents(tripFor(100, false), tieredTariff);
    expect(cost.meteredFareCents).toBe(2350);
  });

  // The deposit's own job: refund it in full once the bike is confirmed docked, regardless
  // of what the metered fare came to.
  it("refunds the full deposit once the bike is confirmed docked", () => {
    const cost = tripCostCents(tripFor(10, true), tieredTariff);
    expect(cost.depositRefundCents).toBe(500);
  });

  // The deposit's other branch: nothing is refunded when the bike was never confirmed
  // docked, independent of the fare.
  it("withholds the deposit when the bike is never confirmed docked", () => {
    const cost = tripCostCents(tripFor(10, false), tieredTariff);
    expect(cost.depositRefundCents).toBe(0);
    expect(cost.totalDueCents).toBe(150);
  });

  // Guards the Math.max clamp: a small fare and a full deposit refund must not leave the
  // rider owed a negative amount.
  it("floors the total due at zero when the deposit refund exceeds the metered fare", () => {
    const cost = tripCostCents(tripFor(5, true), tieredTariff);
    expect(cost.totalDueCents).toBe(0);
  });

  // The anchor test: the metered fare and the deposit refund are two unrelated answers
  // computed in the same function. A refactor that lets the deposit branch overwrite what
  // was captured for the fare - the exact bug Split Variable exists to make impossible -
  // would corrupt this large fare down to the small deposit amount, or to zero.
  it("keeps a large metered fare untouched by an unconfirmed deposit", () => {
    const cost = tripCostCents(tripFor(100, false), tieredTariff);
    expect(cost.meteredFareCents).toBe(2350);
    expect(cost.depositRefundCents).toBe(0);
    expect(cost.totalDueCents).toBe(2350);
  });
});
