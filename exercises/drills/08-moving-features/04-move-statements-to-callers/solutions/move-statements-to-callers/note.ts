import type { DispatchItem, DispatchStop } from "./types";

/** The lines every dispatch note opens with, before either caller adds its own close. */
export function renderStopSummary(stop: DispatchStop): string[] {
  return [
    `Ashgrove Bakery Co-op — Stop ${stop.id}`,
    `Deliver to: ${stop.customerName}, ${stop.destination}`,
    ...stop.items.map(renderItemLine),
  ];
}

function renderItemLine(item: DispatchItem): string {
  return `  ${item.quantity} x ${item.name}`;
}

export function totalWeightGrams(items: readonly DispatchItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitWeightGrams, 0);
}
