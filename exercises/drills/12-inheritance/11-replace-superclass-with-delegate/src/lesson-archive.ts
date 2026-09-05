import { LessonRoster } from "./lesson-roster";

/**
 * Completed lessons, kept for the record. Once a lesson lands here it happened, in that
 * order, and that is not up for revision.
 */
export class LessonArchive extends LessonRoster {
  override insertAt(): never {
    throw new Error("LessonArchive is append-only: cannot insert at a position");
  }

  override removeAt(): never {
    throw new Error("LessonArchive is append-only: entries cannot be removed");
  }
}
