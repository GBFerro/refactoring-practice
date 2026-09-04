import type { Booking } from "./box-office";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const FULL_REFUND_CUTOFF_DAYS = 14;
const PARTIAL_REFUND_CUTOFF_DAYS = 3;

/** The refund a cancellation is entitled to, given how many days out it happens. */
export function refundAmountCents(booking: Booking, daysUntilShow: number): number {
  if (daysUntilShow >= FULL_REFUND_CUTOFF_DAYS) {
    return booking.seatPriceCents;
  }
  if (daysUntilShow >= PARTIAL_REFUND_CUTOFF_DAYS) {
    return Math.round(booking.seatPriceCents / 2);
  }
  return 0;
}

/** The whole number of days between two moments, rounded down. */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}
