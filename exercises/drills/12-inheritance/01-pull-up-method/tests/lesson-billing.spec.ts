import { describe, expect, it } from "vitest";
import {
  GroupLesson,
  invoiceLine,
  PrivateLesson,
  totalBillingCents,
  type Student,
  type Tutor,
} from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of unifying and pulling up billingAmountCents(). Do not edit
 * this file: if a refactoring seems to require changing a test, either the refactoring
 * changed behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible Pull Up Method could silently change - not
 * one per method. Each test names the move it is guarding against.
 */

const nadia: Tutor = { name: "Nadia Osei", hourlyRateCents: 6000 };
const priya: Student = { name: "Priya" };
const owen: Student = { name: "Owen" };
const mabel: Student = { name: "Mabel" };

describe("lesson billing", () => {
  // Guards the private-lesson formula: tuition for the minutes booked, plus the flat fee.
  it("bills a private lesson as tuition for the minutes booked plus the materials fee", () => {
    const lesson = new PrivateLesson({
      tutor: nadia,
      durationMinutes: 45,
      materialsFeeCents: 500,
      student: priya,
    });
    expect(lesson.billingAmountCents()).toBe(5000);
  });

  // Guards the group-lesson formula sharing the exact same shape once unified - tuition
  // plus a flat fee, not tuition split or multiplied across the students in the room.
  it("bills a group lesson as tuition for the minutes booked plus the flat supplies fee", () => {
    const lesson = new GroupLesson({
      tutor: nadia,
      durationMinutes: 60,
      materialsFeeCents: 300,
      students: [priya, owen, mabel],
    });
    expect(lesson.billingAmountCents()).toBe(6300);
  });

  // A merge that quietly starts charging per head would still pass the test above by
  // coincidence if it happened to use a single-student group. This is the one that catches it.
  it("charges the same group-lesson amount regardless of how many students are enrolled", () => {
    const solo = new GroupLesson({
      tutor: nadia,
      durationMinutes: 60,
      materialsFeeCents: 300,
      students: [priya],
    });
    const full = new GroupLesson({
      tutor: nadia,
      durationMinutes: 60,
      materialsFeeCents: 300,
      students: [priya, owen, mabel],
    });
    expect(solo.billingAmountCents()).toBe(full.billingAmountCents());
  });

  // Once billingAmountCents lives in one place, both lesson types must round the same way -
  // a private lesson's fractional tuition rounded to the nearest cent.
  it("rounds a private lesson's fractional tuition to the nearest cent", () => {
    const lesson = new PrivateLesson({
      tutor: { name: "Nadia Osei", hourlyRateCents: 6500 },
      durationMinutes: 50,
      materialsFeeCents: 200,
      student: priya,
    });
    expect(lesson.billingAmountCents()).toBe(5617);
  });

  // The same rounding rule, exercised through the other subclass - this is the test that
  // would fail first if the merge had kept the wrong one of the two rounding approaches.
  it("rounds a group lesson's fractional tuition to the nearest cent", () => {
    const lesson = new GroupLesson({
      tutor: { name: "Nadia Osei", hourlyRateCents: 6500 },
      durationMinutes: 50,
      materialsFeeCents: 200,
      students: [priya, owen],
    });
    expect(lesson.billingAmountCents()).toBe(5617);
  });

  // Guards the private-lesson description naming the student, not just the tutor.
  it("describes a private lesson by student and tutor", () => {
    const lesson = new PrivateLesson({
      tutor: nadia,
      durationMinutes: 45,
      materialsFeeCents: 500,
      student: priya,
    });
    expect(lesson.invoiceDescription()).toBe("Private lesson for Priya with Nadia Osei");
  });

  // Boundary: singular vs plural in the group lesson's headcount, on either side of one -
  // invoiceDescription is not part of the pull-up, but it shares the constructor shape and
  // an over-eager merge could drag it along by mistake.
  it("pluralizes the group lesson's headcount only when there is more than one student", () => {
    const solo = new GroupLesson({
      tutor: nadia,
      durationMinutes: 60,
      materialsFeeCents: 300,
      students: [priya],
    });
    const trio = new GroupLesson({
      tutor: nadia,
      durationMinutes: 60,
      materialsFeeCents: 300,
      students: [priya, owen, mabel],
    });
    expect(solo.invoiceDescription()).toBe("Group lesson (1 student) with Nadia Osei");
    expect(trio.invoiceDescription()).toBe("Group lesson (3 students) with Nadia Osei");
  });

  // Guards invoiceLine composing the description and the formatted dollar amount together,
  // through the one shared method call, for either lesson type.
  it("renders an invoice line as the description, then the formatted dollar amount", () => {
    const lesson = new PrivateLesson({
      tutor: nadia,
      durationMinutes: 45,
      materialsFeeCents: 500,
      student: priya,
    });
    expect(invoiceLine(lesson)).toBe("Private lesson for Priya with Nadia Osei: $50.00");
  });

  // Guards totalBillingCents summing mixed lesson types through one shared method call -
  // the whole point of pulling billingAmountCents up onto Lesson.
  it("sums billing across a mix of private and group lessons", () => {
    const solo = new PrivateLesson({
      tutor: nadia,
      durationMinutes: 45,
      materialsFeeCents: 500,
      student: priya,
    });
    const group = new GroupLesson({
      tutor: nadia,
      durationMinutes: 60,
      materialsFeeCents: 300,
      students: [owen, mabel],
    });
    expect(totalBillingCents([solo, group])).toBe(5000 + 6300);
  });

  // Boundary: an empty lesson list bills nothing, not NaN from an empty reduce.
  it("bills nothing for an empty list of lessons", () => {
    expect(totalBillingCents([])).toBe(0);
  });
});
