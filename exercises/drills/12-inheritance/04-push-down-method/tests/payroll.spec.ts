import { describe, expect, it } from "vitest";
import {
  FreelanceTutor,
  StaffTutor,
  weeklyPayrollReport,
  type LoggedLesson,
} from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of pushing weeklyPayrollHours() down onto StaffTutor. Do not
 * edit this file: if a refactoring seems to require changing a test, either the refactoring
 * changed behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible Push Down Method could silently change - not
 * one per method. Each test names the move it is guarding against.
 */

function lessonsOf(minutes: readonly number[]): LoggedLesson[] {
  return minutes.map((durationMinutes) => ({ durationMinutes }));
}

describe("weeklyPayrollHours", () => {
  // Guards the basic conversion: minutes logged this week, turned into hours.
  it("converts a staff tutor's logged minutes into hours", () => {
    const tutor = new StaffTutor("Priya Chandran", lessonsOf([60, 60]));
    expect(tutor.weeklyPayrollHours()).toBe(2);
  });

  // Boundary in the other direction: rounding to the nearest payroll quarter-hour, when the
  // exact hours are not a clean number.
  it("rounds a staff tutor's hours to the nearest payroll quarter-hour", () => {
    const tutor = new StaffTutor("Priya Chandran", lessonsOf([50]));
    expect(tutor.weeklyPayrollHours()).toBe(0.75);
  });

  // Boundary: a staff tutor who logged nothing this week has zero payroll hours, not NaN.
  it("reports zero payroll hours for a staff tutor with no lessons logged this week", () => {
    const tutor = new StaffTutor("Priya Chandran", lessonsOf([]));
    expect(tutor.weeklyPayrollHours()).toBe(0);
  });
});

describe("weeklyPayrollReport", () => {
  // The move this drill is built around: a freelance tutor never appears on the report,
  // no matter how many lessons they logged - only staff go through payroll.
  it("excludes freelance tutors from the payroll report entirely", () => {
    const staff = new StaffTutor("Priya Chandran", lessonsOf([60]));
    const freelance = new FreelanceTutor("Owen Bramwell", lessonsOf([60, 60, 60]), 4000);
    expect(weeklyPayrollReport([staff, freelance])).toEqual([
      { name: "Priya Chandran", hours: 1 },
    ]);
  });

  // Guards ordering: the report lists staff tutors in the order they were given, not
  // reshuffled by the filter-then-map pipeline.
  it("keeps staff tutors in the order they were passed in", () => {
    const ada = new StaffTutor("Ada Level", lessonsOf([30]));
    const mabel = new StaffTutor("Mabel Otieno", lessonsOf([90]));
    expect(weeklyPayrollReport([mabel, ada]).map((line) => line.name)).toEqual([
      "Mabel Otieno",
      "Ada Level",
    ]);
  });

  // Boundary: an all-freelance roster produces an empty report, not an error.
  it("returns an empty report for an all-freelance roster", () => {
    const freelance = new FreelanceTutor("Owen Bramwell", lessonsOf([60]), 4000);
    expect(weeklyPayrollReport([freelance])).toEqual([]);
  });

  // Boundary: no tutors at all is the same empty case, exercised the other way.
  it("returns an empty report for an empty tutor list", () => {
    expect(weeklyPayrollReport([])).toEqual([]);
  });
});

describe("FreelanceTutor.invoiceTotalCents", () => {
  // Guards the freelance-only computation surviving untouched - it never involved
  // weeklyPayrollHours and this move should not need to touch it.
  it("multiplies the number of lessons logged by the tutor's per-lesson rate", () => {
    const tutor = new FreelanceTutor("Owen Bramwell", lessonsOf([60, 45, 30]), 4000);
    expect(tutor.invoiceTotalCents()).toBe(12_000);
  });
});
