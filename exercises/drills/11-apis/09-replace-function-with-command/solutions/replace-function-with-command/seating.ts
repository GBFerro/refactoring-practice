/** One seat in a row. Seats are numbered left to right, starting at 1. */
export interface Seat {
  readonly number: number;
  readonly isHeld: boolean;
}

export interface Row {
  readonly rowNumber: number;
  /** Every seat in the row, in order by number - not only the open ones. */
  readonly seats: readonly Seat[];
  /** The row's one aisle sits immediately after this seat number, or there is none. */
  readonly aisleAfterNumber: number | null;
}

/** A contiguous run of seats a group could be offered, inclusive of both ends. */
export interface SeatBlock {
  readonly row: Row;
  readonly firstSeatNumber: number;
  readonly lastSeatNumber: number;
  readonly pricePerSeatPounds: number;
}

export interface GroupRequest {
  readonly targetPricePounds: number;
}
