import { InstrumentRental } from "./instrument-rental";

export interface LeaseToOwnRentalProps {
  readonly id: string;
  readonly studentName: string;
  readonly instrumentName: string;
  readonly monthlyFeeCents: number;
  readonly purchasePriceCents: number;
  readonly buyoutCreditsCents: number;
}

/** A rental whose monthly payments count toward eventually owning the instrument. */
export class LeaseToOwnRental extends InstrumentRental {
  readonly purchasePriceCents: number;

  constructor(props: LeaseToOwnRentalProps) {
    super(props);
    this.purchasePriceCents = props.purchasePriceCents;
  }

  remainingBuyoutCents(): number {
    return Math.max(0, this.purchasePriceCents - (this.buyoutCreditsCents ?? 0));
  }
}
