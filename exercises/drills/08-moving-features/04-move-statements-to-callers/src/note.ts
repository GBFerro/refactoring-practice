import type { DispatchItem, DispatchStop } from "./types";

/** Every line handed over for a stop: who it's for, what's in it, and how it closes. */
export function renderDispatchNote(stop: DispatchStop, forCourier: boolean): string[] {
  const lines = [
    `Ashgrove Bakery Co-op — Stop ${stop.id}`,
    `Deliver to: ${stop.customerName}, ${stop.destination}`,
    ...stop.items.map(renderItemLine),
  ];
  const grams = totalWeightGrams(stop.items);
  if (forCourier) {
    lines.push(`Total weight: ${formatKilograms(grams / 1000)} kg`);
    lines.push("Courier handoff — Ashgrove liability ends at pickup.");
  } else {
    lines.push(`Total weight: ${grams} g`);
    lines.push("Please sign at the door to confirm receipt.");
  }
  return lines;
}

function renderItemLine(item: DispatchItem): string {
  return `  ${item.quantity} x ${item.name}`;
}

function totalWeightGrams(items: readonly DispatchItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitWeightGrams, 0);
}

function formatKilograms(kilograms: number): string {
  return kilograms.toFixed(1);
}
