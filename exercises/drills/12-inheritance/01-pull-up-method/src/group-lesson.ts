import { Lesson, type LessonProps } from "./lesson";
import type { Student } from "./types";

export interface GroupLessonProps extends LessonProps {
  readonly materialsFeeCents: number;
  readonly students: readonly Student[];
}

/** One tutor, several students, one flat fee for the room regardless of how many showed up. */
export class GroupLesson extends Lesson {
  // Same value as PrivateLesson's materialsFeeCents - this class just kept an older name
  // for it internally.
  readonly #suppliesFeeCents: number;
  readonly #students: readonly Student[];

  constructor(props: GroupLessonProps) {
    super(props);
    this.#suppliesFeeCents = props.materialsFeeCents;
    this.#students = props.students;
  }

  override invoiceDescription(): string {
    const noun = this.#students.length === 1 ? "student" : "students";
    return `Group lesson (${String(this.#students.length)} ${noun}) with ${this.tutor.name}`;
  }

  /** Tuition for the time booked, plus the flat supplies fee, rounded to the cent. */
  billingAmountCents(): number {
    const tuitionCents = (this.tutor.hourlyRateCents * this.durationMinutes) / 60;
    return Math.round(tuitionCents + this.#suppliesFeeCents);
  }
}
