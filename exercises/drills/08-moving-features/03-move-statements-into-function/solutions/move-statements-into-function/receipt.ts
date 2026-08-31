import type { OrderItem, WholesaleOrder } from "./types";

/** Turns an order into the lines a driver or the office hands to a customer. */
export function renderReceipt(order: WholesaleOrder): string[] {
  const totalCents = Math.max(0, subtotal(order.items) - order.creditCents);
  return [
    `Ashgrove Bakery Co-op — Order ${order.id}`,
    `Deliver to: ${order.customerName}, ${order.routeName} route`,
    ...order.items.map(renderItemLine),
    `Total: ${formatCents(totalCents)}`,
  ];
}

function subtotal(items: readonly OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
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
