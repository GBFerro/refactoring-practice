import type { PracticeRoom } from "./practice-room";

export interface PracticeBooking {
  readonly room: PracticeRoom;
  readonly hours: number;
}

/** One day's practice-room bookings: a line each, then the day's total. */
export function renderPracticeSchedule(bookings: readonly PracticeBooking[]): string[] {
  if (bookings.length === 0) return ["No practice rooms booked today."];
  return [
    ...bookings.map(renderBookingLine),
    `Total: ${formatCents(totalCostCents(bookings))}`,
  ];
}

function renderBookingLine(booking: PracticeBooking): string {
  const cost = formatCents(booking.room.bookingCostCents(booking.hours));
  return `${booking.room.describe()} - ${String(booking.hours)}h - ${cost}`;
}

function totalCostCents(bookings: readonly PracticeBooking[]): number {
  return bookings.reduce(
    (sum, booking) => sum + booking.room.bookingCostCents(booking.hours),
    0,
  );
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
