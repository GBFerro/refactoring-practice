import type { Seat, Show } from "./box-office";

/** Finds the next open seat in a section and holds it for the customer, best-placed first. */
export function findSeatAndReserve(
  show: Show,
  section: string,
  customerId: string,
): Seat | null {
  const seat = openSeatsInOrder(show, section)[0];
  if (seat === undefined) {
    return null;
  }
  seat.status = "held";
  seat.heldBy = customerId;
  return seat;
}

function openSeatsInOrder(show: Show, section: string): Seat[] {
  return show.seats
    .filter((seat) => seat.section === section && seat.status === "open")
    .sort((a, b) => a.row - b.row || a.number - b.number);
}
