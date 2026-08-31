import { renderReceipt } from "./receipt";
import type { WholesaleOrder } from "./types";

/** Printed when a driver marks a route stop delivered and hands the receipt over. */
export function completeRouteStop(order: WholesaleOrder): string[] {
  const subtotalCents = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const totalCents = Math.max(0, subtotalCents - order.creditCents);
  return [...renderReceipt(order, totalCents), "Signed for at the door."];
}

/** Printed when a standing order closes for the week and is filed with the invoice. */
export function closeStandingOrder(order: WholesaleOrder): string[] {
  const subtotalCents = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const totalCents = Math.max(0, subtotalCents - order.creditCents);
  return [...renderReceipt(order, totalCents), "Filed with this week's invoice packet."];
}

/** Printed when the office reprints a receipt a customer says they never got. */
export function reprintReceipt(order: WholesaleOrder): string[] {
  const subtotalCents = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const totalCents = subtotalCents - order.creditCents;
  return [...renderReceipt(order, totalCents), "REPRINT"];
}
