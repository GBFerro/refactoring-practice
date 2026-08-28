/** One line of the club's results archive. */
export interface RaceResult {
  readonly race: string;
  readonly season: number;
  readonly distanceKm: number;
  readonly seconds: number;
}

/** A row of the membership spreadsheet, exactly as the club keeps it. */
export interface RunnerRecord {
  readonly name: string;
  readonly birthYear: number;
  readonly joinedSeason: number;
  readonly results: readonly RaceResult[];
}

/** The season these profiles are printed for. The club reprints them every autumn. */
export const SEASON = 2026;
