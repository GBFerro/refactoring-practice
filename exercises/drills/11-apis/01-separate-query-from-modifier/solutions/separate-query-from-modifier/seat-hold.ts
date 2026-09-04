import type { Seat, Show } from "./box-office";

/** The next open seat in a section, best-placed first. Does not touch the seat map. */
export function nextAvailableSeat(show: Show, section: string): Seat | null {
  return openSeatsInOrder(show, section)[0] ?? null;
}

/** Holds a seat for a customer. Assumes the seat is still open; does not check. */
export function holdSeat(seat: Seat, customerId: string): void {
  seat.status = "held";
  seat.heldBy = customerId;
}

function openSeatsInOrder(show: Show, section: string): Seat[] {
  return show.seats
    .filter((seat) => seat.section === section && seat.status === "open")
    .sort((a, b) => a.row - b.row || a.number - b.number);
}
