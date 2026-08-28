import { SEASON, type RunnerRecord } from "./runner";

/** A result counts towards selection only if it is recent enough and long enough. */
const QUALIFYING_FROM_SEASON = SEASON - 1;
const QUALIFYING_DISTANCE_KM = 5;
const QUALIFYING_RESULTS_FOR_SELECTION = 2;

/** Handicap races are run over 10 km off a scratch pace of 3:20/km. */
const HANDICAP_DISTANCE_KM = 10;
const SCRATCH_PACE_SECONDS_PER_KM = 200;
const VETERAN_AGE = 35;
const VETERAN_ALLOWANCE_SECONDS = 30;

export function ageGroupOf(runner: RunnerRecord): string {
  const age = SEASON - runner.birthYear;
  if (age < 20) return "U20";
  if (age < VETERAN_AGE) return "SEN";
  return `V${String(Math.floor(age / 5) * 5)}`;
}

export function bestPaceOf(runner: RunnerRecord): number | null {
  const qualifying = runner.results.filter(
    (result) =>
      result.season >= QUALIFYING_FROM_SEASON &&
      result.distanceKm >= QUALIFYING_DISTANCE_KM,
  );
  if (qualifying.length === 0) return null;
  return Math.min(...qualifying.map((result) => result.seconds / result.distanceKm));
}

export function handicapOf(runner: RunnerRecord): number {
  const qualifying = runner.results.filter(
    (result) =>
      result.season >= QUALIFYING_FROM_SEASON &&
      result.distanceKm >= QUALIFYING_DISTANCE_KM,
  );
  const bestPaceSecondsPerKm =
    qualifying.length === 0
      ? null
      : Math.min(...qualifying.map((result) => result.seconds / result.distanceKm));
  const pace = bestPaceSecondsPerKm ?? SCRATCH_PACE_SECONDS_PER_KM;
  const gap = Math.round((pace - SCRATCH_PACE_SECONDS_PER_KM) * HANDICAP_DISTANCE_KM);
  const age = SEASON - runner.birthYear;
  const allowance = age >= VETERAN_AGE ? VETERAN_ALLOWANCE_SECONDS : 0;
  return Math.max(0, gap) + allowance;
}

export function isSelectableOf(runner: RunnerRecord): boolean {
  const qualifying = runner.results.filter(
    (result) =>
      result.season >= QUALIFYING_FROM_SEASON &&
      result.distanceKm >= QUALIFYING_DISTANCE_KM,
  );
  return (
    runner.joinedSeason < SEASON && qualifying.length >= QUALIFYING_RESULTS_FOR_SELECTION
  );
}
