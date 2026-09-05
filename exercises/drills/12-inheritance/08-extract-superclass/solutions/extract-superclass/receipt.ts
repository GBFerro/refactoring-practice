import type { Bookable } from "./bookable";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** One printable receipt line: what was booked, then what it costs. */
export function receiptLine(booking: Bookable): string {
  return `${booking.bookingDescription()}: ${formatCents(booking.costCents())}`;
}

/** The total a batch of bookings comes to, in cents. */
export function totalBookingCents(bookings: readonly Bookable[]): number {
  return bookings.reduce((sum, booking) => sum + booking.costCents(), 0);
}
