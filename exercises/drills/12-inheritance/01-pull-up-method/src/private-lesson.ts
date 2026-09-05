import { Lesson, type LessonProps } from "./lesson";
import type { Student } from "./types";

export interface PrivateLessonProps extends LessonProps {
  readonly materialsFeeCents: number;
  readonly student: Student;
}

/** One tutor, one student, for the whole slot. */
export class PrivateLesson extends Lesson {
  readonly #materialsFeeCents: number;
  readonly #student: Student;

  constructor(props: PrivateLessonProps) {
    super(props);
    this.#materialsFeeCents = props.materialsFeeCents;
    this.#student = props.student;
  }

  override invoiceDescription(): string {
    return `Private lesson for ${this.#student.name} with ${this.tutor.name}`;
  }

  /** Tuition for the time booked, plus the flat materials fee, rounded to the cent. */
  billingAmountCents(): number {
    const tuitionCents = (this.tutor.hourlyRateCents * this.durationMinutes) / 60;
    return Math.round(tuitionCents + this.#materialsFeeCents);
  }
}
