/** What the front desk enters when a practice room is added to the timetable. */
export interface RoomProps {
  readonly name: string;
  readonly capacity: number;
  readonly hourlyRateCents: number;
}

/**
 * Shared behaviour for a bookable space at Beckworth. This used to sit above two kinds
 * of room - practice rooms and, for a while, the shared rehearsal hall - back when the
 * rehearsal hall billed differently. The hall was retired years ago, and nothing since
 * has needed a second kind of room.
 */
export class Room {
  protected readonly props: RoomProps;

  constructor(props: RoomProps) {
    this.props = props;
  }

  name(): string {
    return this.props.name;
  }

  capacity(): number {
    return this.props.capacity;
  }

  bookingCostCents(hours: number): number {
    return Math.round(this.props.hourlyRateCents * hours);
  }

  describe(): string {
    return `${this.props.name} (seats ${String(this.props.capacity)})`;
  }
}
