export interface Order {
  readonly seatCount: number;
  readonly pricePerSeatPounds: number;
  /** How far out the showtime is at the moment of booking. */
  readonly hoursUntilShowtime: number;
}
