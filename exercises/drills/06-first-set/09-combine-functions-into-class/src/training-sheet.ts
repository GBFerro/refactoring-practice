import { formatPace } from "./format";
import type { Runner } from "./runner";
import {
  isRecoveryWeek,
  raceName,
  runnerName,
  targetDistanceKm,
  targetPaceSecondsPerKm,
  totalDistanceKm,
  totalWeeks,
  weekLabel,
} from "./training-block";
import type { TrainingPlan } from "./training-plan";

const LABEL_WIDTH = 12;
const DISTANCE_WIDTH = 3;

export function renderTrainingSheet(runner: Runner, plan: TrainingPlan): string {
  const title = `${runnerName(runner, plan)} - ${raceName(runner, plan)}`;
  const lines = [
    title,
    "=".repeat(title.length),
    ...weekLines(runner, plan),
    "-".repeat(title.length),
    `Total: ${String(totalDistanceKm(runner, plan))} km`,
  ];
  return lines.join("\n");
}

function weekLines(runner: Runner, plan: TrainingPlan): string[] {
  return Array.from({ length: totalWeeks(runner, plan) }, (_unused, week) =>
    renderWeek(runner, plan, week),
  );
}

function renderWeek(runner: Runner, plan: TrainingPlan, week: number): string {
  const label = weekLabel(runner, plan, week).padEnd(LABEL_WIDTH);
  const distance = String(targetDistanceKm(runner, plan, week)).padStart(DISTANCE_WIDTH);
  const pace = formatPace(targetPaceSecondsPerKm(runner, plan, week));
  const marker = isRecoveryWeek(runner, plan, week) ? " (recovery)" : "";
  return `${label} ${distance} km  ${pace}${marker}`.trimEnd();
}
