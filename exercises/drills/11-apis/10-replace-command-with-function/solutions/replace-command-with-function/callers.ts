import type { Order } from "./order";
import { calculateHandlingFee } from "./handling-fee";

/**
 * The three places the box office needs an order's handling fee: the checkout screen,
 * the printed receipt, and the running total a customer actually pays.
 */
export function handlingFeeFor(order: Order): number {
  return calculateHandlingFee(order);
}

/** The line a receipt prints under the seat total. */
export function formatFeeLine(order: Order): string {
  return `Handling fee: ${formatPounds(calculateHandlingFee(order))}`;
}

/** What the customer actually pays: seats plus the handling fee. */
export function totalWithFee(order: Order): number {
  return order.seatCount * order.pricePerSeatPounds + calculateHandlingFee(order);
}

function formatPounds(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
