import { describe, expect, it } from "vitest";
import { deliveryDistanceKm, type Order, type Route } from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of moving deliveryDistanceKm out of order.ts. Do not edit
 * this file: if a refactoring seems to require changing a test, either the refactoring
 * changed behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible Move Function could silently change - not
 * one per stop. Each test names the move it is guarding against.
 */

function orderFor(customerId: string): Order {
  return {
    id: "ORD-1",
    customerId,
    customerName: "Test Customer",
    items: [{ productName: "Sourdough loaf", quantity: 12, unitWeightKg: 0.9 }],
    placedOn: "2026-08-24",
    deliveryNotes: null,
  };
}

const riversideLoop: Route = {
  id: "RT-1",
  name: "Riverside Loop",
  driverName: "Marta Sousa",
  departsAt: "06:30",
  stops: [
    { customerId: "CAFE-DELMAR", legDistanceKm: 2.25, arrivalWindow: "06:45-07:00" },
    { customerId: "GROCER-PINE", legDistanceKm: 3.5, arrivalWindow: "07:00-07:20" },
    { customerId: "CAFE-HOLLOW", legDistanceKm: 1.75, arrivalWindow: "07:20-07:35" },
  ],
  returnLegKm: 4.25,
  loopsBackToDepot: true,
};

const millRun: Route = {
  id: "RT-2",
  name: "Mill Run",
  driverName: "Dev Patel",
  departsAt: "06:15",
  stops: [
    { customerId: "BAKESHOP-ELM", legDistanceKm: 1.5, arrivalWindow: "06:25-06:40" },
    { customerId: "DINER-OAK", legDistanceKm: 2.75, arrivalWindow: "06:40-07:00" },
    { customerId: "CAFE-BIRCH", legDistanceKm: 0.75, arrivalWindow: "07:00-07:10" },
  ],
  returnLegKm: 3.25,
  loopsBackToDepot: false,
};

const cornerStop: Route = {
  id: "RT-3",
  name: "Corner Stop",
  driverName: "Marta Sousa",
  departsAt: "07:45",
  stops: [{ customerId: "CAFE-SOLO", legDistanceKm: 5.0, arrivalWindow: "08:00-08:15" }],
  returnLegKm: 1.25,
  loopsBackToDepot: true,
};

describe("deliveryDistanceKm", () => {
  // Guards against replacing the cumulative sum with the stop's own leg distance -
  // 2.75 (DINER-OAK's leg) is a plausible but wrong answer here; 4.25 is the real one.
  it("sums every leg up to and including the ordered stop, not just its own leg", () => {
    expect(deliveryDistanceKm(orderFor("DINER-OAK"), millRun)).toBe(4.25);
  });

  // Boundary: the first stop has nothing accumulated before it. An off-by-one in the
  // slice (0..index instead of 0..index+1) would return 0 here instead of the leg itself.
  it("treats the first stop as just its own leg, with nothing accumulated before it", () => {
    expect(deliveryDistanceKm(orderFor("BAKESHOP-ELM"), millRun)).toBe(1.5);
  });

  // Guards the return leg being added when it should be: last stop, and the route
  // loops back to the bakery.
  it("adds the return leg when the order's stop is the last one on a route that loops back", () => {
    expect(deliveryDistanceKm(orderFor("CAFE-HOLLOW"), riversideLoop)).toBe(7.5 + 4.25);
  });

  // Guards the return leg being left off when it should be: last stop, but the driver's
  // day ends there instead of heading back to the bakery.
  it("leaves the return leg off when the route ends at its last delivery instead of looping back", () => {
    expect(deliveryDistanceKm(orderFor("CAFE-BIRCH"), millRun)).toBe(5.0);
  });

  // Guards against a version that adds the return leg to every stop on a looping route,
  // rather than only the last one.
  it("leaves the return leg off a stop that isn't the last one, even on a route that loops back", () => {
    expect(deliveryDistanceKm(orderFor("GROCER-PINE"), riversideLoop)).toBe(5.75);
  });

  // Boundary: a single-stop route is its own first and last stop at once. Both the
  // "first stop" and "adds a return leg" branches have to agree on the same index.
  it("handles a single-stop route where the first stop is also the last", () => {
    expect(deliveryDistanceKm(orderFor("CAFE-SOLO"), cornerStop)).toBe(6.25);
  });

  // Guards the sentinel case: a customer not on this route at all. A rewrite that swaps
  // findIndex's -1 for a non-null assertion or a thrown error would break on this input.
  it("returns zero for a customer that is not on this route", () => {
    expect(deliveryDistanceKm(orderFor("CAFE-NOTHERE"), riversideLoop)).toBe(0);
  });
});
