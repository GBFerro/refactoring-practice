import type { GroupRequest, Row, SeatBlock } from "./seating";

const LOCATION_MAX = 20;
const ORPHAN_PENALTY = 8;
const PRICE_MAX = 15;
const AISLE_BONUS = 5;

export interface ScoreBreakdown {
  readonly locationScore: number;
  readonly priceScore: number;
  readonly aisleBonus: number;
  readonly fragmentationPenalty: number;
}

export interface SeatScore extends ScoreBreakdown {
  readonly total: number;
}

/** How well a candidate block of seats fits a group's request, 0 (worst) and up. */
export function scoreSeatBlock(block: SeatBlock, request: GroupRequest): SeatScore {
  // phase 1: read the raw facts about where this block sits in its row
  const middle = (block.firstSeatNumber + block.lastSeatNumber) / 2;
  const center = (1 + block.row.seats.length) / 2;
  const centerOffset = Math.abs(middle - center);

  let orphanedSingles = 0;
  if (strandsASingle(block.row, block.firstSeatNumber - 1, -1)) {
    orphanedSingles = orphanedSingles + 1;
  }
  if (strandsASingle(block.row, block.lastSeatNumber + 1, 1)) {
    orphanedSingles = orphanedSingles + 1;
  }

  const touchesAisle =
    block.row.aisleAfterNumber !== null &&
    (block.row.aisleAfterNumber === block.firstSeatNumber - 1 ||
      block.row.aisleAfterNumber === block.lastSeatNumber);

  // phase 2: turn each fact into weighted points
  const locationScore = Math.max(0, LOCATION_MAX - centerOffset);
  const fragmentationPenalty = orphanedSingles * ORPHAN_PENALTY;
  const priceScore = Math.max(
    0,
    PRICE_MAX - Math.abs(block.pricePerSeatPounds - request.targetPricePounds),
  );
  const aisleBonus = touchesAisle ? AISLE_BONUS : 0;

  // phase 3: combine, never letting the aisle bonus rescue a badly fragmented block
  const total = Math.max(
    0,
    locationScore + priceScore + aisleBonus - fragmentationPenalty,
  );

  return { total, locationScore, priceScore, aisleBonus, fragmentationPenalty };
}

function strandsASingle(row: Row, neighborNumber: number, direction: 1 | -1): boolean {
  const neighbor = row.seats.find((seat) => seat.number === neighborNumber);
  if (neighbor === undefined || neighbor.isHeld) return false;
  const beyond = row.seats.find((seat) => seat.number === neighborNumber + direction);
  return beyond === undefined || beyond.isHeld;
}
