/** What the front desk enters when a practice room is added to the timetable. */
export interface RoomProps {
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRateCents: number;
}

/** A room booked for individual or small-group practice. */
export class PracticeRoom {
  readonly #props: RoomProps;

  constructor(props: RoomProps) {
    this.#props = props;
  }

  name(): string {
    return this.#props.name;
  }

  capacity(): number {
    return this.#props.capacity;
  }

  bookingCostCents(hours: number): number {
    return Math.round(this.#props.hourlyRateCents * hours);
  }

  describe(): string {
    return `${this.#props.name} (seats ${String(this.#props.capacity)})`;
  }
}
