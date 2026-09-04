export type TicketType = "standard" | "premium" | "comp";

const PREMIUM_PERKS: readonly string[] = ["Lounge access", "Priority entry"];
const COMP_PERKS: readonly string[] = ["Will call pickup"];

interface TicketFields {
  readonly type: TicketType;
  readonly faceValueCents: number;
  readonly priceCents: number;
  readonly perks: readonly string[];
  readonly authorizedBy: string | null;
}

/**
 * A single admission, priced and perked according to its kind. Built only through
 * `Ticket.standard`, `Ticket.premium`, or `Ticket.comp` - never through `new Ticket(...)`,
 * which this class does not let outside code call at all.
 */
export class Ticket {
  readonly type: TicketType;
  readonly faceValueCents: number;
  readonly priceCents: number;
  readonly perks: readonly string[];
  readonly authorizedBy: string | null;

  private constructor(fields: TicketFields) {
    this.type = fields.type;
    this.faceValueCents = fields.faceValueCents;
    this.priceCents = fields.priceCents;
    this.perks = fields.perks;
    this.authorizedBy = fields.authorizedBy;
  }

  /** Sold at face value, no perks. */
  static standard(faceValueCents: number): Ticket {
    return new Ticket({
      type: "standard",
      faceValueCents,
      priceCents: faceValueCents,
      perks: [],
      authorizedBy: null,
    });
  }

  /** Sold at a 50% markup over face value, with lounge access. */
  static premium(faceValueCents: number): Ticket {
    return new Ticket({
      type: "premium",
      faceValueCents,
      priceCents: Math.round(faceValueCents * 1.5),
      perks: PREMIUM_PERKS,
      authorizedBy: null,
    });
  }

  /** Free, and only if a staff member is on record as authorizing it. */
  static comp(faceValueCents: number, authorizedBy: string | null): Ticket | null {
    if (authorizedBy === null || authorizedBy === "") {
      return null;
    }
    return new Ticket({
      type: "comp",
      faceValueCents,
      priceCents: 0,
      perks: COMP_PERKS,
      authorizedBy,
    });
  }
}
