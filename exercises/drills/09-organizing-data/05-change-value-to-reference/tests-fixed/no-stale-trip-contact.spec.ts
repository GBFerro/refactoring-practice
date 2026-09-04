import { describe, expect, it } from "vitest";
import { bookTrip, correctRiderPhone, openDirectory, registerRider } from "@exercise";

/**
 * Runs against the SOLUTIONS ONLY - `tests-fixed/` is excluded from the challenge run.
 *
 * The shared suite in `tests/` cannot contain this test. It has to stay green against the
 * challenge as well, and against the challenge this behaviour is broken: that is the whole
 * point of the exercise. So the proof that the refactoring closed the hole lives here.
 *
 * Do not read this file before you have finished. It tells you exactly what is wrong.
 */
describe("correcting a rider's phone after a trip is already booked", () => {
  it("is visible on the already-booked trip, not just on future ones", () => {
    const directory = openDirectory();
    registerRider(directory, {
      id: "RIDER-1",
      name: "Priya Shah",
      phone: "555-0100",
      email: "priya@example.com",
    });
    const trip = bookTrip(directory, "TRIP-1", {
      riderId: "RIDER-1",
      fromStationId: "STATION-ELM",
      toStationId: "STATION-PINE",
    });

    correctRiderPhone(directory, "RIDER-1", "555-0199");

    // Against the challenge this is "555-0100": bookTrip snapshotted the rider's fields
    // onto the trip at booking time, and correctRiderPhone only ever reaches the
    // directory's own record, never any trip that already copied it. A reference cannot
    // go stale the way a copy can.
    expect(trip.rider.phone).toBe("555-0199");
  });

  it("is visible on every trip that rider has already booked, not just the most recent", () => {
    const directory = openDirectory();
    registerRider(directory, {
      id: "RIDER-1",
      name: "Priya Shah",
      phone: "555-0100",
      email: "priya@example.com",
    });
    const first = bookTrip(directory, "TRIP-1", {
      riderId: "RIDER-1",
      fromStationId: "STATION-ELM",
      toStationId: "STATION-PINE",
    });
    const second = bookTrip(directory, "TRIP-2", {
      riderId: "RIDER-1",
      fromStationId: "STATION-PINE",
      toStationId: "STATION-OAK",
    });

    correctRiderPhone(directory, "RIDER-1", "555-0199");

    expect(first.rider.phone).toBe("555-0199");
    expect(second.rider.phone).toBe("555-0199");
  });
});
