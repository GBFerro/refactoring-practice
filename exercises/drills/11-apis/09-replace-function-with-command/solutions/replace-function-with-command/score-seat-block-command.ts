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

/**
 * Scores one candidate block of seats against a group's request. `execute()` returns the
 * total a caller ranks by; `breakdown()` reads back the parts that made it up, for a
 * caller that wants to explain a ranking rather than just sort by it.
 */
export class ScoreSeatBlockCommand {
  private centerOffset = 0;
  private orphanedSingles = 0;
  private touchesAisle = false;
  private locationScore = 0;
  private fragmentationPenalty = 0;
  private priceScore = 0;
  private aisleBonus = 0;

  constructor(
    private readonly block: SeatBlock,
    private readonly request: GroupRequest,
  ) {}

  execute(): number {
    this.readLayout();
    this.weighFactors();
    return this.combine();
  }

  breakdown(): ScoreBreakdown {
    return {
      locationScore: this.locationScore,
      priceScore: this.priceScore,
      aisleBonus: this.aisleBonus,
      fragmentationPenalty: this.fragmentationPenalty,
    };
  }

  private readLayout(): void {
    const { block } = this;
    const middle = (block.firstSeatNumber + block.lastSeatNumber) / 2;
    const center = (1 + block.row.seats.length) / 2;
    this.centerOffset = Math.abs(middle - center);
    this.orphanedSingles =
      Number(strandsASingle(block.row, block.firstSeatNumber - 1, -1)) +
      Number(strandsASingle(block.row, block.lastSeatNumber + 1, 1));
    this.touchesAisle = sitsAgainstAisle(block);
  }

  private weighFactors(): void {
    this.locationScore = Math.max(0, LOCATION_MAX - this.centerOffset);
    this.fragmentationPenalty = this.orphanedSingles * ORPHAN_PENALTY;
    this.priceScore = Math.max(
      0,
      PRICE_MAX -
        Math.abs(this.block.pricePerSeatPounds - this.request.targetPricePounds),
    );
    this.aisleBonus = this.touchesAisle ? AISLE_BONUS : 0;
  }

  private combine(): number {
    return Math.max(
      0,
      this.locationScore + this.priceScore + this.aisleBonus - this.fragmentationPenalty,
    );
  }
}

function sitsAgainstAisle(block: SeatBlock): boolean {
  const { aisleAfterNumber } = block.row;
  return (
    aisleAfterNumber !== null &&
    (aisleAfterNumber === block.firstSeatNumber - 1 ||
      aisleAfterNumber === block.lastSeatNumber)
  );
}

function strandsASingle(row: Row, neighborNumber: number, direction: 1 | -1): boolean {
  const neighbor = row.seats.find((seat) => seat.number === neighborNumber);
  if (neighbor === undefined || neighbor.isHeld) return false;
  const beyond = row.seats.find((seat) => seat.number === neighborNumber + direction);
  return beyond === undefined || beyond.isHeld;
}
