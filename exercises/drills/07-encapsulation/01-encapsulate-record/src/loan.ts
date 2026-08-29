const MS_PER_DAY = 86_400_000;
export const LOAN_PERIOD_DAYS = 21;

export interface RenewalOutcome {
  readonly renewed: boolean;
  readonly reason?: string;
}

/** One checkout: a single item borrowed by a single member. */
export interface Loan {
  readonly id: string;
  readonly memberId: string;
  readonly itemId: string;
  readonly checkedOutOn: string;
  dueOn: string;
  returnedOn: string | null;
  renewalCount: number;
}

export function openLoan(memberId: string, itemId: string, checkedOutOn: string): Loan {
  return {
    id: `${itemId}#${checkedOutOn}`,
    memberId,
    itemId,
    checkedOutOn,
    dueOn: addDays(checkedOutOn, LOAN_PERIOD_DAYS),
    returnedOn: null,
    renewalCount: 0,
  };
}

export function addDays(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  const iso = shifted.toISOString().slice(0, 10);
  return iso;
}

export function daysBetween(from: string, to: string): number {
  return (
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / MS_PER_DAY
  );
}
