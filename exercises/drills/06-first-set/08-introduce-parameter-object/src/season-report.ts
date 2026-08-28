import type { Race, Season } from "./season";

const NAME_WIDTH = 30;
const MS_PER_DAY = 86_400_000;

export function renderReport(season: Season, from: string, to: string): string {
  const races = racesInRange(season.races, from, to);
  return [
    `${season.club} - ${String(season.year)} season`,
    renderRangeLine(from, to),
    ...races.map(renderRace),
    ...renderTotals(races, from, to),
  ].join("\n");
}

function renderRangeLine(from: string, to: string): string {
  const days = (Date.parse(to) - Date.parse(from)) / MS_PER_DAY + 1;
  return `${from} to ${to} (${String(days)} days)`;
}

function racesInRange(races: readonly Race[], from: string, to: string): Race[] {
  return races.filter((race) => race.date >= from && race.date <= to).sort(byDate);
}

function byDate(a: Race, b: Race): number {
  return Date.parse(a.date) - Date.parse(b.date);
}

function renderRace(race: Race): string {
  return `${race.date}  ${race.name.padEnd(NAME_WIDTH)} ${formatKm(race.distanceKm)}`;
}

function renderTotals(races: readonly Race[], from: string, to: string): string[] {
  const days = (Date.parse(to) - Date.parse(from)) / MS_PER_DAY + 1;
  const totals = [
    `Races: ${String(races.length)}`,
    `Distance: ${formatKm(totalKm(races))}`,
    `Weekly average: ${formatKm(totalKm(races) / (days / 7))}`,
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
