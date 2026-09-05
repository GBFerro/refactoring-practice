/** What every bookable thing at Beckworth needs: a name, a quantity booked, and a rate. */
export interface BookableProps {
  readonly itemName: string;
  readonly units: number;
  readonly rateCentsPerUnit: number;
}

/**
 * Something Beckworth lets out for a period at a per-unit rate: an instrument for days, a
 * room for hours. Concrete subclasses say what a "unit" means and how the front desk
 * describes the booking on a receipt; billing does not care which kind it is.
 */
export abstract class Bookable {
  protected readonly itemName: string;
  protected readonly units: number;
  protected readonly rateCentsPerUnit: number;

  protected constructor(props: BookableProps) {
    this.itemName = props.itemName;
    this.units = props.units;
    this.rateCentsPerUnit = props.rateCentsPerUnit;
  }

  /** Rate times units booked, rounded to the cent. */
  costCents(): number {
    return Math.round(this.rateCentsPerUnit * this.units);
  }

  abstract bookingDescription(): string;
}
