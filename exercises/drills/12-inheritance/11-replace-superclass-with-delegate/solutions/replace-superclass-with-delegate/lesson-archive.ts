import { LessonRoster } from "./lesson-roster";
import type { Lesson } from "./types";

/**
 * Completed lessons, kept for the record. An archive is not a schedule: it holds one
 * privately, and exposes only the two things an archive actually does - add an entry,
 * and read them all back.
 */
export class LessonArchive {
  readonly #roster = new LessonRoster();

  add(lesson: Lesson): void {
    this.#roster.add(lesson);
  }

  entries(): readonly Lesson[] {
    return this.#roster.entries();
  }

  count(): number {
    return this.#roster.count();
  }
}
