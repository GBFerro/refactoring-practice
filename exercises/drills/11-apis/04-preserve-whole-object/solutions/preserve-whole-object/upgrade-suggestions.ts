import type { Seat } from "./venue";
import { seatScore } from "./seat-score";

/** The best remaining seat to offer as a surprise upgrade, or null if there is none. */
export function bestUpgradeCandidate(seats: readonly Seat[]): Seat | null {
  return seats.reduce<Seat | null>(
    (best, seat) => (best === null || seatScore(seat) > seatScore(best) ? seat : best),
    null,
  );
}
