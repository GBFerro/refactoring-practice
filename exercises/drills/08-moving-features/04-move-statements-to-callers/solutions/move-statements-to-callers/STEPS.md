# Steps — two closings, one shared summary

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a shared function has grown a flag whose only job is to pick
between what different callers want at the end (or the start) of the function, and the
callers do not actually agree on what should happen there. If every caller wants the same
thing instead, the direction reverses — see "When not to choose this" below.

**What it costs:** one function becomes three (a shared summary, plus two closings), and
the two closings repeat the same *shape* — call the summary, push two more lines — even
though their content differs. A third audience means writing a third closing by hand
instead of adding a branch to one.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-08-04     # 6 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Extract `renderStopSummary` (header + item lines only) from `renderDispatchNote`, called internally; behaviour unchanged | `refactor: extract renderStopSummary as prep` |
| 2 | Copy the courier's tail (kilogram line, liability line) into `dispatchToCourier`, calling `renderStopSummary` directly instead of `renderDispatchNote` | `refactor: move the courier's closing to dispatchToCourier` |
| 3 | Copy the driver's tail (gram line, sign-off line) into `dispatchToDriver`, calling `renderStopSummary` directly | `refactor: move the driver's closing to dispatchToDriver` |
| 4 | Delete `renderDispatchNote` and the `forCourier` flag — nothing calls it any more | `refactor: remove the now-dead renderDispatchNote and its flag` |

Steps 2 and 3 are separate on purpose, same reason 08-03 splits its bug fix from its move:
each is independently testable, and if one caller's closing turns out wrong you know which
commit did it.

---

Where it lands:

```ts
export function renderStopSummary(stop: DispatchStop): string[] {
  return [ /* header, deliver-to, item lines */ ];
}

export function dispatchToDriver(stop: DispatchStop): string[] {
  return [...renderStopSummary(stop), gramsLine, "Please sign at the door to confirm receipt."];
}

export function dispatchToCourier(stop: DispatchStop): string[] {
  return [...renderStopSummary(stop), kilogramsLine, "Courier handoff — Ashgrove liability ends at pickup."];
}
```

Three small functions instead of one with a flag. Neither closing knows the other exists.

## When not to choose this

If, instead, every caller of a shared function wants the exact same statements and only
the *call sites* repeat them, the direction is reversed: fold the statements into the
function. See [`../../../03-move-statements-into-function/README.en.md`](../../../03-move-statements-into-function/README.en.md) — its
whole exercise is what happens right up until the moment a caller stops agreeing.
