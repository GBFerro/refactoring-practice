import { settings } from "./club-settings";

export function lateFeeCents(): number {
  return Math.round((settings.duesCents * settings.lateFeeRatePercent) / 100);
}

export function raiseDues(byCents: number): void {
  settings.duesCents = settings.duesCents + byCents;
}
