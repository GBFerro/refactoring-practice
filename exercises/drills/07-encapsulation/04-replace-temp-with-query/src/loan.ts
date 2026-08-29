const MS_PER_DAY = 86_400_000;

/** One checked-out item, as the monthly billing job sees it. */
export interface Loan {
  readonly itemKind: "book" | "dvd" | "equipment";
  /** ISO date, e.g. "2026-08-01". */
  readonly dueOn: string;
  /** ISO date, or null while the item is still checked out. */
  readonly returnedOn: string | null;
}

export function daysBetween(from: string, to: string): number {
  return (
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / MS_PER_DAY
  );
}
