import { InstrumentRental, type InstrumentRentalProps } from "./instrument-rental";

export interface LeaseToOwnRentalProps extends InstrumentRentalProps {
  readonly purchasePriceCents: number;
  /** Credited toward the purchase price from months already paid. */
  readonly buyoutCreditsCents: number;
}

/** A rental whose monthly payments count toward eventually owning the instrument. */
export class LeaseToOwnRental extends InstrumentRental {
  readonly purchasePriceCents: number;
  readonly buyoutCreditsCents: number;

  constructor(props: LeaseToOwnRentalProps) {
    super(props);
    this.purchasePriceCents = props.purchasePriceCents;
    this.buyoutCreditsCents = props.buyoutCreditsCents;
  }

  remainingBuyoutCents(): number {
    return Math.max(0, this.purchasePriceCents - this.buyoutCreditsCents);
  }
}
