import { describe, expect, it } from "vitest";
import {
  StringInstrument,
  totalMonthlyInsurancePremiumCents,
  WindInstrument,
  monthlyInsurancePremiumCents,
  type RentedInstrument,
} from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of pulling insuredValueCents up into Instrument. Do not
 * edit this file: if a refactoring seems to require changing a test, either the
 * refactoring changed behaviour or the exercise is wrong.
 *
 * insuredValueCents is not the only field both subclasses declare - gradeLevel does too,
 * under the same name, for two unrelated reasons. Several tests below exist to pin that
 * gradeLevel keeps meaning two different things after the refactor, not one.
 */

const clarinet = new WindInstrument({
  id: "W-1",
  name: "Buffet E11 Clarinet",
  insuredValueCents: 90_000,
  gradeLevel: 2,
});

const cello = new StringInstrument({
  id: "S-1",
  name: "Stentor Student II Cello",
  insuredValueCents: 210_000,
  gradeLevel: 2,
});

describe("monthlyInsurancePremiumCents", () => {
  // Guards the 0.4% rate surviving the move from two declarations to one.
  it("charges 0.4% of a wind instrument's insured value", () => {
    expect(monthlyInsurancePremiumCents(clarinet)).toBe(360);
  });

  it("charges 0.4% of a string instrument's insured value", () => {
    expect(monthlyInsurancePremiumCents(cello)).toBe(840);
  });

  // Boundary: 12_625 * 0.4% is 50.5 exactly - Math.round must take it up to 51 the same
  // way regardless of which subclass's insuredValueCents fed the calculation.
  it("rounds a half-cent premium up to the nearest cent", () => {
    const trumpet = new WindInstrument({
      id: "W-2",
      name: "Practice Trumpet",
      insuredValueCents: 12_625,
      gradeLevel: 1,
    });
    expect(monthlyInsurancePremiumCents(trumpet)).toBe(51);
  });
});

describe("totalMonthlyInsurancePremiumCents", () => {
  // Guards a roster mixing both subclasses - a pull-up that only fixed one class would
  // leave this summing a duplicate field on one side and a shared one on the other.
  it("sums premiums across a roster mixing wind and string instruments", () => {
    const roster: RentedInstrument[] = [clarinet, cello];
    expect(totalMonthlyInsurancePremiumCents(roster)).toBe(1200);
  });

  // Guards the empty case, where there is nothing to reduce over.
  it("returns zero for an empty roster", () => {
    expect(totalMonthlyInsurancePremiumCents([])).toBe(0);
  });
});

describe("gradeLevel keeps two different meanings", () => {
  // Guards against a refactor that, having pulled up insuredValueCents, also merges
  // gradeLevel into Instrument on the theory that "it's declared the same way too". A
  // wind instrument's gradeLevel is a student-suitability floor.
  it("uses a wind instrument's gradeLevel as the minimum student grade it suits", () => {
    const advancedClarinet = new WindInstrument({
      id: "W-3",
      name: "Advanced Clarinet",
      insuredValueCents: 150_000,
      gradeLevel: 4,
    });
    expect(advancedClarinet.isSuitableFor(3)).toBe(false);
    expect(advancedClarinet.isSuitableFor(4)).toBe(true);
    expect(advancedClarinet.isSuitableFor(5)).toBe(true);
  });

  // A string instrument's gradeLevel of the same number means a different thing - the
  // workshop's timber-quality tier - and must keep driving a different calculation even
  // when the two instruments happen to share a gradeLevel value.
  it("uses a string instrument's gradeLevel as a restoration-cost multiplier, independent of any wind instrument's gradeLevel", () => {
    expect(cello.gradeLevel).toBe(clarinet.gradeLevel);
    expect(cello.restorationCostMultiplier()).toBeCloseTo(1.2);

    const masterCello = new StringInstrument({
      id: "S-3",
      name: "Master Cello",
      insuredValueCents: 900_000,
      gradeLevel: 5,
    });
    expect(masterCello.restorationCostMultiplier()).toBeCloseTo(1.5);
  });
});

describe("shared identity", () => {
  // Guards id and name staying reachable through the base class on both subclasses.
  it("exposes id and name on both instrument kinds", () => {
    expect(clarinet.id).toBe("W-1");
    expect(clarinet.name).toBe("Buffet E11 Clarinet");
    expect(cello.id).toBe("S-1");
    expect(cello.name).toBe("Stentor Student II Cello");
  });
});
