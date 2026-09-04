import { RESTRICTED_VIEW_CODE, type DemandTier, type PriceBand } from "./price-band";

/**
 * The ceiling the venue's letting agreement fixes for a restricted-view seat. Demand
 * never gets to push one past it, however high the tier climbs.
 */
const RESTRICTED_VIEW_CAP_POUNDS = 45;

function raiseByFive(band: PriceBand): PriceBand {
  return { ...band, pricePounds: band.pricePounds + 5 };
}

function raiseByTen(band: PriceBand): PriceBand {
  return { ...band, pricePounds: band.pricePounds + 10 };
}

function raiseByTwenty(band: PriceBand): PriceBand {
  return { ...band, pricePounds: band.pricePounds + 20 };
}

function raiseByTier(band: PriceBand, tier: DemandTier): PriceBand {
  if (tier === "low") return raiseByFive(band);
  if (tier === "medium") return raiseByTen(band);
  return raiseByTwenty(band);
}

/** Raises a standard band by the flat amount its demand tier calls for. */
export function raiseStandardBand(band: PriceBand, tier: DemandTier): PriceBand {
  return raiseByTier(band, tier);
}

/**
 * Raises a restricted-view band by the same tier amounts as a standard band, but never
 * past the letting agreement's ceiling - a rule demand cannot override.
 */
export function raiseRestrictedViewBand(band: PriceBand, tier: DemandTier): PriceBand {
  const raised = raiseByTier(band, tier);
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
