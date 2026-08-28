import { DateRange, monthOf } from "./date-range";
import { renderReport } from "./season-report";
import type { Season } from "./season";

/** Everything the club has run since the season opened, up to and including today. */
export function renderSeasonToDate(season: Season, today: string): string {
  return renderReport(season, new DateRange(season.opensOn, today));
}

/** One calendar month, given as `yyyy-mm`. */
export function renderMonthReport(season: Season, month: string): string {
  return renderReport(season, monthOf(month));
}

/** Whatever window the secretary typed at the prompt. */
export function renderCustomReport(season: Season, from: string, to: string): string {
  return renderReport(season, new DateRange(from, to));
}
