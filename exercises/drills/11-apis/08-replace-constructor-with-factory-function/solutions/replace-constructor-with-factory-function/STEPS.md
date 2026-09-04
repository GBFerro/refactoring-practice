# Steps — a private constructor behind three named factories

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the honest cost of it — is
in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a constructor takes a type code and uses it to decide what to
compute or validate, and at least one call site always knows which kind it wants at the
point it writes the call. Not when the constructor has no type code and no choices to make
— see the walkthrough for the plain case that doesn't need this.

**What it costs:** one general-purpose constructor becomes three named factory methods plus
a small dispatcher for the one caller that only has a runtime string to go on. A fourth
ticket kind now means touching four places instead of one, and a reader has to learn which
of the four to reach for instead of always writing `new Ticket(...)`.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-08     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `Ticket.standard`, `Ticket.premium`, `Ticket.comp` as static methods, each calling `new Ticket(...)` with the same type code the constructor already branches on | `refactor: add named static factories, still backed by the constructor` |
| 2 | Move `sellStandardTicket` and `sellPremiumTicket` onto `Ticket.standard` / `Ticket.premium` | `refactor: move counter sales onto the named factories` |
| 3 | Move `issueCompTicket` onto `Ticket.comp`; delete its `try/catch`, since `Ticket.comp` returns `null` instead of throwing | `refactor: move issueCompTicket onto Ticket.comp, drop the try/catch` |
| 4 | Move the constructor's validation and branching *into* `Ticket.comp`, `Ticket.premium`, `Ticket.standard`; shrink the constructor to plain field assignment | `refactor: move the type-code work out of the constructor` |
| 5 | Mark the constructor `private` | `refactor: make Ticket's constructor private` |
| 6 | Replace `importTickets`'s direct `new Ticket(row.type, ...)` with a lookup through `FACTORY_BY_TYPE`, deleting the last `try/catch` | `refactor: dispatch importTickets through the named factories` |

Step 5 is the one that turns a convention into a rule: after it, `new Ticket(...)` from
outside `ticket.ts` is a compile error, not just a discouraged habit. Step 6 is the one that
changes behaviour for the batch path — run the suite immediately after it and confirm
`issueCompTicket`'s exact assertions (`toBeNull()`, `not.toThrow()`) still hold for the
`importTickets` path too, not only for the single-ticket callers.

---

Where it lands:

```ts
// ticket.ts
export class Ticket {
  private constructor(fields: TicketFields) { /* plain assignment, no branching */ }

  static standard(faceValueCents: number): Ticket { /* ... */ }
  static premium(faceValueCents: number): Ticket { /* ... */ }
  static comp(faceValueCents: number, authorizedBy: string | null): Ticket | null { /* ... */ }
}
```

```ts
// callers.ts
const FACTORY_BY_TYPE: Record<TicketType, Factory> = {
  standard: (faceValueCents) => Ticket.standard(faceValueCents),
  premium: (faceValueCents) => Ticket.premium(faceValueCents),
  comp: (faceValueCents, authorizedBy) => Ticket.comp(faceValueCents, authorizedBy),
};
```

Every call site that knows its ticket kind at the point it writes the call says so by name.
Only `importTickets`, which only has a string off a spreadsheet row, still looks the type
code up — in one table, not a constructor. See the sibling exercise
[`07-remove-setting-method`](../../../07-remove-setting-method/README.en.md), which this
one's constructor design leans on, and
[`10-conditional-logic/04-replace-conditional-with-polymorphism`](../../../../10-conditional-logic/04-replace-conditional-with-polymorphism/README.en.md)
for what happens when the branches inside those three factories stop being data and start
being genuinely different behaviour.
