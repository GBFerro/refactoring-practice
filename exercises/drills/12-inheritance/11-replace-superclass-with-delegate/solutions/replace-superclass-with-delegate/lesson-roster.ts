import type { Lesson } from "./types";

/**
 * An ordered list of lessons that is still being worked with - the school's live
 * schedule, where lessons get rebooked, cancelled, and reslotted onto a different day.
 */
export class LessonRoster {
  #entries: Lesson[] = [];

  add(lesson: Lesson): void {
    this.#entries.push(lesson);
  }

  insertAt(index: number, lesson: Lesson): void {
    this.#entries.splice(index, 0, lesson);
  }

  removeAt(index: number): void {
    this.#entries.splice(index, 1);
  }

  replaceAt(index: number, lesson: Lesson): void {
    this.#entries[index] = lesson;
  }

  entries(): readonly Lesson[] {
    return this.#entries;
  }

  count(): number {
    return this.#entries.length;
  }
}
