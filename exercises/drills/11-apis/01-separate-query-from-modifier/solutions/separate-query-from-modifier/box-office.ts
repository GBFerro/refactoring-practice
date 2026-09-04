export type SeatStatus = "open" | "held" | "booked";

export interface Seat {
  readonly section: string;
  readonly row: number;
  readonly number: number;
  readonly priceCents: number;
  status: SeatStatus;
  heldBy: string | null;
}

export interface Show {
  readonly title: string;
  readonly seats: readonly Seat[];
}

export interface SeatQuote {
  readonly section: string;
  readonly row: number;
  readonly number: number;
  readonly priceCents: number;
}
