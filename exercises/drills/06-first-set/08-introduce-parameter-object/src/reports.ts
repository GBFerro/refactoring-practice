import { renderReport } from "./season-report";
import type { Season } from "./season";

/** Everything the club has run since the season opened, up to and including today. */
export function renderSeasonToDate(season: Season, today: string): string {
  return renderReport(season, season.opensOn, today);
}

/** One calendar month, given as `yyyy-mm`. */
export function renderMonthReport(season: Season, month: string): string {
  const year = Number(month.slice(0, 4));
  const ordinal = Number(month.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, ordinal, 0));
  return renderReport(season, `${month}-01`, lastDay.toISOString().slice(0, 10));
}

/** Whatever window the secretary typed at the prompt. */
export function renderCustomReport(season: Season, from: string, to: string): string {
  return renderReport(season, from, to);
}
