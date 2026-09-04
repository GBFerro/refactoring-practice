import type { Seat } from "./venue";
import { positionScore } from "./position-score";

/** Ranks a seat for a surprise-upgrade offer: closer and more central scores higher; a restricted view halves it. */
export function seatScore(seat: Seat): number {
  const base = positionScore(seat.distanceFromStageMeters, seat.offsetFromCenterMeters);
  return seat.hasRestrictedView ? Math.round(base / 2) : base;
}
