import { InstrumentRental, type InstrumentRentalProps } from "./instrument-rental";

/** A free trial period. No purchase option - the student returns it or starts leasing. */
export class TrialRental extends InstrumentRental {
  readonly weeksRemaining: number;

  constructor(props: InstrumentRentalProps & { readonly weeksRemaining: number }) {
    super(props);
    this.weeksRemaining = props.weeksRemaining;
  }
}
