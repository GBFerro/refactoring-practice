const MS_PER_DAY = 86_400_000;
export const LOAN_PERIOD_DAYS = 21;
const MAX_RENEWALS = 2;

export interface RenewalOutcome {
  readonly renewed: boolean;
  readonly reason?: string;
}

/** One checkout: a single item borrowed by a single member. */
export class Loan {
  readonly id: string;
  readonly memberId: string;
  readonly itemId: string;
  readonly checkedOutOn: string;
  #dueOn: string;
  #returnedOn: string | null;
  #renewalCount: number;

  constructor(memberId: string, itemId: string, checkedOutOn: string) {
    this.id = `${itemId}#${checkedOutOn}`;
    this.memberId = memberId;
    this.itemId = itemId;
    this.checkedOutOn = checkedOutOn;
    this.#dueOn = addDays(checkedOutOn, LOAN_PERIOD_DAYS);
    this.#returnedOn = null;
    this.#renewalCount = 0;
  }

  get dueOn(): string {
    return this.#dueOn;
  }

  get returnedOn(): string | null {
    return this.#returnedOn;
  }

  get renewalCount(): number {
    return this.#renewalCount;
  }

  renew(today: string): RenewalOutcome {
    if (this.#returnedOn !== null) {
      return { renewed: false, reason: `loan ${this.id} was already returned` };
    }
    if (this.#renewalCount >= MAX_RENEWALS) {
      return { renewed: false, reason: `loan ${this.id} has no renewals left` };
    }
    this.#dueOn = addDays(today, LOAN_PERIOD_DAYS);
    this.#renewalCount = this.#renewalCount + 1;
    return { renewed: true };
  }

  markReturned(returnedOn: string): void {
    this.#returnedOn = returnedOn;
  }
}

export function openLoan(memberId: string, itemId: string, checkedOutOn: string): Loan {
  return new Loan(memberId, itemId, checkedOutOn);
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
