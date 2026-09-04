import { Ticket, type TicketDetails } from "./ticket";

/** Whatever prints the physical stub and hands back the serial now committed to it. */
export interface SerialPrinter {
  nextSerial(): string;
}

/** Issues tickets and keeps the registry a refund or a door scan looks them up by. */
export class TicketOffice {
  readonly #printer: SerialPrinter;
  readonly #ticketsById = new Map<string, Ticket>();

  constructor(printer: SerialPrinter) {
    this.#printer = printer;
  }

  issueTicket(details: TicketDetails): Ticket {
    const ticket = new Ticket(this.#printer.nextSerial(), details);
    this.#ticketsById.set(ticket.id, ticket);
    return ticket;
  }

  findById(id: string): Ticket | undefined {
    return this.#ticketsById.get(id);
  }
}
