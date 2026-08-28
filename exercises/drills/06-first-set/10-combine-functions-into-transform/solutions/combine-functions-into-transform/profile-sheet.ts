import { formatClock, formatPace } from "./format";
import { enrichRunner, type RunnerProfile } from "./runner-profile";
import { SEASON, type RunnerRecord } from "./runner";

const NAME_WIDTH = 22;
const GROUP_WIDTH = 4;
const PACE_WIDTH = 9;
const HANDICAP_WIDTH = 6;

export function renderProfileCard(runner: RunnerRecord): string {
  const profile = enrichRunner(runner);
  return [
    profile.name,
    `${profile.ageGroup} · member since ${String(profile.joinedSeason)}`,
    `Best pace ${renderPace(profile)}`,
    `Handicap +${formatClock(profile.handicapSeconds)}`,
    profile.isSelectable ? "Available for selection" : "Not eligible for selection",
  ].join("\n");
}

export function renderSquadSheet(runners: readonly RunnerRecord[]): string {
  const title = `Silverbrook Squad Sheet - ${String(SEASON)}`;
  const rows = runners.map(enrichRunner).sort(byBestPace).map(renderSquadRow);
  return [title, "=".repeat(title.length), ...rows].join("\n");
}

function renderSquadRow(profile: RunnerProfile): string {
  const columns = [
    profile.name.padEnd(NAME_WIDTH),
    profile.ageGroup.padEnd(GROUP_WIDTH),
    renderPace(profile).padEnd(PACE_WIDTH),
    `+${formatClock(profile.handicapSeconds)}`.padStart(HANDICAP_WIDTH),
    profile.isSelectable ? "yes" : "no",
  ];
  return columns.join(" ").trimEnd();
}

function renderPace(profile: RunnerProfile): string {
  const pace = profile.bestPaceSecondsPerKm;
  return pace === null ? "unranked" : formatPace(pace);
}

/** Fastest first; runners with no qualifying time sink to the bottom, order kept. */
function byBestPace(left: RunnerProfile, right: RunnerProfile): number {
  const first = rankOf(left);
  const second = rankOf(right);
  if (first === second) return 0;
  return first < second ? -1 : 1;
}

function rankOf(profile: RunnerProfile): number {
  return profile.bestPaceSecondsPerKm ?? Number.POSITIVE_INFINITY;
}
