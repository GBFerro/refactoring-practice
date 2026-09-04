import { describe, expect, it } from "vitest";
import { holdNextAvailableSeat, nextSeatQuote, sectionHasAvailability } from "@exercise";
import type { Seat, SeatStatus, Show } from "@exercise";

/**
 * Runs against the SOLUTIONS ONLY - `tests-fixed/` is excluded from the challenge run.
 *
 * Against the challenge, `nextSeatQuote` and `sectionHasAvailability` are both built on
 * `findSeatAndReserve`, which holds whatever seat it finds - so asking "what would I get?"
 * or "is anything left?" quietly takes a seat off the market. The shared suite in
 * `tests/` cannot pin the fix: it has to stay green against the challenge too, and against
 * the challenge these three tests fail. This file is the proof the solution closed the
 * hole, and reading it before you finish tells you exactly what is wrong.
 */

function seat(
  section: string,
  row: number,
  number: number,
  priceCents: number,
  status: SeatStatus = "open",
): Seat {
  return { section, row, number, priceCents, status, heldBy: null };
}

function oneSeatShow(): Show {
  return { title: "Sold Out Except One", seats: [seat("Stalls", 1, 1, 6000)] };
}

describe("a query never holds a seat", () => {
  it("still gets quoted the seat that a quote just described", () => {
    const show = oneSeatShow();

    const quoted = nextSeatQuote(show, "Stalls");
    const held = holdNextAvailableSeat(show, "Stalls", "C-1");

    // Against the challenge, `held` is null here: the quote already held the only seat,
    // for a customer id nobody chose, and there is nothing left to book.
    expect(held).toMatchObject({ row: quoted?.row, number: quoted?.number });
  });

  it("still finds a seat to hold after confirming the section has one", () => {
    const show = oneSeatShow();

    expect(sectionHasAvailability(show, "Stalls")).toBe(true);
    const held = holdNextAvailableSeat(show, "Stalls", "C-1");

    // Against the challenge, checking availability already consumed the one seat, so this
    // is null even though the check just reported `true`.
    expect(held).not.toBeNull();
  });

  it("quotes the same seat twice in a row when nothing was booked in between", () => {
    const show = oneSeatShow();

    const firstQuote = nextSeatQuote(show, "Stalls");
    const secondQuote = nextSeatQuote(show, "Stalls");

    // Against the challenge, the first quote already held the seat, so the second quote
    // has nothing left to describe and comes back null.
    expect(secondQuote).toEqual(firstQuote);
  });
});
