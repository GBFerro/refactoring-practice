/**
 * A shelved item's code, in full: two or three letters for the section, a class number
 * (which may carry a decimal), and a shelf letter - e.g. "REF-030.92-C". Written against
 * the finished form of a shelf code, on the assumption that anything worth counting has
 * reached its shelf and therefore has a shelf letter by the time the report runs.
 */
const SHELVED_CODE = /^([A-Z]{2,3})-[0-9]+(?:\.[0-9]+)?-([A-Z])$/u;

/** Counts items per section for the monthly collection report. */
export function sectionTally(shelfCodes: readonly string[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const raw of shelfCodes) {
    const match = SHELVED_CODE.exec(raw);
    if (match === null) {
      continue;
    }
    const section = match[1] ?? raw;
    tally[section] = (tally[section] ?? 0) + 1;
  }
  return tally;
}
