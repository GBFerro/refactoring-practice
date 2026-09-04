import { describe, expect, it } from "vitest";
import { adjustTripFare, bookRoundTrip } from "@exercise";

/**
 * Runs against the SOLUTIONS ONLY - `tests-fixed/` is excluded from the challenge run.
 *
 * The shared suite in `tests/` cannot contain this test. It has to stay green against the
 * challenge as well, and against the challenge this behaviour is broken: that is the whole
 * point of the exercise. So the proof that the refactoring closed the hole lives here.
 *
 * Do not read this file before you have finished. It tells you exactly what is wrong.
 */
describe("adjusting one leg of a round trip", () => {
  it("leaves the other leg's fare untouched, even though both started from one Fare", () => {
    const { outbound, inbound } = bookRoundTrip("TRIP-OUT", "TRIP-IN", {
      outboundStationId: "STATION-ELM",
      returnStationId: "STATION-PINE",
      cents: 300,
    });

    adjustTripFare(outbound, 100);

    // Against the challenge this is 400: outbound.fare and inbound.fare are the same
    // object, and adjustBy mutates it in place, so correcting one leg silently corrects
    // both. A value cannot be changed out from under a name that never touched it.
    expect(outbound.fare.cents).toBe(400);
    expect(inbound.fare.cents).toBe(300);
  });

  it("works the same way in the other direction", () => {
    const { outbound, inbound } = bookRoundTrip("TRIP-OUT", "TRIP-IN", {
      outboundStationId: "STATION-ELM",
      returnStationId: "STATION-PINE",
      cents: 500,
    });

    adjustTripFare(inbound, -150);

    expect(inbound.fare.cents).toBe(350);
    expect(outbound.fare.cents).toBe(500);
  });
});
