import { Bookable } from "./bookable";

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
export class InstrumentRental extends Bookable {
  readonly #category: string;
  readonly #studentName: string;

  constructor(props: InstrumentRentalProps) {
    super({
      itemName: props.instrumentName,
      units: props.rentalDays,
      rateCentsPerUnit: props.dailyRateCents,
    });
    this.#category = props.category;
    this.#studentName = props.studentName;
  }

  override bookingDescription(): string {
    const dayWord = this.units === 1 ? "day" : "days";
    return `${this.#category} rental for ${this.#studentName}: ${this.itemName} (${String(this.units)} ${dayWord})`;
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
