const MS_PER_DAY = 86_400_000;

/** What a member currently has on loan: which item, and by when it is due back. */
export interface Loan {
  readonly itemId: string;
  readonly dueOn: string;
}

export function daysBetween(from: string, to: string): number {
  return (
    (Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / MS_PER_DAY
  );
}
