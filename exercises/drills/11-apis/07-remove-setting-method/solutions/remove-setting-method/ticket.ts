/** What a ticket is issued with. Never touched again once issuance is done. */
export interface TicketDetails {
  readonly performanceId: string;
  readonly priceCents: number;
  readonly holderName: string;
}

/**
 * One admission to one performance. `id` is the serial printed on the stub and the key
 * the box office looks tickets up by - it is fixed the moment the ticket exists. Who is
 * holding the ticket is not fixed: a patron may pass it on before the show.
 */
export class Ticket {
  readonly #id: string;
  readonly performanceId: string;
  readonly priceCents: number;
  #holderName: string;

  constructor(id: string, details: TicketDetails) {
    this.#id = id;
    this.performanceId = details.performanceId;
    this.priceCents = details.priceCents;
    this.#holderName = details.holderName;
  }

  get id(): string {
    return this.#id;
  }

  get holderName(): string {
    return this.#holderName;
  }

  /** Passes the ticket to someone else before the show. The serial does not change. */
  transferTo(newHolderName: string): void {
    this.#holderName = newHolderName;
  }
}
