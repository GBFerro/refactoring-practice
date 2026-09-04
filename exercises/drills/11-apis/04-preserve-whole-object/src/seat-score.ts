import { positionScore } from "./position-score";

/** Ranks a seat for a surprise-upgrade offer: closer and more central scores higher; a restricted view halves it. */
export function seatScore(
  distanceFromStageMeters: number,
  offsetFromCenterMeters: number,
  hasRestrictedView: boolean,
): number {
  const base = positionScore(distanceFromStageMeters, offsetFromCenterMeters);
  return hasRestrictedView ? Math.round(base / 2) : base;
}
