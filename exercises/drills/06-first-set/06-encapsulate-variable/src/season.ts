import { settings, type SeasonConfig } from "./club-settings";

export type { SeasonConfig };

export function startSeason(config: SeasonConfig): void {
  settings.duesCents = config.duesCents;
  settings.lateFeeRatePercent = config.lateFeeRatePercent;
  settings.capacity = config.capacity;
  settings.memberCount = 0;
  settings.registrationOpen = true;
}

export function closeRegistration(): void {
  settings.registrationOpen = false;
}
