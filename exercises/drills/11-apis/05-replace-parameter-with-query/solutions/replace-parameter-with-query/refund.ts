import type { Booking } from "./box-office";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const FULL_REFUND_CUTOFF_DAYS = 14;
const PARTIAL_REFUND_CUTOFF_DAYS = 3;

/** The refund a booking is entitled to if cancelled at `cancelledAt`, in cents. */
export function refundAmountCents(booking: Booking, cancelledAt: Date): number {
  const daysUntilShow = daysBetween(cancelledAt, booking.showDate);
  if (daysUntilShow >= FULL_REFUND_CUTOFF_DAYS) {
    return booking.seatPriceCents;
  }
  if (daysUntilShow >= PARTIAL_REFUND_CUTOFF_DAYS) {
    return Math.round(booking.seatPriceCents / 2);
  }
  return 0;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}
