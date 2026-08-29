const MS_PER_DAY = 86_400_000;

/** One checked-out item, as the monthly billing job sees it. */
export interface Loan {
  readonly itemKind: "book" | "dvd" | "equipment";
  /** ISO date, e.g. "2026-08-01". */
  readonly dueOn: string;
  /** ISO date, or null while the item is still checked out. */
  readonly returnedOn: string | null;
}

function daysBetween(from: string, to: string): number {
  return (
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / MS_PER_DAY
  );
}

/** The date lateness is measured against: when it came back, or today if it has not. */
function effectiveReturnDate(loan: Loan, today: string): string {
  return loan.returnedOn ?? today;
}

/** How many days late a loan is, as of `today` or its return date, whichever applies. */
export function daysLate(loan: Loan, today: string): number {
  return daysBetween(loan.dueOn, effectiveReturnDate(loan, today));
}
