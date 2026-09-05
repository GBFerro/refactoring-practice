/** A lesson taught this week. For payroll and invoicing, only its length matters. */
export interface LoggedLesson {
  readonly durationMinutes: number;
}

export type TutorKind = "staff" | "freelance";

/**
 * Someone who teaches at Beckworth. Staff tutors are salaried and paid through payroll for
 * the hours they log; freelance tutors invoice the school per lesson and never touch
 * payroll at all.
 */
export abstract class Tutor {
  constructor(
    readonly name: string,
    readonly kind: TutorKind,
    protected readonly lessonsThisWeek: readonly LoggedLesson[],
  ) {}

  /** Teaching minutes logged this week, rounded to the nearest payroll quarter-hour. */
  weeklyPayrollHours(): number {
    const minutes = this.lessonsThisWeek.reduce(
      (sum, lesson) => sum + lesson.durationMinutes,
      0,
    );
    return Math.round(minutes / 15) / 4;
  }
}
