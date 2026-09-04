# Steps — a private field the constructor is the only writer of

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the honest cost of it — is
in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a setter's only real caller runs once, right next to
construction, and nothing in the domain has a legitimate later reason to call it again. Not
when the field actually needs to change later — see `transferTo` below for the setter this
drill keeps on purpose.

**What it costs:** a mis-numbered ticket can no longer be patched in place. Fixing a bad
serial after this refactor means voiding the ticket and issuing a replacement, not calling
a method on the one you have — a real workflow this drill does not build.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-07            # 7 passed
SOLUTIONS=1 npx vitest run                      # 10 passed (tests/ + tests-fixed/)
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add an `id` parameter to `Ticket`'s constructor; keep `setId` alongside it, unused by the constructor itself | `refactor: accept id in Ticket's constructor` |
| 2 | In `TicketOffice.issueTicket`, get the serial from the printer *before* constructing the ticket, and pass it to the constructor | `refactor: compute the serial before building the ticket` |
| 3 | Delete the `ticket.setId(...)` call in `issueTicket` — nothing needs it now | `refactor: stop calling setId after construction` |
| 4 | Delete `setId` from `Ticket`; delete the `this.#id = ""` placeholder assignment | `refactor: remove setId, id is now constructor-only` |
| 5 | Mark `#id` `readonly` | `refactor: mark id readonly` |

Step 2 is the one that changes behaviour — everything before it only adds an unused
parameter, and everything after it only deletes code nothing calls any more.

---

Where it lands:

```ts
// ticket.ts
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

  transferTo(newHolderName: string): void {
    this.#holderName = newHolderName;
  }
}
```

```ts
// ticket-office.ts
issueTicket(details: TicketDetails): Ticket {
  const ticket = new Ticket(this.#printer.nextSerial(), details);
  this.#ticketsById.set(ticket.id, ticket);
  return ticket;
}
```

One setter is gone. One setter — `transferTo` — is still there, on purpose, because a
ticket's holder is genuinely allowed to change and its id genuinely is not. See
[`WALKTHROUGH.md`](./WALKTHROUGH.md) for the sibling exercise:
[`08-replace-constructor-with-factory-function`](../../../08-replace-constructor-with-factory-function/README.en.md),
which is about the constructor this one leans on.
