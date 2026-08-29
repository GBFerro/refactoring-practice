import { ShelfCode } from "./shelf-code";

/** Counts items per section for the monthly collection report. */
export function sectionTally(shelfCodes: readonly string[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const raw of shelfCodes) {
    const section = ShelfCode.parse(raw).section;
    tally[section] = (tally[section] ?? 0) + 1;
  }
  return tally;
}
