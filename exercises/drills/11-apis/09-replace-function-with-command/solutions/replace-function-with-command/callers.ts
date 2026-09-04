import type { GroupRequest, SeatBlock } from "./seating";
import { ScoreSeatBlockCommand, type ScoreBreakdown } from "./score-seat-block-command";

/** Candidate blocks for a group, best fit first. */
export function rankSeatBlocks(
  blocks: readonly SeatBlock[],
  request: GroupRequest,
): SeatBlock[] {
  return blocks
    .map((block) => ({
      block,
      total: new ScoreSeatBlockCommand(block, request).execute(),
    }))
    .sort((a, b) => b.total - a.total)
    .map((entry) => entry.block);
}

/** A one-line "why this seat" for the top-ranked block, or null when nothing was offered. */
export function explainTopBlock(
  blocks: readonly SeatBlock[],
  request: GroupRequest,
): string | null {
  const top = rankSeatBlocks(blocks, request)[0];
  if (top === undefined) return null;
  const command = new ScoreSeatBlockCommand(top, request);
  const total = command.execute();
  return renderExplanation(top, total, command.breakdown());
}

function renderExplanation(
  block: SeatBlock,
  total: number,
  breakdown: ScoreBreakdown,
): string {
  const parts = scoreParts(breakdown);
  const range = `${block.firstSeatNumber}-${block.lastSeatNumber}`;
  return `Row ${block.row.rowNumber} seats ${range}: ${parts.join(", ")} (total ${total})`;
}

function scoreParts(breakdown: ScoreBreakdown): string[] {
  const parts = [
    `location +${breakdown.locationScore}`,
    `price +${breakdown.priceScore}`,
  ];
  if (breakdown.aisleBonus > 0) parts.push(`aisle +${breakdown.aisleBonus}`);
  if (breakdown.fragmentationPenalty > 0) {
    parts.push(`fragmentation -${breakdown.fragmentationPenalty}`);
  }
  return parts;
}
