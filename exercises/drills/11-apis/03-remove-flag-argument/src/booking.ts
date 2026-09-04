export interface Section {
  readonly name: string;
  availableSeats: number;
  readonly waitlist: string[];
}

export interface Order {
  readonly customerName: string;
  readonly seatCount: number;
}

export type SeatStatus = "confirmed" | "pending" | "waitlisted";

export interface Receipt {
  readonly customerName: string;
  readonly seatCount: number;
  readonly status: SeatStatus;
}
