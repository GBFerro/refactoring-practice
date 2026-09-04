# Steps — score the seat, not its fields

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move - and why one function in this
file deliberately does not get it - is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a function's parameters are always read from the same record at
every call site, and the function has no reason to be reusable for a different record
shape. Not when the callee is meant to serve more than one kind of caller - see
`positionScore` below, which stays put.

**What it costs:** `seatScore` now imports `Seat` and can never be reused for scoring
anything that isn't a seat. That's a real cost, and it's exactly why `positionScore` is not
getting the same treatment in this drill.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-04     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `seatScoreOf(seat)`, delegating to the existing three-parameter `seatScore` | `refactor: introduce seatScoreOf, delegate to the old seatScore` |
| 2 | Move `bestUpgradeCandidate`'s two call sites onto `seatScoreOf` | `refactor: move bestUpgradeCandidate onto seatScoreOf` |
| 3 | Inline the old `seatScore`'s body into `seatScoreOf`; delete the old `seatScore`; rename `seatScoreOf` to `seatScore` | `refactor: inline and rename seatScoreOf to seatScore` |
| 4 | Collapse `bestUpgradeCandidate`'s two-branch reduce into the one-line comparison, now that `seatScore(seat)` reads as a single call | `refactor: simplify bestUpgradeCandidate's reduce` |
| - | Leave `positionScore` and `bestStandingSpot` exactly as they are | *(no commit - a decision, not a step)* |

`seatScore` has exactly one caller, unlike drill-11-01's three functions sharing one
lookup - so steps 1 and 2 can't be made as risk-free as they were there. Step 1 is still
purely additive (nothing calls `seatScoreOf` yet), which is the part worth keeping small
even with only one caller downstream.

---

Where it lands:

```ts
// seat-score.ts
export function seatScore(seat: Seat): number {
  const base = positionScore(seat.distanceFromStageMeters, seat.offsetFromCenterMeters);
  return seat.hasRestrictedView ? Math.round(base / 2) : base;
}
```

```ts
// upgrade-suggestions.ts
export function bestUpgradeCandidate(seats: readonly Seat[]): Seat | null {
  return seats.reduce<Seat | null>(
    (best, seat) => (best === null || seatScore(seat) > seatScore(best) ? seat : best),
    null,
  );
}
```

```ts
// position-score.ts - unchanged
export function positionScore(
  distanceFromStageMeters: number,
  offsetFromCenterMeters: number,
): number { /* ... */ }
```

One clump stops traveling in pieces. One shared helper stays exactly as narrow as it needs
to be to serve two callers that don't share a type.
