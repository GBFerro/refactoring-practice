import { describe, expect, it } from "vitest";
import { addInstrument, renderLendingBoard } from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of turning `category` into subclasses. Do not edit this
 * file: if a refactoring seems to require changing a test, either the refactoring changed
 * behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible Replace Type Code with Subclasses could
 * silently change - a number copied to the wrong class, a category that quietly loses its
 * own identity, or lending status drifting once it is no longer read from a single switch.
 * Each test names the move it is guarding against.
 */

describe("category-driven pricing and upkeep", () => {
  // Guards string's deposit, accessory, and maintenance interval landing together on the
  // same subclass, rather than one of the three being copied from a neighbouring category.
  it("prices a string instrument's deposit, accessory, and maintenance interval", () => {
    const violin = addInstrument({ name: "Practice Violin", category: "string" });
    expect(violin.rentalDepositCents()).toBe(5000);
    expect(violin.requiredAccessory()).toBe("rosin");
    expect(violin.maintenanceIntervalWeeks()).toBe(26);
  });

  // Guards the same three figures for brass - the category with the highest deposit and
  // the tightest maintenance cycle, easy to swap with percussion's if copied carelessly.
  it("prices a brass instrument's deposit, accessory, and maintenance interval", () => {
    const trumpet = addInstrument({ name: "Practice Trumpet", category: "brass" });
    expect(trumpet.rentalDepositCents()).toBe(12000);
    expect(trumpet.requiredAccessory()).toBe("valve oil");
    expect(trumpet.maintenanceIntervalWeeks()).toBe(12);
  });

  // Guards woodwind's own figures against drifting toward brass's once both are read
  // through the same abstract method names instead of a shared switch.
  it("prices a woodwind instrument's deposit, accessory, and maintenance interval", () => {
    const clarinet = addInstrument({ name: "Practice Clarinet", category: "woodwind" });
    expect(clarinet.rentalDepositCents()).toBe(9000);
    expect(clarinet.requiredAccessory()).toBe("reeds");
    expect(clarinet.maintenanceIntervalWeeks()).toBe(16);
  });

  // Guards percussion's figures - the shortest maintenance interval of the four - staying
  // distinct after the move.
  it("prices a percussion instrument's deposit, accessory, and maintenance interval", () => {
    const snare = addInstrument({ name: "Practice Snare", category: "percussion" });
    expect(snare.rentalDepositCents()).toBe(15000);
    expect(snare.requiredAccessory()).toBe("drum key");
    expect(snare.maintenanceIntervalWeeks()).toBe(8);
  });

  // Guards against two categories ending up with the same deposit by copy-paste once the
  // single switch that made the four values easy to compare side by side is gone.
  it("keeps every category's deposit distinct from the other three", () => {
    const deposits = [
      addInstrument({ name: "A", category: "string" }).rentalDepositCents(),
      addInstrument({ name: "B", category: "brass" }).rentalDepositCents(),
      addInstrument({ name: "C", category: "woodwind" }).rentalDepositCents(),
      addInstrument({ name: "D", category: "percussion" }).rentalDepositCents(),
    ];
    expect(new Set(deposits).size).toBe(4);
  });
});

describe("lending status, which stays a plain field", () => {
  // Guards a checked-out instrument reporting itself unavailable, and available again once
  // returned undamaged - status must keep working as ordinary mutable state on the base
  // class, not something a subclass swap could interfere with.
  it("takes an instrument off the board once checked out, and back on once returned", () => {
    const violin = addInstrument({ name: "Practice Violin", category: "string" });
    expect(violin.isAvailableToLend()).toBe(true);
    violin.checkOut();
    expect(violin.isAvailableToLend()).toBe(false);
    violin.returnFromLoan(false);
    expect(violin.isAvailableToLend()).toBe(true);
  });

  // Guards a damaged return routing to repair instead of back onto the shelf, and staying
  // there until explicitly cleared - the exact three-state transition a subclass cannot
  // represent, because no instrument may change which subclass it is.
  it("sends a damaged return to repair, and holds it there until cleared", () => {
    const trumpet = addInstrument({ name: "Practice Trumpet", category: "brass" });
    trumpet.checkOut();
    trumpet.returnFromLoan(true);
    expect(trumpet.isAvailableToLend()).toBe(false);
    expect(trumpet.isInRepair()).toBe(true);
    trumpet.clearFromRepair();
    expect(trumpet.isAvailableToLend()).toBe(true);
    expect(trumpet.isInRepair()).toBe(false);
  });
});

describe("renderLendingBoard", () => {
  // Guards the empty case, where there is no first instrument to reach for.
  it("says so plainly when the library has nothing in it", () => {
    expect(renderLendingBoard([])).toEqual(["No instruments in the library."]);
  });

  // Guards the board keeping instruments in the order they joined the library rather than
  // sorting or grouping by category - a plausible but wrong "tidying" once each instrument
  // is its own class instead of a row with a shared shape - and guards the summary line
  // counting only truly available instruments across a mix of all three statuses.
  it("lists instruments in join order and counts how many are free", () => {
    const violin = addInstrument({
      name: "Isabela String Quartet Violin",
      category: "string",
    });
    const trumpet = addInstrument({ name: "School Trumpet #2", category: "brass" });
    const snare = addInstrument({ name: "Practice Snare", category: "percussion" });
    trumpet.checkOut();
    snare.checkOut();
    snare.returnFromLoan(true);

    expect(renderLendingBoard([violin, trumpet, snare])).toEqual([
      "Isabela String Quartet Violin Available  $50.00 rosin",
      "School Trumpet #2        On loan    $120.00 valve oil",
      "Practice Snare           In repair  $150.00 drum key",
      "Available: 1 of 3",
    ]);
  });

  // Guards against "tidying up" the name column into a truncation while the pricing moves
  // onto separate classes. A name wider than its column pushes the row out; it is not cut.
  it("lets a name wider than its column push the row out instead of truncating", () => {
    const bass = addInstrument({
      name: "Historic Double Bass from the Attic Collection",
      category: "string",
    });
    expect(renderLendingBoard([bass])).toEqual([
      "Historic Double Bass from the Attic Collection Available  $50.00 rosin",
      "Available: 1 of 1",
    ]);
  });
});
