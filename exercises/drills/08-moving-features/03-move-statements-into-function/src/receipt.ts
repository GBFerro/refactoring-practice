import type { OrderItem, WholesaleOrder } from "./types";

/** Turns an order into the lines a driver or the office hands to a customer. */
export function renderReceipt(order: WholesaleOrder, totalCents: number): string[] {
  return [
    `Ashgrove Bakery Co-op — Order ${order.id}`,
    `Deliver to: ${order.customerName}, ${order.routeName} route`,
    ...order.items.map(renderItemLine),
    `Total: ${formatCents(totalCents)}`,
  ];
}

function renderItemLine(item: OrderItem): string {
  const lineCents = item.quantity * item.unitPriceCents;
  return `  ${item.quantity} x ${item.name} — ${formatCents(lineCents)}`;
}

function formatCents(cents: number): string {
  const wholeDollars = Math.floor(cents / 100);
  const remainingCents = cents % 100;
  return `$${wholeDollars}.${remainingCents.toString().padStart(2, "0")}`;
}
