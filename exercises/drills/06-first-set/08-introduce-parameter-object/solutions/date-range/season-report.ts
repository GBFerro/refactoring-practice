import type { DateRange } from "./date-range";
import type { Race, Season } from "./season";

const NAME_WIDTH = 30;

export function renderReport(season: Season, range: DateRange): string {
  const races = racesInRange(season.races, range);
  return [
    `${season.club} - ${String(season.year)} season`,
    renderRangeLine(range),
    ...races.map(renderRace),
    ...renderTotals(races, range),
  ].join("\n");
}

function renderRangeLine(range: DateRange): string {
  return `${range.from} to ${range.to} (${String(range.days)} days)`;
}

function racesInRange(races: readonly Race[], range: DateRange): Race[] {
  return races.filter((race) => range.includes(race.date)).sort(byDate);
}

function byDate(a: Race, b: Race): number {
  return Date.parse(a.date) - Date.parse(b.date);
}

function renderRace(race: Race): string {
  return `${race.date}  ${race.name.padEnd(NAME_WIDTH)} ${formatKm(race.distanceKm)}`;
}

function renderTotals(races: readonly Race[], range: DateRange): string[] {
  const totals = [
    `Races: ${String(races.length)}`,
    `Distance: ${formatKm(totalKm(races))}`,
    `Weekly average: ${formatKm(totalKm(races) / range.weeks)}`,
  ];
  const longest = longestRace(races);
  if (longest === undefined) return totals;
  return [...totals, `Longest: ${longest.name} (${formatKm(longest.distanceKm)})`];
}

function totalKm(races: readonly Race[]): number {
  return races.reduce((sum, race) => sum + race.distanceKm, 0);
}

function longestRace(races: readonly Race[]): Race | undefined {
  return races.reduce<Race | undefined>(
    (best, race) =>
      best === undefined || race.distanceKm > best.distanceKm ? race : best,
    undefined,
  );
}

function formatKm(km: number): string {
  return `${km.toFixed(1)} km`;
}
