# Steps — two named results instead of one reused variable

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the test for telling the
two kinds of reassignment apart — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a variable is reassigned to answer a *different*
question than the one it started with. `amount` first holds the metered fare, then gets
reassigned to hold the deposit refund — unrelated numbers that happen to share a name and
a type. That is the smell; a loop total that keeps answering the same question with each
reassignment is not, and this drill makes you build one of each so you have to tell them
apart.

**What it costs:** the function grows from one running number to two named ones, so a
reader now holds two results in mind for the length of the function instead of watching one
number change. For a function this short, that is a clear win; the cost is real for a
longer one.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-09-01     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Give the deposit refund its own declaration, computed independently instead of reassigning `amount` | `refactor: split the deposit refund off of amount` |
| 2 | Rename the loop's accumulator from `amount` to `meteredFareCents` at its declaration and every use inside the loop | `refactor: rename amount to meteredFareCents` |
| 3 | Delete the now-redundant `const meteredFareCents = amount;` capture line | `refactor: drop the meteredFareCents alias` |

Step 1 has to come before step 2: renaming `amount` while it still holds two meanings for
half the function would just be swapping in a different wrong name for the second half. The
split has to happen first so that, by the time you rename, `amount` only has one job left.

---

Where it lands:

```ts
export function tripCostCents(trip: Trip, tariff: Tariff): TripCost {
  let meteredFareCents = 0;
  for (const tier of tariff.tiers) {
    meteredFareCents += minutesInTier(trip.durationMinutes, tier) * tier.centsPerMinute;
  }

  const depositRefundCents = trip.dockConfirmed ? tariff.depositCents : 0;

  return {
    meteredFareCents,
    depositRefundCents,
    totalDueCents: Math.max(meteredFareCents - depositRefundCents, 0),
  };
}
```

`meteredFareCents` is still a `let`, reassigned once per tier — that reassignment survives
the refactoring untouched, because every one of those reassignments answers the same
question. Only the reassignment that changed the *question* is gone.
