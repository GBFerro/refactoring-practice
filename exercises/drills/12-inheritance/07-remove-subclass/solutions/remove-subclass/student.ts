import type { EnrolmentInput } from "./types";

const TRIAL_FEE_FACTOR = 0.5;

/** One enrolled student, and what their term costs - trial or otherwise. */
export class Student {
  readonly #input: EnrolmentInput;

  constructor(input: EnrolmentInput) {
    this.#input = input;
  }

  name(): string {
    return this.#input.name;
  }

  instrument(): string {
    return this.#input.instrument;
  }

  termFeeCents(): number {
    return this.#input.trial
      ? Math.round(this.#input.baseFeeCents * TRIAL_FEE_FACTOR)
      : this.#input.baseFeeCents;
  }

  kindLabel(): string {
    return this.#input.trial ? "Trial" : "Regular";
  }
}
