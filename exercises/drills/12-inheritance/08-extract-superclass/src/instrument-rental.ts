export interface InstrumentRentalProps {
  readonly instrumentName: string;
  readonly category: string;
  readonly rentalDays: number;
  readonly dailyRateCents: number;
  readonly studentName: string;
}

/** A flat surcharge per day late, the same for every instrument regardless of its own rate:
 * a violin on a shelf and a cello on a shelf cost the school the same thing - another
 * student cannot book either one back while it sits at home. */
const LATE_RETURN_FEE_CENTS_PER_DAY = 500;

/** One student's rental of one instrument, for a fixed number of days. */
export class InstrumentRental {
  readonly #instrumentName: string;
  readonly #category: string;
  readonly #rentalDays: number;
  readonly #dailyRateCents: number;
  readonly #studentName: string;

  constructor(props: InstrumentRentalProps) {
    this.#instrumentName = props.instrumentName;
    this.#category = props.category;
    this.#rentalDays = props.rentalDays;
    this.#dailyRateCents = props.dailyRateCents;
    this.#studentName = props.studentName;
  }

  bookingDescription(): string {
    const dayWord = this.#rentalDays === 1 ? "day" : "days";
    return `${this.#category} rental for ${this.#studentName}: ${this.#instrumentName} (${String(this.#rentalDays)} ${dayWord})`;
  }

  /** Daily rate times the number of days rented, rounded to the cent. */
  costCents(): number {
    return Math.round(this.#dailyRateCents * this.#rentalDays);
  }

  /**
   * Charged for keeping the instrument past its due date. Deliberately independent of
   * dailyRateCents: this is a deterrent against hoarding a scarce shared resource, not a
   * continuation of the rental itself.
   */
  lateFeeCents(daysLate: number): number {
    return Math.round(LATE_RETURN_FEE_CENTS_PER_DAY * daysLate);
  }
}
