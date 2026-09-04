import { describe, expect, it } from "vitest";
import { TicketOffice, type SerialPrinter } from "@exercise";

/**
 * Runs against the SOLUTIONS ONLY - `tests-fixed/` is excluded from the challenge run.
 *
 * Against the challenge, `issueTicket` builds a `Ticket` with a placeholder id, files it
 * into the registry under that placeholder, and only then calls `setId` to stamp on the
 * real serial - the object the caller gets back has the right id, but the registry entry
 * was already keyed by the placeholder and never moves. The shared suite in `tests/`
 * cannot pin the fix: it has to stay green against the challenge too, and against the
 * challenge these three tests fail. This file is the proof the solution closed the hole,
 * and reading it before you finish tells you exactly what is wrong.
 */

function sequentialPrinter(prefix: string): SerialPrinter {
  let count = 0;
  return {
    nextSerial(): string {
      count = count + 1;
      return `${prefix}-${count}`;
    },
  };
}

describe("a freshly issued ticket is findable by its own id", () => {
  it("can be found by findById right after issueTicket returns", () => {
    const office = new TicketOffice(sequentialPrinter("GALA"));
    const ticket = office.issueTicket({
      performanceId: "gala-2026",
      priceCents: 4500,
      holderName: "Mina Cho",
    });

    // Against the challenge, this is undefined: the registry was keyed by "" before
    // setId ran, and nothing ever re-keys it.
    expect(office.findById(ticket.id)).toBe(ticket);
  });

  it("keeps two tickets independently findable after issuing both", () => {
    const office = new TicketOffice(sequentialPrinter("GALA"));
    const details = {
      performanceId: "gala-2026",
      priceCents: 4500,
      holderName: "Mina Cho",
    };

    const first = office.issueTicket(details);
    const second = office.issueTicket(details);

    // Against the challenge, both inserts land under the same "" key in turn, so the
    // second issuance silently overwrites the first ticket's registry entry before either
    // one gets its real serial.
    expect(office.findById(first.id)).toBe(first);
    expect(office.findById(second.id)).toBe(second);
  });

  it("does not leave a stray placeholder entry behind in the registry", () => {
    const office = new TicketOffice(sequentialPrinter("GALA"));
    office.issueTicket({
      performanceId: "gala-2026",
      priceCents: 4500,
      holderName: "Mina Cho",
    });

    // Against the challenge, this finds whichever ticket was issued last - the one still
    // sitting under the placeholder key.
    expect(office.findById("")).toBeUndefined();
  });
});
