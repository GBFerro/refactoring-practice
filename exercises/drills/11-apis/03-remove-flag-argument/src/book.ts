import type { Order, Receipt, Section } from "./booking";

/**
 * Books a section for an order. Priority bookings confirm immediately and refuse to
 * wait; standard bookings fall back to the section's waitlist once seats run out.
 */
export function book(section: Section, order: Order, isPriority: boolean): Receipt {
  if (isPriority) {
    if (section.availableSeats < order.seatCount) {
      throw new Error(`Not enough seats left in ${section.name} for a priority booking`);
    }
    section.availableSeats -= order.seatCount;
    return {
      customerName: order.customerName,
      seatCount: order.seatCount,
      status: "confirmed",
    };
  }
  if (section.availableSeats >= order.seatCount) {
    section.availableSeats -= order.seatCount;
    return {
      customerName: order.customerName,
      seatCount: order.seatCount,
      status: "pending",
    };
  }
  section.waitlist.push(order.customerName);
  return {
    customerName: order.customerName,
    seatCount: order.seatCount,
    status: "waitlisted",
  };
}
