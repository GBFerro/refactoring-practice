import { describe, expect, it } from "vitest";
import { LessonArchive } from "@exercise";

/**
 * Runs against the SOLUTIONS ONLY - tests-fixed/ is excluded from the challenge run.
 *
 * The shared suite in tests/ cannot contain this one. Against the challenge, LessonArchive
 * still inherits `replaceAt` from LessonRoster. The two throwing overrides in src/ only
 * cover `insertAt` and `removeAt` - whoever wrote the archive never got around to blocking
 * the third, so `archive.replaceAt(0, someOtherLesson)` silently succeeds there and
 * quietly swaps out an entry that was supposed to be permanent.
 *
 * That is not an edge case someone forgot to test. It is the actual failure mode of
 * Refused Bequest: a class that inherits an interface it mostly does not want has to
 * remember to block every single method that does not belong, and it only takes one
 * missed method for the "record that cannot be edited" to become editable after all.
 *
 * Once LessonArchive stops extending LessonRoster and holds one privately instead, there
 * is nothing left to forget: `replaceAt` was never inherited, so it was never something an
 * archive could expose by omission.
 *
 * Do not read this file before you have finished. It tells you exactly what is wrong.
 */
describe("an archived entry cannot be swapped out from under it", () => {
  it("has no replaceAt to forget to block, because it never inherited one", () => {
    const archive = new LessonArchive();
    archive.add({ id: "L-1", student: "Priya Shah", completedOn: "2026-03-02" });

    // Against the challenge this is a callable function, inherited from LessonRoster,
    // that mutates the entry in place with no error and no trace. A delegate that was
    // never asked to expose it cannot have this problem.
    const asRoster = archive as unknown as {
      replaceAt?: (index: number, lesson: unknown) => void;
    };

    expect(asRoster.replaceAt).toBeUndefined();
  });
});
