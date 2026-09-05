import { describe, expect, it } from "vitest";
import { enrolStudent, renderTermRoster } from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of folding TrialStudent back into Student. Do not edit
 * this file: if a refactoring seems to require changing a test, either the refactoring
 * changed behaviour or the exercise is wrong.
 *
 * Remove Subclass should be invisible from out here - every test below passes unchanged
 * whether "trial" lives as a second class or as a field on Student. That invisibility is
 * the whole point: it is what makes it safe to delete the subclass.
 */

describe("enrolStudent / renderTermRoster", () => {
  // Guards a regular student's fee staying the untouched base fee - no discount leaking
  // across from the trial path once both are handled by one class.
  it("charges a regular student the full base fee", () => {
    const priya = enrolStudent({
      name: "Priya Shah",
      instrument: "Piano",
      baseFeeCents: 12000,
      trial: false,
    });
    expect(priya.termFeeCents()).toBe(12000);
    expect(priya.kindLabel()).toBe("Regular");
  });

  // Guards the trial discount itself - the one behaviour the whole hierarchy existed for.
  it("halves the term fee for a trial student", () => {
    const tomas = enrolStudent({
      name: "Tomas Alves",
      instrument: "Violin",
      baseFeeCents: 12000,
      trial: true,
    });
    expect(tomas.termFeeCents()).toBe(6000);
    expect(tomas.kindLabel()).toBe("Trial");
  });

  // Guards the rounding rule surviving the move from an overridden method to a branch in
  // one method - half-away-from-zero on a base fee that does not split evenly.
  it("rounds an odd trial fee to the nearest cent, half away from zero", () => {
    const mei = enrolStudent({
      name: "Mei Lin",
      instrument: "Cello",
      baseFeeCents: 12001,
      trial: true,
    });
    expect(mei.termFeeCents()).toBe(6001);
  });

  // Guards the empty case, where there is no first line to reach for.
  it("says so plainly when nobody is enrolled", () => {
    expect(renderTermRoster([])).toEqual(["No students enrolled this term."]);
  });

  // Guards the roster keeping students in enrolment order rather than sorting them - a
  // plausible but wrong "tidying" once the two classes stop giving each kind its own list.
  it("lists students in the order they were enrolled, not sorted", () => {
    const zoe = enrolStudent({
      name: "Zoe Ferreira",
      instrument: "Flute",
      baseFeeCents: 10000,
      trial: false,
    });
    const anna = enrolStudent({
      name: "Anna Costa",
      instrument: "Oboe",
      baseFeeCents: 10000,
      trial: false,
    });
    const lines = renderTermRoster([zoe, anna]);
    expect(lines[0]).toContain("Zoe Ferreira");
    expect(lines[1]).toContain("Anna Costa");
  });

  // Guards the total and the trial-count summary lines against a mixed roster - the sum
  // must use each student's own fee, and the count must still tell trial from regular
  // once that distinction is a label read off a field instead of a class name.
  it("totals fees and counts trial students across a mixed roster", () => {
    const regular = enrolStudent({
      name: "Bruno Costa",
      instrument: "Guitar",
      baseFeeCents: 12000,
      trial: false,
    });
    const trial = enrolStudent({
      name: "Celia Nunes",
      instrument: "Drums",
      baseFeeCents: 12000,
      trial: true,
    });
    const lines = renderTermRoster([regular, trial]);
    expect(lines).toContain("Total: $180.00");
    expect(lines).toContain("Trial: 1 of 2");
  });

  // Guards a single-student roster's total and count arithmetic at n=1, the boundary a
  // reduce or a filter can get wrong first.
  it("totals and counts correctly for a single trial student", () => {
    const solo = enrolStudent({
      name: "Ines Rocha",
      instrument: "Harp",
      baseFeeCents: 8000,
      trial: true,
    });
    const lines = renderTermRoster([solo]);
    expect(lines).toContain("Total: $40.00");
    expect(lines).toContain("Trial: 1 of 1");
  });

  // Guards against "tidying up" the columns into a truncation while the two classes
  // collapse into one. A long name or instrument pushes the row out; it is not cut.
  it("lets a name wider than its column push the row out instead of truncating", () => {
    const lines = renderTermRoster([
      enrolStudent({
        name: "Maria Fernanda Albuquerque Santos",
        instrument: "Classical Guitar",
        baseFeeCents: 12000,
        trial: false,
      }),
    ]);
    expect(lines[0]).toBe(
      "Maria Fernanda Albuquerque Santos Classical Guitar Regular $120.00",
    );
  });
});
