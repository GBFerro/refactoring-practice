import { Ticket, type TicketType } from "./ticket";

export interface TicketRow {
  readonly type: TicketType;
  readonly faceValueCents: number;
  readonly authorizedBy: string | null;
}

export interface ImportResult {
  readonly issued: readonly Ticket[];
  readonly skipped: number;
}

/** Sells one ticket at face value, no perks. */
export function sellStandardTicket(faceValueCents: number): Ticket {
  return new Ticket("standard", faceValueCents, null);
}

/** Sells one ticket at a markup, with lounge access. */
export function sellPremiumTicket(faceValueCents: number): Ticket {
  return new Ticket("premium", faceValueCents, null);
}

/** Issues a free ticket, if a staff member is on record as authorizing it. */
export function issueCompTicket(
  faceValueCents: number,
  authorizedBy: string | null,
): Ticket | null {
  try {
    return new Ticket("comp", faceValueCents, authorizedBy);
  } catch {
    return null;
  }
}

/** Builds a ticket for every row it can, and counts the ones it can't. */
export function importTickets(rows: readonly TicketRow[]): ImportResult {
  const issued: Ticket[] = [];
  let skipped = 0;
  for (const row of rows) {
    try {
      issued.push(new Ticket(row.type, row.faceValueCents, row.authorizedBy));
    } catch {
      skipped = skipped + 1;
    }
  }
  return { issued, skipped };
}
