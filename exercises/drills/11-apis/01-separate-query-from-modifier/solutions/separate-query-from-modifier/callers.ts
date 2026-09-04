import type { Seat, SeatQuote, Show } from "./box-office";
import { holdSeat, nextAvailableSeat } from "./seat-hold";

/** Books the customer into the best remaining seat in a section. */
export function holdNextAvailableSeat(
  show: Show,
  section: string,
  customerId: string,
): Seat | null {
  const seat = nextAvailableSeat(show, section);
  if (seat === null) {
    return null;
  }
  holdSeat(seat, customerId);
  return seat;
}

/** What the box office would offer right now, for a customer who has not committed. */
export function nextSeatQuote(show: Show, section: string): SeatQuote | null {
  const seat = nextAvailableSeat(show, section);
  return seat === null ? null : quoteFor(seat);
}

/** Whether a section still has anything to offer. */
export function sectionHasAvailability(show: Show, section: string): boolean {
  return nextAvailableSeat(show, section) !== null;
}

function quoteFor(seat: Seat): SeatQuote {
  return {
    section: seat.section,
    row: seat.row,
    number: seat.number,
    priceCents: seat.priceCents,
  };
}
