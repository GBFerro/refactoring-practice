# Steps — bake-quantity math, gathered next to the order it starts from

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and why the slide has to come
first — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever two statements that belong together are separated by
statements that don't interact with either of them — especially when you can feel an
Extract Function waiting on the other side. Slide Statements changes nothing observable; it
only exists to make the next move possible.

**What it costs:** the loop body reads as two visible paragraphs instead of one
top-to-bottom narrative, and the diff for step 1 is pure line movement — no new logic, which
some reviewers skim past as "just formatting" when it is the step that mattered most.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-08-06     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Slide the bake-quantity statements (`bufferUnits`, `neededUnits`, `bakeUnits`, `batches`) up, past the three shelf-tag statements, until they sit right after `standingUnits` | `refactor: slide bake-quantity statements next to standingUnits` |
| 2 | Extract `bakeUnitsFor` from the now-contiguous block | `refactor: extract bakeUnitsFor` |
| 3 | Extract `planLinesFor` from the loop; replace the `ovenBatchesUsed` running accumulator with a `reduce` over the returned lines | `refactor: extract planLinesFor; replace ovenBatchesUsed with a query` |

Step 1 is the whole drill. Steps 2 and 3 are what step 1 buys you — included here because
`solutions/` has to pass the strict lint profile, but graded on their own they would be
*Extract Function* and *Replace Temp with Query*, not *Slide Statements*.

---

Where it lands:

```ts
export function buildDailyBakePlan(
  date: BakeDate,
  catalogue: readonly BakeItem[],
  standingOrders: readonly StandingOrder[],
): BakePlan {
  const ordersBySku = groupStandingOrdersBySku(standingOrders, date.dayOfWeek);
  const lines = planLinesFor(catalogue, ordersBySku);
  const ovenBatchesUsed = lines.reduce((sum, line) => sum + line.batches, 0);
  return { date: date.iso, lines, ovenBatchesUsed };
}
```

`planLinesFor` now reads as two short, named paragraphs per item — how much to bake, and
where it goes on the shelf — instead of four lines of one interrupted by three of the
other.
