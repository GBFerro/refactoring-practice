import { describe, expect, it } from "vitest";
import {
  applyLateReturnFee,
  openAccount,
  recordTrip,
  totalFareCents,
  type Trip,
} from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of removing RiderAccount's cached fare total. Do not edit
 * this file: if a refactoring seems to require changing a test, either the refactoring
 * changed behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible refactoring of this file could silently
 * change - not one per trip. Each test names the move it is guarding against.
 *
 * Note what is deliberately absent: no test calls totalFareCents right after
 * applyLateReturnFee. That exact combination is where the challenge's cached total and
 * the trips it is supposed to summarize can disagree - see WALKTHROUGH.md. A test that
 * asserted a value there could only pass against one of src/ or the solution, never both,
 * so it cannot live in a suite that has to grade both.
 */

function trip(fields: Pick<Trip, "id" | "fareCents"> & Partial<Trip>): Trip {
  return {
    riderId: "RIDER-1",
    startStationId: "STATION-ELM",
    endStationId: "STATION-PINE",
    ...fields,
  };
}

describe("totalFareCents", () => {
  // Empty case: an account with no trips has nothing to sum.
  it("is zero for a newly opened account with no trips", () => {
    const account = openAccount("RIDER-1", "Priya Shah");
    expect(totalFareCents(account)).toBe(0);
  });

  // Single-element boundary: nothing to accumulate against, just the one fare.
  it("equals the fare of the only trip when there is just one", () => {
    const account = openAccount("RIDER-1", "Priya Shah");
    recordTrip(account, trip({ id: "TRIP-1", fareCents: 275 }));
    expect(totalFareCents(account)).toBe(275);
  });

  // Guards against a rewrite that reads the last trip's fare instead of summing all of
  // them - a plausible mistake once the total stops being maintained incrementally.
  it("sums every recorded trip's fare, not just the most recent one", () => {
    const account = openAccount("RIDER-1", "Priya Shah");
    recordTrip(account, trip({ id: "TRIP-1", fareCents: 275 }));
    recordTrip(account, trip({ id: "TRIP-2", fareCents: 310 }));
    recordTrip(account, trip({ id: "TRIP-3", fareCents: 190 }));
    expect(totalFareCents(account)).toBe(775);
  });

  // Ties: two trips with the same fare must both count, not collapse into one.
  it("counts two trips with identical fares separately", () => {
    const account = openAccount("RIDER-1", "Priya Shah");
    recordTrip(account, trip({ id: "TRIP-1", fareCents: 300 }));
    recordTrip(account, trip({ id: "TRIP-2", fareCents: 300 }));
    expect(totalFareCents(account)).toBe(600);
  });

  // Ordering: summing does not care what order the trips were recorded in.
  it("does not depend on the order trips were recorded in", () => {
    const forward = openAccount("RIDER-1", "Priya Shah");
    recordTrip(forward, trip({ id: "TRIP-1", fareCents: 150 }));
    recordTrip(forward, trip({ id: "TRIP-2", fareCents: 425 }));

    const backward = openAccount("RIDER-1", "Priya Shah");
    recordTrip(backward, trip({ id: "TRIP-2", fareCents: 425 }));
    recordTrip(backward, trip({ id: "TRIP-1", fareCents: 150 }));

    expect(totalFareCents(backward)).toBe(totalFareCents(forward));
  });
});

describe("applyLateReturnFee", () => {
  // Guards against the fee landing on the wrong trip, or on every trip.
  it("adds the fee to only the named trip's fare", () => {
    const account = openAccount("RIDER-1", "Priya Shah");
    recordTrip(account, trip({ id: "TRIP-1", fareCents: 300 }));
    recordTrip(account, trip({ id: "TRIP-2", fareCents: 500 }));
    applyLateReturnFee(account, "TRIP-1", 150);
    expect(account.trips.find((candidate) => candidate.id === "TRIP-1")?.fareCents).toBe(
      450,
    );
    expect(account.trips.find((candidate) => candidate.id === "TRIP-2")?.fareCents).toBe(
      500,
    );
  });

  // Boundary: a negative fee is a credit, and the fare must actually drop.
  it("accepts a negative fee as a credit that lowers the trip's fare", () => {
    const account = openAccount("RIDER-1", "Priya Shah");
    recordTrip(account, trip({ id: "TRIP-1", fareCents: 300 }));
    applyLateReturnFee(account, "TRIP-1", -50);
    expect(account.trips.find((candidate) => candidate.id === "TRIP-1")?.fareCents).toBe(
      250,
    );
  });

  // Sentinel: an unknown trip id must be a no-op, not a thrown error or a silent create.
  it("does nothing when the trip id is not on the account", () => {
    const account = openAccount("RIDER-1", "Priya Shah");
    recordTrip(account, trip({ id: "TRIP-1", fareCents: 300 }));
    applyLateReturnFee(account, "TRIP-NOPE", 150);
    expect(account.trips).toHaveLength(1);
    expect(account.trips[0]?.fareCents).toBe(300);
  });
});
