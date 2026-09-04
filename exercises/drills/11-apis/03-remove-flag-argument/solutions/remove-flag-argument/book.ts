import type { Order, Receipt, SeatStatus, Section } from "./booking";

/** Confirms a booking right now. Throws rather than waitlisting - a priority booking never waits. */
export function bookPriority(section: Section, order: Order): Receipt {
  if (section.availableSeats < order.seatCount) {
    throw new Error(`Not enough seats left in ${section.name} for a priority booking`);
  }
  claimSeats(section, order.seatCount);
  return receiptFor(order, "confirmed");
}

/** Confirms a booking when there is room, otherwise waitlists it instead of failing. */
export function bookStandard(section: Section, order: Order): Receipt {
  if (section.availableSeats < order.seatCount) {
    section.waitlist.push(order.customerName);
    return receiptFor(order, "waitlisted");
  }
  claimSeats(section, order.seatCount);
  return receiptFor(order, "pending");
}

function claimSeats(section: Section, seatCount: number): void {
  section.availableSeats -= seatCount;
}

function receiptFor(order: Order, status: SeatStatus): Receipt {
  return { customerName: order.customerName, seatCount: order.seatCount, status };
}
