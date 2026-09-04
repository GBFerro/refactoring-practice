import { describe, expect, it } from "vitest";
import { Fare, adjustTripFare, bookRoundTrip, bookTrip } from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of making Fare a value instead of a shared reference. Do
 * not edit this file: if a refactoring seems to require changing a test, either the
 * refactoring changed behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible refactoring of this file could silently
 * change - not one per function. Each test names the move it is guarding against.
 *
 * Note what is deliberately absent: no test books a round trip and then adjusts one leg's
 * fare before reading the other leg's. That exact combination is where the challenge's one
 * shared Fare instance and the solution's independently-corrected legs disagree - see
 * WALKTHROUGH.md. A test that asserted a value there could only pass against one of src/
 * or the solution, never both, so it cannot live in a suite that has to grade both. The
 * proof that the solution gets it right lives in `tests-fixed/`, which runs against
 * solutions only.
 */

describe("bookTrip", () => {
  it("charges the fare it was booked at", () => {
    const trip = bookTrip("TRIP-1", {
      fromStationId: "STATION-ELM",
      toStationId: "STATION-PINE",
      cents: 250,
    });

    expect(trip.fare.cents).toBe(250);
  });
});

describe("bookRoundTrip", () => {
  // Guards against the two legs drifting to different starting amounts - a round trip is
  // quoted at one flat fare.
  it("starts both legs at the same fare amount", () => {
    const { outbound, inbound } = bookRoundTrip("TRIP-OUT", "TRIP-IN", {
      outboundStationId: "STATION-ELM",
      returnStationId: "STATION-PINE",
      cents: 300,
    });

    expect(outbound.fare.cents).toBe(300);
    expect(inbound.fare.cents).toBe(300);
  });

  // Guards against the two legs sharing one route instead of running opposite ways.
  it("swaps the stations between the outbound and inbound leg", () => {
    const { outbound, inbound } = bookRoundTrip("TRIP-OUT", "TRIP-IN", {
      outboundStationId: "STATION-ELM",
      returnStationId: "STATION-PINE",
      cents: 300,
    });

    expect(outbound.fromStationId).toBe("STATION-ELM");
    expect(outbound.toStationId).toBe("STATION-PINE");
    expect(inbound.fromStationId).toBe("STATION-PINE");
    expect(inbound.toStationId).toBe("STATION-ELM");
  });
});

describe("adjustTripFare", () => {
  it("raises the fare by the given number of cents", () => {
    const trip = bookTrip("TRIP-1", {
      fromStationId: "STATION-ELM",
      toStationId: "STATION-PINE",
      cents: 250,
    });

    adjustTripFare(trip, 75);

    expect(trip.fare.cents).toBe(325);
  });

  // Boundary: a negative delta is a credit, and the fare must actually drop.
  it("accepts a negative delta as a credit that lowers the fare", () => {
    const trip = bookTrip("TRIP-1", {
      fromStationId: "STATION-ELM",
      toStationId: "STATION-PINE",
      cents: 250,
    });

    adjustTripFare(trip, -50);

    expect(trip.fare.cents).toBe(200);
  });

  // Guards against a Fare being shared by reference between unrelated trips - the exact
  // "spooky action at a distance" bug this drill's refactoring fixes. Two trips booked
  // separately, at the same fare, must stay independent once one of them is corrected.
  it("never changes a separately booked trip's fare, even one quoted at the same amount", () => {
    const first = bookTrip("TRIP-1", {
      fromStationId: "STATION-ELM",
      toStationId: "STATION-PINE",
      cents: 250,
    });
    const second = bookTrip("TRIP-2", {
      fromStationId: "STATION-OAK",
      toStationId: "STATION-BIRCH",
      cents: 250,
    });

    adjustTripFare(first, 100);

    expect(first.fare.cents).toBe(350);
    expect(second.fare.cents).toBe(250);
  });
});

describe("Fare.equals", () => {
  // Two fares of the same amount are interchangeable, even though they are two different
  // objects - that is what makes Fare a value rather than an identity.
  it("treats two fares of the same amount as equal", () => {
    const a = new Fare(250);
    const b = new Fare(250);

    expect(a.equals(b)).toBe(true);
    expect(a).not.toBe(b);
  });

  it("treats two fares of different amounts as unequal", () => {
    const a = new Fare(250);
    const b = new Fare(300);

    expect(a.equals(b)).toBe(false);
  });
});
