import { SEASON, type RaceResult, type RunnerRecord } from "./runner";

/** A result counts towards selection only if it is recent enough and long enough. */
const QUALIFYING_FROM_SEASON = SEASON - 1;
const QUALIFYING_DISTANCE_KM = 5;
const QUALIFYING_RESULTS_FOR_SELECTION = 2;

/** Handicap races are run over 10 km off a scratch pace of 3:20/km. */
const HANDICAP_DISTANCE_KM = 10;
const SCRATCH_PACE_SECONDS_PER_KM = 200;
const VETERAN_AGE = 35;
const VETERAN_ALLOWANCE_SECONDS = 30;

/** The record, plus everything the club derives from it for this season. */
export interface RunnerProfile extends RunnerRecord {
  readonly ageGroup: string;
  readonly bestPaceSecondsPerKm: number | null;
  readonly handicapSeconds: number;
  readonly isSelectable: boolean;
}

export function enrichRunner(runner: RunnerRecord): RunnerProfile {
  const qualifying = qualifyingResults(runner.results);
  const bestPaceSecondsPerKm = bestPace(qualifying);
  const age = ageInSeason(runner.birthYear);
  return {
    ...runner,
    ageGroup: ageGroupFor(age),
    bestPaceSecondsPerKm,
    handicapSeconds: handicapFor(bestPaceSecondsPerKm, age),
    isSelectable: meetsSelectionRules(runner.joinedSeason, qualifying.length),
  };
}

function qualifyingResults(results: readonly RaceResult[]): readonly RaceResult[] {
  return results.filter(
    (result) =>
      result.season >= QUALIFYING_FROM_SEASON &&
      result.distanceKm >= QUALIFYING_DISTANCE_KM,
  );
}

function bestPace(results: readonly RaceResult[]): number | null {
  if (results.length === 0) return null;
  return Math.min(...results.map(paceOf));
}

function paceOf(result: RaceResult): number {
  return result.seconds / result.distanceKm;
}

function ageInSeason(birthYear: number): number {
  return SEASON - birthYear;
}

function ageGroupFor(age: number): string {
  if (age < 20) return "U20";
  if (age < VETERAN_AGE) return "SEN";
  return `V${String(Math.floor(age / 5) * 5)}`;
}

/** The head start, in seconds, over a scratch runner - veterans get an allowance. */
function handicapFor(paceSecondsPerKm: number | null, age: number): number {
  const pace = paceSecondsPerKm ?? SCRATCH_PACE_SECONDS_PER_KM;
  const gap = Math.round((pace - SCRATCH_PACE_SECONDS_PER_KM) * HANDICAP_DISTANCE_KM);
  const allowance = age >= VETERAN_AGE ? VETERAN_ALLOWANCE_SECONDS : 0;
  return Math.max(0, gap) + allowance;
}

function meetsSelectionRules(joinedSeason: number, qualifyingCount: number): boolean {
  return joinedSeason < SEASON && qualifyingCount >= QUALIFYING_RESULTS_FOR_SELECTION;
}
