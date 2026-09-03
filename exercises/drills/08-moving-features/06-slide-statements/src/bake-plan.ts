import type { BakeDate, BakeItem, DayOfWeek, StandingOrder } from "./types";

/** One row of the sheet handed to the baker: what to bake, and where it lives on the shelf. */
export interface BakePlanLine {
  readonly sku: string;
  readonly name: string;
  readonly shelfTag: string;
  readonly bakeUnits: number;
  readonly batches: number;
}

/** The full plan for one day: what to bake, and how much oven time it takes. */
export interface BakePlan {
  readonly date: string;
  readonly lines: readonly BakePlanLine[];
  readonly ovenBatchesUsed: number;
}

type OrdersBySku = ReadonlyMap<string, number>;

export function buildDailyBakePlan(
  date: BakeDate,
  catalogue: readonly BakeItem[],
  standingOrders: readonly StandingOrder[],
): BakePlan {
  const ordersBySku = groupStandingOrdersBySku(standingOrders, date.dayOfWeek);
  const lines: BakePlanLine[] = [];
  let ovenBatchesUsed = 0;

  for (const item of catalogue) {
    const standingUnits = ordersBySku.get(item.sku) ?? 0;

    const displayName = item.name.toUpperCase();
    const aisleCode = item.aisle.slice(0, 3).toUpperCase();
    const shelfTag = `${aisleCode}-${displayName}`;

    const bufferUnits = Math.ceil(standingUnits * item.wastageAllowance);
    const neededUnits = standingUnits + bufferUnits;
    const bakeUnits = Math.ceil(neededUnits / item.batchSize) * item.batchSize;
    const batches = bakeUnits / item.batchSize;

    ovenBatchesUsed = ovenBatchesUsed + batches;
    lines.push({ sku: item.sku, name: item.name, shelfTag, bakeUnits, batches });
  }

  return { date: date.iso, lines, ovenBatchesUsed };
}

function groupStandingOrdersBySku(
  orders: readonly StandingOrder[],
  dayOfWeek: DayOfWeek,
): OrdersBySku {
  const totals = new Map<string, number>();
  for (const order of orders) {
    if (!order.daysOfWeek.includes(dayOfWeek)) continue;
    totals.set(order.sku, (totals.get(order.sku) ?? 0) + order.units);
  }
  return totals;
}
