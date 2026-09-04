# Steps — a pure lookup plus an explicit hold

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the honest cost of it — is
in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a function's name promises an answer but its body also
changes something, and at least one caller only ever wanted the answer. Not when the two
have to happen together atomically — see the walkthrough for the case this exercise is
*not* an example of.

**What it costs:** two calls where callers used to make one, and a caller that genuinely
always wants both (`holdNextAvailableSeat`) now has to sequence them itself instead of
getting the pairing for free from the old function.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-01     # 11 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `nextAvailableSeat(show, section)`, copying `findSeatAndReserve`'s search but not its two assignments; have `findSeatAndReserve` call it instead of repeating the search | `refactor: introduce nextAvailableSeat, delegate the search to it` |
| 2 | Add `holdSeat(seat, customerId)`, lifting the two assignments out of `findSeatAndReserve`'s body; have `findSeatAndReserve` call it | `refactor: introduce holdSeat, delegate the mutation to it` |
| 3 | Move `holdNextAvailableSeat` onto `nextAvailableSeat` + `holdSeat` directly | `refactor: move holdNextAvailableSeat off findSeatAndReserve` |
| 4 | Move `nextSeatQuote` onto `nextAvailableSeat`; delete the `"quote"` placeholder customer id along with it | `refactor: move nextSeatQuote onto the query, drop the placeholder id` |
| 5 | Move `sectionHasAvailability` onto `nextAvailableSeat`; delete the `"availability-check"` placeholder id | `refactor: move sectionHasAvailability onto the query, drop the placeholder id` |
| 6 | Delete `findSeatAndReserve` — nothing calls it | `refactor: delete findSeatAndReserve` |

Steps 1 and 2 are separate on purpose: step 1 only changes *how* the search happens, not
what it returns, so it cannot touch the mutation. Step 2 is the one where the split first
exists as two callable pieces, and it is still safe because `findSeatAndReserve` calls both
in the same order it always did. Nothing observable moves until step 4.

Step 4 is the one that changes behaviour, and the suite says so on its own: run
`npx vitest run --project drill-11-01` (green, because `tests/` never depended on the side
effect) and then, once you have moved every caller and copied the solution's
`tests-fixed/` into place, `SOLUTIONS=1 npx vitest run` (also green, because now the quote
genuinely doesn't hold anything).

---

Where it lands:

```ts
// seat-hold.ts
export function nextAvailableSeat(show: Show, section: string): Seat | null {
  return openSeatsInOrder(show, section)[0] ?? null;
}

export function holdSeat(seat: Seat, customerId: string): void {
  seat.status = "held";
  seat.heldBy = customerId;
}
```

```ts
// callers.ts
export function holdNextAvailableSeat(show: Show, section: string, customerId: string) {
  const seat = nextAvailableSeat(show, section);
  if (seat === null) return null;
  holdSeat(seat, customerId);
  return seat;
}
```

One caller calls both, in order, because it is the one caller that actually wants both. The
other two call only the query, and the placeholder customer ids they used to invent are
gone — there was never a customer to name.
