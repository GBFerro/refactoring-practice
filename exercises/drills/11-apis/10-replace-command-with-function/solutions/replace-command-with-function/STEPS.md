# Steps — one function, no ceremony

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the honest cost of it — is
in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a command class has no internal structure worth turning
temps into fields for — one method, one pass, nothing to break apart — and nobody builds
it now to run it later, runs it twice, undoes it, or inspects it mid-flight. All four of
those are absent here. See [`drill-11-09`](../../../09-replace-function-with-command/README.en.md)
for the case where the first one is present and a class earns its keep.

**What it costs:** almost nothing in this direction, which is the whole finding. The one
real cost: a command object can, in principle, be built now and executed later, holding a
partially-prepared calculation alive between the two; a function is always run to
completion at the call site. Nothing in this module ever used that, but it's the honest
line item.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-10     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `calculateHandlingFee(order)`, copying `CalculateHandlingFeeCommand.execute()`'s body with `order.` in place of `this.order.`; have `execute()` delegate to it | `refactor: introduce calculateHandlingFee, delegate the command to it` |
| 2 | Move `handlingFeeFor` onto `calculateHandlingFee(order)` directly | `refactor: move handlingFeeFor off the command` |
| 3 | Move `formatFeeLine` onto `calculateHandlingFee(order)` directly | `refactor: move formatFeeLine off the command` |
| 4 | Move `totalWithFee` onto `calculateHandlingFee(order)` directly | `refactor: move totalWithFee off the command` |
| 5 | Delete `CalculateHandlingFeeCommand` — nothing calls it | `refactor: delete CalculateHandlingFeeCommand` |

Steps 2–4 are one caller each, same discipline as
[`drill-11-01`](../../../01-separate-query-from-modifier/README.en.md)'s caller-by-caller
moves — although here, unlike that drill, none of the three can actually change what a
caller receives, because a command with one method and no state behaves identically either
way. Splitting them still pays for itself: if the suite went red, you'd know from which
commit.

---

Where it lands:

```ts
export function calculateHandlingFee(order: Order): number {
  const base = BASE_FEE_POUNDS + PER_SEAT_FEE_POUNDS * order.seatCount;
  const withRush =
    order.hoursUntilShowtime < RUSH_WINDOW_HOURS ? base + RUSH_SURCHARGE_POUNDS : base;
  return Math.min(withRush, MAX_FEE_POUNDS);
}
```

```ts
export function handlingFeeFor(order: Order): number {
  return calculateHandlingFee(order);
}
```

One function instead of a class, and `handlingFeeFor` now a plain pass-through — see the
walkthrough for why it stays rather than being inlined away too.
