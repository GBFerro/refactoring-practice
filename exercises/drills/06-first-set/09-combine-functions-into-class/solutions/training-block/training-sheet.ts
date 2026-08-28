import { formatPace } from "./format";
import type { Runner } from "./runner";
import { TrainingBlock } from "./training-block";
import type { TrainingPlan } from "./training-plan";

const LABEL_WIDTH = 12;
const DISTANCE_WIDTH = 3;

export function renderTrainingSheet(runner: Runner, plan: TrainingPlan): string {
  const block = new TrainingBlock(runner, plan);
  const title = `${block.runnerName} - ${block.raceName}`;
  const lines = [
    title,
    "=".repeat(title.length),
    ...weekLines(block),
    "-".repeat(title.length),
    `Total: ${String(block.totalDistanceKm)} km`,
  ];
  return lines.join("\n");
}

function weekLines(block: TrainingBlock): string[] {
  return Array.from({ length: block.totalWeeks }, (_unused, week) =>
    renderWeek(block, week),
  );
}

function renderWeek(block: TrainingBlock, week: number): string {
  const label = block.weekLabel(week).padEnd(LABEL_WIDTH);
  const distance = String(block.targetDistanceKm(week)).padStart(DISTANCE_WIDTH);
  const pace = formatPace(block.targetPaceSecondsPerKm(week));
  const marker = block.isRecoveryWeek(week) ? " (recovery)" : "";
  return `${label} ${distance} km  ${pace}${marker}`.trimEnd();
}
