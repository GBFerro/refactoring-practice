import { describe, expect, it } from "vitest";
import { applyLateReturnFee, openAccount, recordTrip, totalFareCents } from "@exercise";

/**
 * Runs against the SOLUTIONS ONLY - `tests-fixed/` is excluded from the challenge run.
 *
 * The shared suite in `tests/` cannot contain this test. It has to stay green against the
 * challenge as well, and against the challenge this behaviour is broken: that is the whole
 * point of the exercise. So the proof that the refactoring closed the hole lives here.
 *
 * Do not read this file before you have finished. It tells you exactly what is wrong.
 */
describe("the total after a fare changes", () => {
  it("counts a late-return fee that was applied after the trip was recorded", () => {
    const account = openAccount("R-104", "Ines Rocha");
    recordTrip(account, { id: "T-1", stationFrom: "A", stationTo: "B", fareCents: 300 });

    applyLateReturnFee(account, "T-1", 150);

    // Against the challenge this returns 300: the fee reached the trip and never reached
    // the hand-maintained cache. A query cannot disagree with its own source.
    expect(totalFareCents(account)).toBe(450);
  });

  it("counts a credit the same way", () => {
    const account = openAccount("R-105", "Paulo Serra");
    recordTrip(account, { id: "T-2", stationFrom: "C", stationTo: "D", fareCents: 500 });

    applyLateReturnFee(account, "T-2", -200);

    expect(totalFareCents(account)).toBe(300);
  });
});
