import type { DayTotals, Order, ProductionDay } from "./types";

const CO_OP_NAME = "Ashgrove Bakery Co-op";
const GRAMS_PER_KG = 1000;

export function renderProductionSummary(day: ProductionDay): string {
  const totals = dayTotals(day.orders);
  return [
    `${CO_OP_NAME} — ${day.dateLabel}`,
    `Till total: ${formatCents(totals.revenueCents)}`,
    `Flour to draw for tomorrow: ${formatGrams(totals.flourGramsUsed)}`,
  ].join("\n");
}

function dayTotals(orders: readonly Order[]): DayTotals {
  return {
    revenueCents: revenueCents(orders),
    flourGramsUsed: flourGramsUsed(orders),
  };
}

function revenueCents(orders: readonly Order[]): number {
  let total = 0;
  for (const order of orders) {
    total += order.totalCents;
  }
  return total;
}

function flourGramsUsed(orders: readonly Order[]): number {
  let total = 0;
  for (const order of orders) {
    total += order.flourGrams;
  }
  return total;
}

function formatCents(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainingCents = cents % 100;
  return `$${String(dollars)}.${String(remainingCents).padStart(2, "0")}`;
}

function formatGrams(grams: number): string {
  if (grams < GRAMS_PER_KG) return `${String(grams)}g`;
  const kg = grams / GRAMS_PER_KG;
  return `${kg % 1 === 0 ? String(kg) : kg.toFixed(1)}kg`;
}
