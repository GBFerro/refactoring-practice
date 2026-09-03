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

interface BakeUnits {
  readonly bakeUnits: number;
  readonly batches: number;
}

export function buildDailyBakePlan(
  date: BakeDate,
  catalogue: readonly BakeItem[],
  standingOrders: readonly StandingOrder[],
): BakePlan {
  const ordersBySku = groupStandingOrdersBySku(standingOrders, date.dayOfWeek);
  const lines = planLinesFor(catalogue, ordersBySku);
  const ovenBatchesUsed = lines.reduce((sum, line) => sum + line.batches, 0);
  return { date: date.iso, lines, ovenBatchesUsed };
}

function planLinesFor(items: readonly BakeItem[], orders: OrdersBySku): BakePlanLine[] {
  const lines: BakePlanLine[] = [];

  for (const item of items) {
    const standingUnits = orders.get(item.sku) ?? 0;
    const { bakeUnits, batches } = bakeUnitsFor(item, standingUnits);

    const displayName = item.name.toUpperCase();
    const aisleCode = item.aisle.slice(0, 3).toUpperCase();
    const shelfTag = `${aisleCode}-${displayName}`;

    lines.push({ sku: item.sku, name: item.name, shelfTag, bakeUnits, batches });
  }

  return lines;
}

function bakeUnitsFor(item: BakeItem, standingUnits: number): BakeUnits {
  const bufferUnits = Math.ceil(standingUnits * item.wastageAllowance);
  const neededUnits = standingUnits + bufferUnits;
  const bakeUnits = Math.ceil(neededUnits / item.batchSize) * item.batchSize;
  return { bakeUnits, batches: bakeUnits / item.batchSize };
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
