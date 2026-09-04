import type { Seat } from "./venue";
import { seatScore } from "./seat-score";

/** The best remaining seat to offer as a surprise upgrade, or null if there is none. */
export function bestUpgradeCandidate(seats: readonly Seat[]): Seat | null {
  return seats.reduce<Seat | null>((best, seat) => {
    const score = seatScore(
      seat.distanceFromStageMeters,
      seat.offsetFromCenterMeters,
      seat.hasRestrictedView,
    );
    if (best === null) {
      return seat;
    }
    const bestScore = seatScore(
      best.distanceFromStageMeters,
      best.offsetFromCenterMeters,
      best.hasRestrictedView,
    );
    return score > bestScore ? seat : best;
  }, null);
}
