export interface RoomBookingProps {
  readonly roomName: string;
  readonly capacity: number;
  readonly bookedHours: number;
  readonly hourlyRateCents: number;
  readonly studentName: string;
}

/** One student's booking of one practice room, for a fixed number of hours. */
export class RoomBooking {
  readonly #roomName: string;
  readonly #capacity: number;
  readonly #bookedHours: number;
  readonly #hourlyRateCents: number;
  readonly #studentName: string;

  constructor(props: RoomBookingProps) {
    this.#roomName = props.roomName;
    this.#capacity = props.capacity;
    this.#bookedHours = props.bookedHours;
    this.#hourlyRateCents = props.hourlyRateCents;
    this.#studentName = props.studentName;
  }

  bookingDescription(): string {
    return `Room booking for ${this.#studentName}: ${this.#roomName} (${String(this.#bookedHours)}h, seats ${String(this.#capacity)})`;
  }

  /** Hourly rate times the number of hours booked, rounded to the cent. */
  costCents(): number {
    return Math.round(this.#hourlyRateCents * this.#bookedHours);
  }

  /**
   * Charged for running past the booked end time, billed at the room's own hourly rate and
   * rounded up to the next whole hour: the room is simply occupied for longer, which is
   * more booking, not a penalty.
   */
  lateFeeCents(hoursOver: number): number {
    return Math.round(this.#hourlyRateCents * Math.ceil(hoursOver));
  }
}
