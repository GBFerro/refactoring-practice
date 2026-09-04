import type { Order } from "./order";
import { CalculateHandlingFeeCommand } from "./handling-fee-command";

/**
 * The three places the box office needs an order's handling fee: the checkout screen,
 * the printed receipt, and the running total a customer actually pays.
 */
export function handlingFeeFor(order: Order): number {
  return new CalculateHandlingFeeCommand(order).execute();
}

/** The line a receipt prints under the seat total. */
export function formatFeeLine(order: Order): string {
  const fee = new CalculateHandlingFeeCommand(order).execute();
  return `Handling fee: ${formatPounds(fee)}`;
}

/** What the customer actually pays: seats plus the handling fee. */
export function totalWithFee(order: Order): number {
  const fee = new CalculateHandlingFeeCommand(order).execute();
  return order.seatCount * order.pricePerSeatPounds + fee;
}

function formatPounds(amount: number): string {
  return `£${amount.toFixed(2)}`;
}
