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
  return Ticket.standard(faceValueCents);
}

/** Sells one ticket at a markup, with lounge access. */
export function sellPremiumTicket(faceValueCents: number): Ticket {
  return Ticket.premium(faceValueCents);
}

/** Issues a free ticket, if a staff member is on record as authorizing it. */
export function issueCompTicket(
  faceValueCents: number,
  authorizedBy: string | null,
): Ticket | null {
  return Ticket.comp(faceValueCents, authorizedBy);
}

/** Builds a ticket for every row it can, and counts the ones it can't. */
export function importTickets(rows: readonly TicketRow[]): ImportResult {
  const issued: Ticket[] = [];
  let skipped = 0;
  for (const row of rows) {
    const ticket = createTicket(row.type, row.faceValueCents, row.authorizedBy);
    if (ticket === null) skipped = skipped + 1;
    else issued.push(ticket);
  }
  return { issued, skipped };
}

type Factory = (faceValueCents: number, authorizedBy: string | null) => Ticket | null;

/** The one place left in this module where a runtime type code decides what gets built. */
const FACTORY_BY_TYPE: Record<TicketType, Factory> = {
  standard: (faceValueCents) => Ticket.standard(faceValueCents),
  premium: (faceValueCents) => Ticket.premium(faceValueCents),
  comp: (faceValueCents, authorizedBy) => Ticket.comp(faceValueCents, authorizedBy),
};

function createTicket(
  type: TicketType,
  faceValueCents: number,
  authorizedBy: string | null,
): Ticket | null {
  return FACTORY_BY_TYPE[type](faceValueCents, authorizedBy);
}
