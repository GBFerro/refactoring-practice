# Steps — two named functions, one pushed-up conditional

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move - and the honest cost of it - is
in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a boolean parameter routes a function to steps that genuinely
differ - not merely to a different value it writes down - and at least one caller's flag
is a literal, so the two routes are already knowable by reading the call site instead of
running the function. Not when the two routes differ only in a number or a string: that is
Parameterize Function's job (drill-11-02), and a flag argument there is a name problem, not
a two-functions problem.

**What it costs:** two names to keep straight instead of one, and `bookByPhone` - the one
caller whose choice is genuinely dynamic - now carries its own `if` instead of computing a
boolean and handing it to something else to branch on.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-03     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `bookPriority(section, order)`, copying `book`'s `isPriority` branch; have `book` call it | `refactor: introduce bookPriority, delegate the priority branch to it` |
| 2 | Add `bookStandard(section, order)`, copying `book`'s other branch; have `book` call it | `refactor: introduce bookStandard, delegate the standard branch to it` |
| 3 | Move `bookAtCounter` onto `bookPriority` directly | `refactor: move bookAtCounter off book` |
| 4 | Move `bookByMail` onto `bookStandard` directly | `refactor: move bookByMail off book` |
| 5 | Move `bookByPhone` onto an `if` it owns, calling `bookPriority` or `bookStandard`; delete the boolean it used to compute | `refactor: move bookByPhone off book, push the condition up` |
| 6 | Delete `book` - nothing calls it | `refactor: delete book` |
| 7 | Extract `claimSeats` and `receiptFor` from the duplication left behind in `bookPriority` and `bookStandard` | `refactor: extract claimSeats and receiptFor` |

Steps 1 and 2 only change *how* `book` finds its answer, not what any caller receives -
`book` still runs the same branch it always did, one level of indirection deeper. Steps 3
and 4 are safe for the same reason step 1 is in drill-11-01: the literal never varied, so
routing it straight to the matching function cannot change what comes back. Step 5 is the
one where a caller's own code changes shape, because it is the one caller whose argument
was never a literal to begin with.

---

Where it lands:

```ts
// book.ts
export function bookPriority(section: Section, order: Order): Receipt {
  if (section.availableSeats < order.seatCount) {
    throw new Error(`Not enough seats left in ${section.name} for a priority booking`);
  }
  claimSeats(section, order.seatCount);
  return receiptFor(order, "confirmed");
}

export function bookStandard(section: Section, order: Order): Receipt {
  if (section.availableSeats < order.seatCount) {
    section.waitlist.push(order.customerName);
    return receiptFor(order, "waitlisted");
  }
  claimSeats(section, order.seatCount);
  return receiptFor(order, "pending");
}
```

```ts
// callers.ts
export function bookByPhone(section: Section, order: Order): Receipt {
  return order.seatCount >= GROUP_PRIORITY_THRESHOLD
    ? bookPriority(section, order)
    : bookStandard(section, order);
}
```

Two names instead of one, and the one caller that needed a live decision now makes it in
the open, at the one place that has the information to make it.
