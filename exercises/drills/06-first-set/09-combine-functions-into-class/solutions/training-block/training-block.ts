import type { Runner } from "./runner";
import type { TrainingPlan, TrainingWeek } from "./training-plan";

/**
 * A runner paired with the plan they are following. Every derived value is computed from
 * the two records on demand, not cached - the block stays honest if either one changes
 * while the block is still in someone's hand.
 */
export class TrainingBlock {
  constructor(
    private readonly runner: Runner,
    private readonly plan: TrainingPlan,
  ) {}

  get runnerName(): string {
    return this.runner.name;
  }

  get raceName(): string {
    return this.plan.race;
  }

  get totalWeeks(): number {
    return this.plan.weeks.length;
  }

  get totalDistanceKm(): number {
    let total = 0;
    for (let week = 0; week < this.totalWeeks; week++) {
      total += this.targetDistanceKm(week);
    }
    return total;
  }

  weekLabel(week: number): string {
    return this.weekAt(week).label;
  }

  targetDistanceKm(week: number): number {
    return Math.round(this.runner.weeklyBaseKm * this.weekAt(week).loadFactor);
  }

  targetPaceSecondsPerKm(week: number): number {
    return (
      this.runner.thresholdPaceSecondsPerKm + this.weekAt(week).paceOffsetSecondsPerKm
    );
  }

  isRecoveryWeek(week: number): boolean {
    return this.weekAt(week).recovery;
  }

  private weekAt(week: number): TrainingWeek {
    const found = this.plan.weeks[week];
    if (found === undefined) {
      throw new RangeError(`Week ${String(week)} is out of range for this plan.`);
    }
    return found;
  }
}
