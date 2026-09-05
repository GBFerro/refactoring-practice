import type { EnrolmentInput } from "./types";

/** One enrolled student, and what their term costs. */
export class Student {
  protected readonly input: EnrolmentInput;

  constructor(input: EnrolmentInput) {
    this.input = input;
  }

  name(): string {
    return this.input.name;
  }

  instrument(): string {
    return this.input.instrument;
  }

  termFeeCents(): number {
    return this.input.baseFeeCents;
  }

  kindLabel(): string {
    return "Regular";
  }
}
