import type { Entry, Finisher, Race } from "./race";

const NAME_WIDTH = 22;
const CLUB_WIDTH = 20;

export function renderRaceReport(race: Race): string {
  const finishers = sortedFinishers(race.entries);
  const lines = [
    ...renderHeader(race),
    ...finishers.map((finisher, index) => renderFinisher(race, finisher, index + 1)),
    ...race.entries.filter(didNotFinish).map(renderDidNotFinish),
    "-".repeat(titleOf(race).length),
    ...renderSummary(race, finishers),
  ];
  return lines.join("\n");
}

function titleOf(race: Race): string {
  return `${race.name} - ${race.date}`;
}

function renderHeader(race: Race): string[] {
  const title = titleOf(race);
  return [title, "=".repeat(title.length)];
}

function sortedFinishers(entries: readonly Entry[]): Finisher[] {
  return entries.filter(isFinisher).sort((a, b) => a.seconds - b.seconds);
}

function isFinisher(entry: Entry): entry is Finisher {
  return entry.seconds !== null;
}

function didNotFinish(entry: Entry): boolean {
  return !isFinisher(entry);
}

function renderFinisher(race: Race, finisher: Finisher, position: number): string {
  const columns = [
    String(position).padStart(3),
    finisher.name.padEnd(NAME_WIDTH),
    finisher.club.padEnd(CLUB_WIDTH),
    formatDuration(finisher.seconds),
    formatPace(paceSecondsPerKm(race, finisher)),
  ];
  return columns.join(" ").trimEnd();
}

function renderDidNotFinish(entry: Entry): string {
  return ["DNF", entry.name.padEnd(NAME_WIDTH), entry.club].join(" ").trimEnd();
}

function renderSummary(race: Race, finishers: readonly Finisher[]): string[] {
  const summary = [`Finishers: ${finishers.length} of ${race.entries.length}`];
  const fastest = finishers[0];
  if (fastest === undefined) return summary;
  summary.push(`Fastest: ${fastest.name} (${formatDuration(fastest.seconds)})`);
  summary.push(`Average pace: ${formatPace(averagePace(race, finishers))}`);
  return summary;
}

function paceSecondsPerKm(race: Race, finisher: Finisher): number {
  return finisher.seconds / race.distanceKm;
}

function averagePace(race: Race, finishers: readonly Finisher[]): number {
  const total = finishers.reduce((sum, one) => sum + paceSecondsPerKm(race, one), 0);
  return total / finishers.length;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const tail = `${pad2(minutes)}:${pad2(rest)}`;
  return hours > 0 ? `${String(hours)}:${tail}` : tail;
}

function formatPace(secondsPerKm: number): string {
  const rounded = Math.round(secondsPerKm);
  return `${String(Math.floor(rounded / 60))}:${pad2(rounded % 60)}/km`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
