import { describe, expect, it } from "vitest";
import { Enrolment, GroupLessonEnrolment, PrivateLessonEnrolment } from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of pulling the shared prologue up into Enrolment. Do not
 * edit this file: if a refactoring seems to require changing a test, either the
 * refactoring changed behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible Pull Up Constructor Body could silently
 * change - a value computed at the wrong point in construction, a check that only
 * survives in one subclass, a subclass-only field swept up by mistake. Each test names
 * the move it is guarding against.
 */

describe("PrivateLessonEnrolment", () => {
  // Guards the shared id scheme surviving the move into Enrolment's own constructor.
  it("derives its id from the student's name", () => {
    const enrolment = new PrivateLessonEnrolment(
      "Priya Shah",
      "2026-09-07",
      "Marcus Webb",
    );
    expect(enrolment.id).toBe("ENR-PRIYA-SHAH");
  });

  // Guards the hard move: tuitionCents must still equal sessions times rate once that
  // multiplication happens before super() runs instead of after it.
  it("prices ten sessions at the private rate", () => {
    const enrolment = new PrivateLessonEnrolment(
      "Priya Shah",
      "2026-09-07",
      "Marcus Webb",
    );
    expect(enrolment.tuitionCents).toBe(45_000);
  });

  // Guards the subclass-only field staying untouched - it is never part of the shared
  // prologue and must not get swept up into Enrolment by mistake.
  it("keeps its own tutor, separate from the shared prologue", () => {
    const enrolment = new PrivateLessonEnrolment(
      "Priya Shah",
      "2026-09-07",
      "Marcus Webb",
    );
    expect(enrolment.describe()).toBe("Priya Shah — private lessons with Marcus Webb");
  });

  // Guards the name-required check staying reachable from every subclass, not just
  // whichever one it happened to be written into first.
  it("rejects a blank student name", () => {
    expect(() => new PrivateLessonEnrolment("   ", "2026-09-07", "Marcus Webb")).toThrow(
      "Student name is required.",
    );
  });
});

describe("GroupLessonEnrolment", () => {
  // Same id scheme, the other subclass - guards it living in one place, not two.
  it("derives its id from the student's name", () => {
    const enrolment = new GroupLessonEnrolment("Zoe Ferreira", "2026-09-07", 6);
    expect(enrolment.id).toBe("ENR-ZOE-FERREIRA");
  });

  // Guards the group rate staying distinct from the private rate after the multiplication
  // moves to before super() in this subclass too.
  it("prices eight sessions at the group rate", () => {
    const enrolment = new GroupLessonEnrolment("Zoe Ferreira", "2026-09-07", 6);
    expect(enrolment.tuitionCents).toBe(14_400);
  });

  // Guards the validation surviving in this subclass as well, not just the first one
  // it was copied out of.
  it("rejects a blank student name here too", () => {
    expect(() => new GroupLessonEnrolment("", "2026-09-07", 6)).toThrow(
      "Student name is required.",
    );
  });
});

describe("across enrolment kinds", () => {
  // Guards enrolledOn passing straight through, not reformatted or defaulted, once it is
  // Enrolment's own constructor parameter instead of each subclass's.
  it("keeps the exact enrolledOn date each subclass was given", () => {
    const priv = new PrivateLessonEnrolment("Priya Shah", "2026-01-15", "Marcus Webb");
    const group = new GroupLessonEnrolment("Zoe Ferreira", "2026-02-20", 6);
    expect(priv.enrolledOn).toBe("2026-01-15");
    expect(group.enrolledOn).toBe("2026-02-20");
  });

  // Guards the inheritance relationship itself surviving the refactor - both remain
  // genuine Enrolments, not just objects shaped like one.
  it("keeps both kinds as instances of Enrolment", () => {
    const priv = new PrivateLessonEnrolment("Priya Shah", "2026-09-07", "Marcus Webb");
    const group = new GroupLessonEnrolment("Zoe Ferreira", "2026-09-07", 6);
    expect(priv).toBeInstanceOf(Enrolment);
    expect(group).toBeInstanceOf(Enrolment);
  });

  // Boundary: collapses internal whitespace in the name the same way regardless of which
  // subclass is asking - a plausible per-subclass duplication drifting apart otherwise.
  it("collapses internal whitespace in the name when building the id", () => {
    const enrolment = new GroupLessonEnrolment("Ana   Cruz", "2026-09-07", 4);
    expect(enrolment.id).toBe("ENR-ANA-CRUZ");
  });
});
