/**
 * The price of one trip leg, in cents. A value: two Fares with the same amount are
 * interchangeable, and correcting one never has to reach into another.
 */
export class Fare {
  readonly cents: number;

  constructor(cents: number) {
    this.cents = cents;
  }

  /** A new Fare, deltaCents different from this one. Never edits this Fare in place. */
  adjustedBy(deltaCents: number): Fare {
    return new Fare(this.cents + deltaCents);
  }

  equals(other: Fare): boolean {
    return this.cents === other.cents;
  }
}
