# Steps — fare corrected by replacement, not mutation

The route, in the order that keeps every step small and the suite green throughout. Terse
on purpose: keep this open in a split pane while you work. The reasoning behind each move -
and why the bug this removes can't show up in the shipped tests - is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** an object is shared by reference between two or more owners, and
something needs to be able to correct one owner's copy without touching the others' - or
without knowing how many others there even are. `Fare` passes that test: it is small, it
carries no identity of its own, and nothing in this domain ever needs to ask "is this the
*same* fare as that one," only "is it worth the *same amount*."

**What it costs:** every correction now allocates a new `Fare` instead of editing the old
one, and nothing can watch a `Fare` change over time - if some future feature genuinely
needed to observe a fare mutate live, this shape would have to be undone. See
[`drill-09-05`](../../../05-change-value-to-reference/README.en.md) for the opposite
problem: data that *does* need one shared, observable owner.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-09-04     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `Fare.adjustedBy(deltaCents): Fare`, a pure sibling to `adjustBy` - nothing calls it yet | `refactor: add Fare.adjustedBy alongside the mutator` |
| 2 | Point `adjustTripFare` at `adjustedBy`, reassigning `trip.fare` instead of mutating through `adjustBy` | `refactor: correct a fare by replacement, not mutation` |
| 3 | Delete the now-unreachable `Fare.adjustBy` mutator | `refactor: remove the Fare.adjustBy mutator` |
| 4 | Change `Fare.cents` from a plain field to `readonly`, assigned only in the constructor | `refactor: make Fare.cents readonly` |

Step 2 is the one that matters and the one no test can see change - see `WALKTHROUGH.md`
for why, and for what that absence tells you about the bug you're removing. Steps 3 and 4
are cleanup: once nothing calls `adjustBy`, deleting it and locking `cents` are both pure
consequences of step 2, not new decisions.

---

Where it lands:

```ts
export class Fare {
  readonly cents: number;
  // ...
  adjustedBy(deltaCents: number): Fare {
    return new Fare(this.cents + deltaCents);
  }
}

export function adjustTripFare(trip: Trip, deltaCents: number): void {
  trip.fare = trip.fare.adjustedBy(deltaCents);
}
```

`bookRoundTrip` is untouched - it still hands the same `Fare` object to both legs. That is
the payoff, not a leftover: once nothing can mutate a `Fare`, sharing one is exactly as
safe as handing out two equal ones would have been.
