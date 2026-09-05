import type { Tutor } from "./types";

/** What every kind of booked lesson has: who teaches it, and how long. */
export interface LessonProps {
  readonly tutor: Tutor;
  readonly durationMinutes: number;
}

/** A booked lesson slot. Concrete subclasses say who is in the room, and what it costs. */
export abstract class Lesson {
  protected readonly tutor: Tutor;
  protected readonly durationMinutes: number;

  protected constructor(props: LessonProps) {
    this.tutor = props.tutor;
    this.durationMinutes = props.durationMinutes;
  }

  abstract invoiceDescription(): string;
}
