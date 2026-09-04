import { describe, expect, it } from "vitest";
import {
  appointmentDurationMinutes,
  appointmentFeeCents,
  appointmentPrepInstructions,
} from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of moving each switch onto the appointment classes. Do not
 * edit this file: if a refactoring seems to require changing a test, either the
 * refactoring changed behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible Replace Conditional with Polymorphism could
 * silently change - values getting swapped between types as they move from a switch case
 * to a class, or a branch dropped in transit. Each test names the move it is guarding
 * against.
 */

describe("checkup appointments", () => {
  // Guards a 20-minute slot and the "no prep" line surviving the move onto their own class.
  it("books a checkup for 20 minutes with no preparation required", () => {
    expect(appointmentDurationMinutes("checkup")).toBe(20);
    expect(appointmentPrepInstructions("checkup")).toBe("No preparation needed.");
  });

  // Guards both fee branches on CheckupAppointment - a copay for the insured, the full
  // rate otherwise - staying distinct from each other and from the other two types.
  it("charges a checkup copay when insured and the full rate otherwise", () => {
    expect(appointmentFeeCents("checkup", true)).toBe(2000);
    expect(appointmentFeeCents("checkup", false)).toBe(12000);
  });
});

describe("vaccination appointments", () => {
  // Guards the shortest slot and the vaccination-card prep line, both specific to this type.
  it("books a vaccination for 10 minutes and asks for the vaccination card", () => {
    expect(appointmentDurationMinutes("vaccination")).toBe(10);
    expect(appointmentPrepInstructions("vaccination")).toBe(
      "Bring your vaccination card.",
    );
  });

  // The one type whose insured fee is fully waived, not just discounted - the easiest
  // branch to lose if the fee switch gets collapsed into "insured ? cheap : full" by hand.
  it("waives the vaccination fee entirely when insured, but not otherwise", () => {
    expect(appointmentFeeCents("vaccination", true)).toBe(0);
    expect(appointmentFeeCents("vaccination", false)).toBe(4500);
  });
});

describe("blood draw appointments", () => {
  // Guards the fasting instruction staying unique to this type - a copy-paste from
  // checkup or vaccination's prep text would slip past a reader who isn't checking closely.
  it("books a blood draw for 15 minutes and requires an 8-hour fast", () => {
    expect(appointmentDurationMinutes("bloodDraw")).toBe(15);
    expect(appointmentPrepInstructions("bloodDraw")).toBe(
      "Fast for 8 hours before your appointment.",
    );
  });

  // Guards this type's own copay and full-rate figures against being copied from either
  // of the other two classes.
  it("charges a blood draw copay when insured and the full rate otherwise", () => {
    expect(appointmentFeeCents("bloodDraw", true)).toBe(1500);
    expect(appointmentFeeCents("bloodDraw", false)).toBe(6000);
  });
});

describe("across appointment types", () => {
  // Guards against duration constants drifting between classes during the move - each
  // type's slot length has to stay distinct from the other two, not just "some number".
  it("keeps every appointment type's duration distinct from the other two", () => {
    const durations = [
      appointmentDurationMinutes("checkup"),
      appointmentDurationMinutes("vaccination"),
      appointmentDurationMinutes("bloodDraw"),
    ];
    expect(new Set(durations).size).toBe(3);
  });
});
