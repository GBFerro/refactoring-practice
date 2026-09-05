/** A lesson taught this week. For payroll and invoicing, only its length matters. */
export interface LoggedLesson {
  readonly durationMinutes: number;
}

/**
 * Someone who teaches at Beckworth. Staff tutors are salaried and paid through payroll for
 * the hours they log; freelance tutors invoice the school per lesson and never touch
 * payroll at all.
 */
export abstract class Tutor {
  constructor(
    readonly name: string,
    protected readonly lessonsThisWeek: readonly LoggedLesson[],
  ) {}
}
