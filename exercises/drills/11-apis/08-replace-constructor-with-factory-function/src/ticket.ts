export type TicketType = "standard" | "premium" | "comp";

const PREMIUM_PERKS: readonly string[] = ["Lounge access", "Priority entry"];
const COMP_PERKS: readonly string[] = ["Will call pickup"];

/** A single admission, priced and perked according to its kind. */
export class Ticket {
  readonly type: TicketType;
  readonly faceValueCents: number;
  readonly priceCents: number;
  readonly perks: readonly string[];
  readonly authorizedBy: string | null;

  constructor(type: TicketType, faceValueCents: number, authorizedBy: string | null) {
    this.type = type;
    this.faceValueCents = faceValueCents;
    if (type === "comp" && (authorizedBy === null || authorizedBy === "")) {
      throw new Error("a comp ticket needs the staff member who authorized it");
    }
    this.authorizedBy = type === "comp" ? authorizedBy : null;
    if (type === "premium") {
      this.priceCents = Math.round(faceValueCents * 1.5);
      this.perks = PREMIUM_PERKS;
    } else if (type === "comp") {
      this.priceCents = 0;
      this.perks = COMP_PERKS;
    } else {
      this.priceCents = faceValueCents;
      this.perks = [];
    }
  }
}
