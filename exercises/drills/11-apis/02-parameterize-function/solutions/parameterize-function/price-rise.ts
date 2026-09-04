import { RESTRICTED_VIEW_CODE, type DemandTier, type PriceBand } from "./price-band";

const TIER_RISE_POUNDS: Record<DemandTier, number> = {
  low: 5,
  medium: 10,
  high: 20,
};

/**
 * The ceiling the venue's letting agreement fixes for a restricted-view seat. Demand
 * never gets to push one past it, however high the tier climbs.
 */
const RESTRICTED_VIEW_CAP_POUNDS = 45;

/** Raises a band's list price. `risePounds` is how much it goes up by, not the new price. */
function raisePrice(band: PriceBand, risePounds: number): PriceBand {
  return { ...band, pricePounds: band.pricePounds + risePounds };
}

/** Raises a standard band by the flat amount its demand tier calls for. */
export function raiseStandardBand(band: PriceBand, tier: DemandTier): PriceBand {
  return raisePrice(band, TIER_RISE_POUNDS[tier]);
}

/**
 * Raises a restricted-view band by the same tier amounts as a standard band, but never
 * past the letting agreement's ceiling - a rule demand cannot override.
 */
export function raiseRestrictedViewBand(band: PriceBand, tier: DemandTier): PriceBand {
  const raised = raisePrice(band, TIER_RISE_POUNDS[tier]);
  return raised.pricePounds > RESTRICTED_VIEW_CAP_POUNDS
    ? { ...raised, pricePounds: RESTRICTED_VIEW_CAP_POUNDS }
    : raised;
}

/** Raises every band in a rack, routing the restricted-view band to its capped rule. */
export function raisePriceBands(
  bands: readonly PriceBand[],
  tier: DemandTier,
): PriceBand[] {
  return bands.map((band) =>
    band.code === RESTRICTED_VIEW_CODE
      ? raiseRestrictedViewBand(band, tier)
      : raiseStandardBand(band, tier),
  );
}
