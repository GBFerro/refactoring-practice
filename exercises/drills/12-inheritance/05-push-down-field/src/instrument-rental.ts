export interface InstrumentRentalProps {
  readonly id: string;
  readonly studentName: string;
  readonly instrumentName: string;
  readonly monthlyFeeCents: number;
  /** Credited toward a purchase price - meaningful only for a lease-to-own rental. */
  readonly buyoutCreditsCents: number | null;
}

/** A standing agreement to rent one instrument from Beckworth Music School. */
export abstract class InstrumentRental {
  readonly id: string;
  readonly studentName: string;
  readonly instrumentName: string;
  readonly monthlyFeeCents: number;
  readonly buyoutCreditsCents: number | null;

  protected constructor(props: InstrumentRentalProps) {
    this.id = props.id;
    this.studentName = props.studentName;
    this.instrumentName = props.instrumentName;
    this.monthlyFeeCents = props.monthlyFeeCents;
    this.buyoutCreditsCents = props.buyoutCreditsCents;
  }
}
