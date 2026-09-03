/** The price of one trip leg, in cents. */
export class Fare {
  cents: number;

  constructor(cents: number) {
    this.cents = cents;
  }

  /** Adjusts this Fare's amount in place. */
  adjustBy(deltaCents: number): void {
    this.cents = this.cents + deltaCents;
  }

  equals(other: Fare): boolean {
    return this.cents === other.cents;
  }
}
