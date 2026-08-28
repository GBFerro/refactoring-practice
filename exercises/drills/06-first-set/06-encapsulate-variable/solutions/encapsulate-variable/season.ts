import {
  closeSeasonRegistration,
  configureSeason,
  type SeasonConfig,
} from "./club-settings";

export type { SeasonConfig };

export function startSeason(config: SeasonConfig): void {
  configureSeason(config);
}

export function closeRegistration(): void {
  closeSeasonRegistration();
}
