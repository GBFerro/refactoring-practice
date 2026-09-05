import { Bookable } from "./bookable";

export interface RoomBookingProps {
  readonly roomName: string;
  readonly capacity: number;
  readonly bookedHours: number;
  readonly hourlyRateCents: number;
  readonly studentName: string;
}

/** One student's booking of one practice room, for a fixed number of hours. */
export class RoomBooking extends Bookable {
  readonly #capacity: number;
  readonly #studentName: string;

  constructor(props: RoomBookingProps) {
    super({
      itemName: props.roomName,
      units: props.bookedHours,
      rateCentsPerUnit: props.hourlyRateCents,
    });
    this.#capacity = props.capacity;
    this.#studentName = props.studentName;
  }

  override bookingDescription(): string {
    return `Room booking for ${this.#studentName}: ${this.itemName} (${String(this.units)}h, seats ${String(this.#capacity)})`;
  }

  /**
   * Charged for running past the booked end time, billed at the room's own hourly rate and
   * rounded up to the next whole hour: the room is simply occupied for longer, which is
   * more booking, not a penalty.
   */
  lateFeeCents(hoursOver: number): number {
    return Math.round(this.rateCentsPerUnit * Math.ceil(hoursOver));
  }
}
