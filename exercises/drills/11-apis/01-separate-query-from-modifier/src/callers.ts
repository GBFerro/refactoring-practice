import type { Seat, SeatQuote, Show } from "./box-office";
import { findSeatAndReserve } from "./seat-hold";

/** Books the customer into the best remaining seat in a section. */
export function holdNextAvailableSeat(
  show: Show,
  section: string,
  customerId: string,
): Seat | null {
  return findSeatAndReserve(show, section, customerId);
}

/** What the box office would offer right now, for a customer who has not committed. */
export function nextSeatQuote(show: Show, section: string): SeatQuote | null {
  const seat = findSeatAndReserve(show, section, "quote");
  return seat === null ? null : quoteFor(seat);
}

/** Whether a section still has anything to offer. */
export function sectionHasAvailability(show: Show, section: string): boolean {
  return findSeatAndReserve(show, section, "availability-check") !== null;
}

function quoteFor(seat: Seat): SeatQuote {
  return {
    section: seat.section,
    row: seat.row,
    number: seat.number,
    priceCents: seat.priceCents,
  };
}
