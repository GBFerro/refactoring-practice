import {
  currentDuesCents,
  currentLateFeeRatePercent,
  raiseDuesBy,
} from "./club-settings";

export function lateFeeCents(): number {
  return Math.round((currentDuesCents() * currentLateFeeRatePercent()) / 100);
}

export function raiseDues(byCents: number): void {
  raiseDuesBy(byCents);
}
