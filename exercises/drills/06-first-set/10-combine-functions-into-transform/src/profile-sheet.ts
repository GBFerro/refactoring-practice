import { formatClock, formatPace } from "./format";
import { ageGroupOf, bestPaceOf, handicapOf, isSelectableOf } from "./runner-profile";
import { SEASON, type RunnerRecord } from "./runner";

const NAME_WIDTH = 22;
const GROUP_WIDTH = 4;
const PACE_WIDTH = 9;
const HANDICAP_WIDTH = 6;

export function renderProfileCard(runner: RunnerRecord): string {
  return [
    runner.name,
    `${ageGroupOf(runner)} · member since ${String(runner.joinedSeason)}`,
    `Best pace ${renderPace(runner)}`,
    `Handicap +${formatClock(handicapOf(runner))}`,
    isSelectableOf(runner) ? "Available for selection" : "Not eligible for selection",
  ].join("\n");
}

export function renderSquadSheet(runners: readonly RunnerRecord[]): string {
  const title = `Silverbrook Squad Sheet - ${String(SEASON)}`;
  const rows = [...runners].sort(byBestPace).map(renderSquadRow);
  return [title, "=".repeat(title.length), ...rows].join("\n");
}

function renderSquadRow(runner: RunnerRecord): string {
  const columns = [
    runner.name.padEnd(NAME_WIDTH),
    ageGroupOf(runner).padEnd(GROUP_WIDTH),
    renderPace(runner).padEnd(PACE_WIDTH),
    `+${formatClock(handicapOf(runner))}`.padStart(HANDICAP_WIDTH),
    isSelectableOf(runner) ? "yes" : "no",
  ];
  return columns.join(" ").trimEnd();
}

function renderPace(runner: RunnerRecord): string {
  const pace = bestPaceOf(runner);
  return pace === null ? "unranked" : formatPace(pace);
}

/** Fastest first; runners with no qualifying time sink to the bottom, order kept. */
function byBestPace(left: RunnerRecord, right: RunnerRecord): number {
  const first = rankOf(left);
  const second = rankOf(right);
  if (first === second) return 0;
  return first < second ? -1 : 1;
}

function rankOf(runner: RunnerRecord): number {
  return bestPaceOf(runner) ?? Number.POSITIVE_INFINITY;
}
