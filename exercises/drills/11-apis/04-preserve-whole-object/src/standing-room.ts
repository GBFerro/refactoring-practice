import type { StandingSpot } from "./venue";
import { positionScore } from "./position-score";

/** The best remaining standing-room spot for a general-admission show, or null if none. */
export function bestStandingSpot(spots: readonly StandingSpot[]): StandingSpot | null {
  return spots.reduce<StandingSpot | null>(
    (best, spot) => (best === null || scoreOf(spot) > scoreOf(best) ? spot : best),
    null,
  );
}

function scoreOf(spot: StandingSpot): number {
  return positionScore(spot.distanceFromStageMeters, spot.offsetFromCenterMeters);
}
