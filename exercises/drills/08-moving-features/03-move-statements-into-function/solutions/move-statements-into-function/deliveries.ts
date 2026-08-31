import { renderReceipt } from "./receipt";
import type { WholesaleOrder } from "./types";

/** Printed when a driver marks a route stop delivered and hands the receipt over. */
export function completeRouteStop(order: WholesaleOrder): string[] {
  return [...renderReceipt(order), "Signed for at the door."];
}

/** Printed when a standing order closes for the week and is filed with the invoice. */
export function closeStandingOrder(order: WholesaleOrder): string[] {
  return [...renderReceipt(order), "Filed with this week's invoice packet."];
}

/** Printed when the office reprints a receipt a customer says they never got. */
export function reprintReceipt(order: WholesaleOrder): string[] {
  return [...renderReceipt(order), "REPRINT"];
}
