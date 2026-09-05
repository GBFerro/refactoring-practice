import { Lesson, type LessonProps } from "./lesson";
import type { Student } from "./types";

export interface GroupLessonProps extends LessonProps {
  readonly students: readonly Student[];
}

/** One tutor, several students, one flat fee for the room regardless of how many showed up. */
export class GroupLesson extends Lesson {
  readonly #students: readonly Student[];

  constructor(props: GroupLessonProps) {
    super(props);
    this.#students = props.students;
  }

  override invoiceDescription(): string {
    const noun = this.#students.length === 1 ? "student" : "students";
    return `Group lesson (${String(this.#students.length)} ${noun}) with ${this.tutor.name}`;
  }
}
