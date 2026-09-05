import { Tutor, type LoggedLesson } from "./tutor";

export class FreelanceTutor extends Tutor {
  readonly #perLessonRateCents: number;

  constructor(
    name: string,
    lessonsThisWeek: readonly LoggedLesson[],
    perLessonRateCents: number,
  ) {
    super(name, lessonsThisWeek);
    this.#perLessonRateCents = perLessonRateCents;
  }

  /** What the school owes this tutor for the lessons logged this week. */
  invoiceTotalCents(): number {
    return this.lessonsThisWeek.length * this.#perLessonRateCents;
  }
}
