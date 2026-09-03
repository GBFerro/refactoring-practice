# Steps — two loops, one for each total

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — the objection everyone raises,
and where this leads next — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a loop that accumulates two (or more) results nobody asked for
together — one for the till, one for the mixer, tangled because they share a `for`. If the
two results are used by the same reader for the same reason, you may not need this at all;
see the alternatives at the end of the walkthrough.

**What it costs:** a second pass over `orders`, and two names to maintain (`revenueCents`,
`flourGramsUsed`) instead of one loop that did both. For a day's worth of orders that
second pass is not a real cost — the full argument, and what would change if it were, is in
the walkthrough.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-08-07     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Duplicate the loop inside `dayTotals`, so it runs twice and both copies still update both accumulators | `refactor: duplicate the totals loop` |
| 2 | Strip the **first** copy down to `revenueCents` only — delete its `flourGramsUsed` line | `refactor: first loop keeps only revenue` |
| 3 | Strip the **second** copy down to `flourGramsUsed` only — delete its `revenueCents` line | `refactor: second loop keeps only flour` |
| 4 | Extract the first loop into its own `revenueCents(orders)` function | `refactor: extract revenueCents` |
| 5 | Extract the second loop into its own `flourGramsUsed(orders)` function | `refactor: extract flourGramsUsed` |
| 6 | `dayTotals` becomes a two-line composition of the two new functions | `refactor: compose dayTotals from the two sums` |

Steps 2 and 3 are separate on purpose: each one only deletes a line from a loop that is
already duplicated, so if a total goes wrong you know which half broke it.

Steps 4–5 are *Extract Function* (chapter 6), not *Split Loop* itself — the catalog move
ends at step 3. They are here because leaving two loops sitting unnamed inside one function
is rarely where you'd actually stop; see the walkthrough for the case against stopping
early.

---

Where it lands:

```ts
function dayTotals(orders: readonly Order[]): DayTotals {
  return {
    revenueCents: revenueCents(orders),
    flourGramsUsed: flourGramsUsed(orders),
  };
}
```

Two single-purpose loops behind two names. Neither can affect the other any more, and
either one is now a one-line change away from becoming a `reduce()` — which is a different
day's refactoring: [`08-replace-loop-with-pipeline`](../../../08-replace-loop-with-pipeline/README.en.md).
