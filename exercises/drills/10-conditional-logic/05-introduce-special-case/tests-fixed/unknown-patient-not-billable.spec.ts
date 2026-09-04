/**
 * Runs against the SOLUTIONS ONLY - `tests-fixed/` is excluded from the challenge run.
 *
 * The shared suite in `tests/` cannot assert on isBillable(unknownPatient()). Against the
 * challenge, isBillable checks `patient.id === "Unknown"` - capital U, a typo that never
 * matches the sentinel id "unknown" every other check in the file uses - so the check
 * silently fails to fire and the function falls through to `return true`. An unidentified
 * patient, with no name and no address on file, comes back billable.
 *
 * Introducing the special case does not patch that one comparison. It removes the
 * comparison: isBillable just reads patient.isBillable, set once, in exactly one place,
 * for exactly one reason. There is nowhere left for a ninth typo to hide.
 *
 * Do not read this file before you have finished. It tells you exactly what is wrong.
 */
import { describe, expect, it } from "vitest";
import { isBillable, unknownPatient } from "@exercise";

describe("billing an unidentified patient", () => {
  it("is never billable, no matter how the sentinel used to be spelled", () => {
    expect(isBillable(unknownPatient())).toBe(false);
  });
});
