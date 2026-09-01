# Steps — named pipeline steps, one loop left alone

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the one loop that does not
move — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a loop whose whole job is to filter, transform, or total a
collection, with nothing left over once you name the step. Five of the six loops in this
file are exactly that shape.

**What it costs:** reading the accepted or rejected total now means trusting
`filter`/`map`/`reduce` chains under names instead of watching one loop build them, and the
capacity check ends up a hand-written loop sitting next to three pipelines — a reader has
to notice why, not assume the exercise ran out of time to convert it.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-08-08     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Extract `isAccepted`, testing `delivery.qualityPassed`, ahead of touching either loop that reads it | `refactor: extract isAccepted predicate` |
| 2 | Replace `acceptedDeliveries`'s accumulate loop with `deliveries.filter(isAccepted)` | `refactor: replace acceptedDeliveries loop with filter` |
| 3 | Replace `rejectedDeliveries`'s accumulate loop with `deliveries.filter((d) => !isAccepted(d))` | `refactor: replace rejectedDeliveries loop with filter` |
| 4 | Replace `renderAcceptedSection`'s push loop with `accepted.map(renderAcceptedLine)` | `refactor: replace renderAcceptedSection loop with map` |
| 5 | Replace `renderRejectedSection`'s push loop with `rejected.map(renderRejectedLine)` | `refactor: replace renderRejectedSection loop with map` |
| 6 | Replace `acceptedTotalCents`'s running-total loop with `accepted.reduce((sum, d) => sum + d.costCents, 0)` | `refactor: replace acceptedTotalCents loop with reduce` |

`findCapacityBreach` is deliberately not in this table. It stays a loop — see
[`WALKTHROUGH.md`](./WALKTHROUGH.md) for why converting it costs more than it saves.

---

Where it lands:

```ts
function isAccepted(delivery: Delivery): boolean {
  return delivery.qualityPassed;
}

function acceptedDeliveries(deliveries: readonly Delivery[]): Delivery[] {
  return deliveries.filter(isAccepted);
}

function rejectedDeliveries(deliveries: readonly Delivery[]): Delivery[] {
  return deliveries.filter((delivery) => !isAccepted(delivery));
}

function acceptedTotalCents(accepted: readonly Delivery[]): number {
  return accepted.reduce((sum, delivery) => sum + delivery.costCents, 0);
}
```

Four short expressions where there were four loops, plus the two `render*Section`
functions that now read `xs.length > 0 ? xs.map(renderLine) : ["  (none)"]` instead of
building `lines` by hand. `findCapacityBreach` is exactly as long as it was before you
started.
