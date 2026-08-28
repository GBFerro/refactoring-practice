import type { Runner } from "./runner";
import type { TrainingPlan, TrainingWeek } from "./training-plan";

export function runnerName(runner: Runner, _plan: TrainingPlan): string {
  return runner.name;
}

export function raceName(_runner: Runner, plan: TrainingPlan): string {
  return plan.race;
}

export function totalWeeks(_runner: Runner, plan: TrainingPlan): number {
  return plan.weeks.length;
}

export function totalDistanceKm(runner: Runner, plan: TrainingPlan): number {
  let total = 0;
  for (let week = 0; week < totalWeeks(runner, plan); week++) {
    total += targetDistanceKm(runner, plan, week);
  }
  return total;
}

function weekAt(plan: TrainingPlan, week: number): TrainingWeek {
  const found = plan.weeks[week];
  if (found === undefined) {
    throw new RangeError(`Week ${String(week)} is out of range for this plan.`);
  }
  return found;
}

export function weekLabel(_runner: Runner, plan: TrainingPlan, week: number): string {
  return weekAt(plan, week).label;
}

export function isRecoveryWeek(
  _runner: Runner,
  plan: TrainingPlan,
  week: number,
): boolean {
  return weekAt(plan, week).recovery;
}

export function targetDistanceKm(
  runner: Runner,
  plan: TrainingPlan,
  week: number,
): number {
  return Math.round(runner.weeklyBaseKm * weekAt(plan, week).loadFactor);
}

export function targetPaceSecondsPerKm(
  runner: Runner,
  plan: TrainingPlan,
  week: number,
): number {
  return runner.thresholdPaceSecondsPerKm + weekAt(plan, week).paceOffsetSecondsPerKm;
}
