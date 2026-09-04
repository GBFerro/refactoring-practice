import type { Order } from "./order";

/** Every order pays this much just to be processed, seats or no seats. */
const BASE_FEE_POUNDS = 2;
/** On top of the base, per seat in the order. */
const PER_SEAT_FEE_POUNDS = 1.5;
/** Inside this many hours of showtime, a booking counts as rush. */
const RUSH_WINDOW_HOURS = 24;
/** Added once, on top of everything else, for a rush booking. */
const RUSH_SURCHARGE_POUNDS = 5;
/** No handling fee is ever charged past this, however large the order. */
const MAX_FEE_POUNDS = 20;

/**
 * The box office's handling fee for one order: a base, a per-seat amount, a rush
 * surcharge inside the booking window, capped so no order is ever charged past the max.
 */
export class CalculateHandlingFeeCommand {
  constructor(private readonly order: Order) {}

  execute(): number {
    const base = BASE_FEE_POUNDS + PER_SEAT_FEE_POUNDS * this.order.seatCount;
    const withRush =
      this.order.hoursUntilShowtime < RUSH_WINDOW_HOURS
        ? base + RUSH_SURCHARGE_POUNDS
        : base;
    return Math.min(withRush, MAX_FEE_POUNDS);
  }
}
