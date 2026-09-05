export interface InstrumentRentalProps {
  readonly id: string;
  readonly studentName: string;
  readonly instrumentName: string;
  readonly monthlyFeeCents: number;
}

/** A standing agreement to rent one instrument from Beckworth Music School. */
export abstract class InstrumentRental {
  readonly id: string;
  readonly studentName: string;
  readonly instrumentName: string;
  readonly monthlyFeeCents: number;

  protected constructor(props: InstrumentRentalProps) {
    this.id = props.id;
    this.studentName = props.studentName;
    this.instrumentName = props.instrumentName;
    this.monthlyFeeCents = props.monthlyFeeCents;
  }
}
