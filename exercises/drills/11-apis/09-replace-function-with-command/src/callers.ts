import type { GroupRequest, SeatBlock } from "./seating";
import { scoreSeatBlock, type SeatScore } from "./score";

/** Candidate blocks for a group, best fit first. */
export function rankSeatBlocks(
  blocks: readonly SeatBlock[],
  request: GroupRequest,
): SeatBlock[] {
  return blocks
    .map((block) => ({ block, score: scoreSeatBlock(block, request) }))
    .sort((a, b) => b.score.total - a.score.total)
    .map((entry) => entry.block);
}

/** A one-line "why this seat" for the top-ranked block, or null when nothing was offered. */
export function explainTopBlock(
  blocks: readonly SeatBlock[],
  request: GroupRequest,
): string | null {
  const top = rankSeatBlocks(blocks, request)[0];
  if (top === undefined) return null;
  return renderExplanation(top, scoreSeatBlock(top, request));
}

function renderExplanation(block: SeatBlock, score: SeatScore): string {
  const parts = [`location +${score.locationScore}`, `price +${score.priceScore}`];
  if (score.aisleBonus > 0) parts.push(`aisle +${score.aisleBonus}`);
  if (score.fragmentationPenalty > 0) {
    parts.push(`fragmentation -${score.fragmentationPenalty}`);
  }
  const range = `${block.firstSeatNumber}-${block.lastSeatNumber}`;
  return `Row ${block.row.rowNumber} seats ${range}: ${parts.join(", ")} (total ${score.total})`;
}
