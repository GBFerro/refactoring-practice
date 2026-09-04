export type SeatStatus = "open" | "held" | "booked";

export interface Seat {
  readonly section: string;
  readonly status: SeatStatus;
}

export interface Show {
  readonly title: string;
  readonly seats: readonly Seat[];
}
