import { Lesson, type LessonProps } from "./lesson";
import type { Student } from "./types";

export interface PrivateLessonProps extends LessonProps {
  readonly student: Student;
}

/** One tutor, one student, for the whole slot. */
export class PrivateLesson extends Lesson {
  readonly #student: Student;

  constructor(props: PrivateLessonProps) {
    super(props);
    this.#student = props.student;
  }

  override invoiceDescription(): string {
    return `Private lesson for ${this.#student.name} with ${this.tutor.name}`;
  }
}
