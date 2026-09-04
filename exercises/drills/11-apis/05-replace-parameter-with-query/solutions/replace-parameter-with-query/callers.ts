import type { Booking } from "./box-office";
import { refundAmountCents } from "./refund";

/** A customer cancelling their own booking through the self-service portal. */
export function refundForSelfServiceCancellation(
  booking: Booking,
  cancelledAt: Date,
): number {
  return refundAmountCents(booking, cancelledAt);
}

/** A support agent cancelling a booking on a customer's behalf, over the phone. */
export function refundForSupportDeskCancellation(
  booking: Booking,
  cancelledAt: Date,
): number {
  return refundAmountCents(booking, cancelledAt);
}

/** A venue-initiated cancellation: every booking for a show, refunded at once. */
export function refundForBulkCancellation(
  bookings: readonly Booking[],
  cancelledAt: Date,
): number[] {
  return bookings.map((booking) => refundAmountCents(booking, cancelledAt));
}
