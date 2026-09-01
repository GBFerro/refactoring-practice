import type { Delivery, SupplierReport } from "./types";

const TITLE_PREFIX = "Supplier Report — week of ";

export function renderSupplierReport(report: SupplierReport): string {
  const lines = [
    ...renderHeader(report),
    "Accepted:",
    ...renderAcceptedSection(report.deliveries),
    "Rejected:",
    ...renderRejectedSection(report.deliveries),
    "-".repeat(titleOf(report).length),
    ...renderSummary(report),
  ];
  return lines.join("\n");
}

function titleOf(report: SupplierReport): string {
  return `${TITLE_PREFIX}${report.weekOf}`;
}

function renderHeader(report: SupplierReport): string[] {
  const title = titleOf(report);
  return [title, "=".repeat(title.length)];
}

function acceptedDeliveries(deliveries: readonly Delivery[]): Delivery[] {
  const accepted: Delivery[] = [];
  for (const delivery of deliveries) {
    if (delivery.qualityPassed) {
      accepted.push(delivery);
    }
  }
  return accepted;
}

function rejectedDeliveries(deliveries: readonly Delivery[]): Delivery[] {
  const rejected: Delivery[] = [];
  for (const delivery of deliveries) {
    if (!delivery.qualityPassed) {
      rejected.push(delivery);
    }
  }
  return rejected;
}

function renderAcceptedSection(deliveries: readonly Delivery[]): string[] {
  const accepted = acceptedDeliveries(deliveries);
  const lines: string[] = [];
  for (const delivery of accepted) {
    lines.push(renderAcceptedLine(delivery));
  }
  return lines.length > 0 ? lines : ["  (none)"];
}

function renderRejectedSection(deliveries: readonly Delivery[]): string[] {
  const rejected = rejectedDeliveries(deliveries);
  const lines: string[] = [];
  for (const delivery of rejected) {
    lines.push(renderRejectedLine(delivery));
  }
  return lines.length > 0 ? lines : ["  (none)"];
}

function renderAcceptedLine(delivery: Delivery): string {
  const cost = formatCents(delivery.costCents);
  return `  ${delivery.supplierName} — ${delivery.itemName}: ${String(delivery.weightKg)}kg, ${cost}`;
}

function renderRejectedLine(delivery: Delivery): string {
  const reason = delivery.rejectionReason ?? "no reason given";
  return `  ${delivery.supplierName} — ${delivery.itemName}: rejected (${reason})`;
}

function renderSummary(report: SupplierReport): string[] {
  const accepted = acceptedDeliveries(report.deliveries);
  const rejected = rejectedDeliveries(report.deliveries);
  const total = report.deliveries.length;
  const acceptedTotal = formatCents(acceptedTotalCents(accepted));
  return [
    `Accepted: ${String(accepted.length)} of ${String(total)} deliveries, ${acceptedTotal}`,
    `Rejected: ${String(rejected.length)} of ${String(total)} deliveries`,
    renderCapacityLine(report),
  ];
}

function acceptedTotalCents(accepted: readonly Delivery[]): number {
  let total = 0;
  for (const delivery of accepted) {
    total += delivery.costCents;
  }
  return total;
}

function renderCapacityLine(report: SupplierReport): string {
  const breach = findCapacityBreach(report.deliveries, report.truckCapacityKg);
  const capacity = `Truck capacity: ${String(report.truckCapacityKg)}kg`;
  if (breach === undefined) return `${capacity} — within capacity`;
  const at = `delivery ${String(breach.position)} (${breach.supplierName})`;
  return `${capacity} — would exceed at ${at}`;
}

interface CapacityBreach {
  readonly position: number;
  readonly supplierName: string;
}

// Deliberately still a loop, not a pipeline: the running weight has to stop accumulating
// the instant it crosses the limit, and the answer is "the first delivery that tips the
// scale". reduce() cannot stop partway through, so it would keep folding weight into the
// total long after the breach is already known - correct, but wasted work, and a reduce
// callback that also has to remember "have I already found it?" is a loop wearing a
// pipeline's clothes. A plain loop that returns the moment it knows says the same thing
// in less code.
function findCapacityBreach(
  deliveries: readonly Delivery[],
  capacityKg: number,
): CapacityBreach | undefined {
  let runningWeightKg = 0;
  for (const [index, delivery] of deliveries.entries()) {
    runningWeightKg += delivery.weightKg;
    if (runningWeightKg <= capacityKg) continue;
    return { position: index + 1, supplierName: delivery.supplierName };
  }
  return undefined;
}

function formatCents(cents: number): string {
  const wholeDollars = Math.floor(cents / 100);
  const remainingCents = cents % 100;
  return `$${String(wholeDollars)}.${String(remainingCents).padStart(2, "0")}`;
}
