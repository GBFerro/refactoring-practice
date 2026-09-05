import { InstrumentRental } from "./instrument-rental";

export interface TrialRentalProps {
  readonly id: string;
  readonly studentName: string;
  readonly instrumentName: string;
  readonly monthlyFeeCents: number;
  readonly weeksRemaining: number;
}

/** A free trial period. No purchase option - the student returns it or starts leasing. */
export class TrialRental extends InstrumentRental {
  readonly weeksRemaining: number;

  constructor(props: TrialRentalProps) {
    super({ ...props, buyoutCreditsCents: null });
    this.weeksRemaining = props.weeksRemaining;
  }
}
