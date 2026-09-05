import type { Tutor } from "./types";

/** What every kind of booked lesson has: who teaches it, how long, what it costs to sit. */
export interface LessonProps {
  readonly tutor: Tutor;
  readonly durationMinutes: number;
  readonly materialsFeeCents: number;
}

/** A booked lesson slot. Concrete subclasses say who is in the room; billing does not care. */
export abstract class Lesson {
  protected readonly tutor: Tutor;
  protected readonly durationMinutes: number;
  protected readonly materialsFeeCents: number;

  protected constructor(props: LessonProps) {
    this.tutor = props.tutor;
    this.durationMinutes = props.durationMinutes;
    this.materialsFeeCents = props.materialsFeeCents;
  }

  /** Tuition for the time booked, plus the flat materials fee, rounded to the cent. */
  billingAmountCents(): number {
    const tuitionCents = (this.tutor.hourlyRateCents * this.durationMinutes) / 60;
    return Math.round(tuitionCents + this.materialsFeeCents);
  }

  abstract invoiceDescription(): string;
}
