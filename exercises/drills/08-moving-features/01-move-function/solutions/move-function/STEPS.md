# Steps — delivery distance moves in with the route

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a function takes two objects and reads far more fields
from one than the other. `deliveryDistanceKm` takes `(order, route)` and reads a single
field off `order` — everything else comes from `route`. That lopsidedness is Feature Envy,
and Move Function is the direct fix, not a rewrite.

**What it costs:** `order.ts` loses a calculation that many readers will still
instinctively look for there, and the parameter list stays `(order, route)` even after the
function has nothing left to say about `Order` — the public signature is frozen, so the
move can't also flip the argument order to read route-first.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-08-01     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Copy `deliveryDistanceKm` into `route.ts`, unchanged, importing only `Order`'s type | `refactor: copy deliveryDistanceKm into route.ts` |
| 2 | Turn `order.ts`'s copy into a one-line delegation to `route.ts`'s | `refactor: delegate order.ts's deliveryDistanceKm to route.ts` |
| 3 | Point `index.ts` at the `route.ts` export; delete the delegation and the now-unused `Route` import from `order.ts` | `refactor: re-export deliveryDistanceKm from route.ts` |
| 4 | Extract `stopIndexFor` and `addsReturnLeg` out of the moved function, now that it can lean on named helpers in its new home | `refactor: split deliveryDistanceKm into named route helpers` |

Steps 1 and 2 are separate on purpose: step 1 leaves two working copies and a still-green
suite; step 2 is the one where a caller could tell something moved, so it gets its own
commit to bisect against.

---

Where it lands:

```ts
// route.ts
export function deliveryDistanceKm(order: Order, route: Route): number {
  const index = stopIndexFor(route, order.customerId);
  const distanceToStop = route.stops
    .slice(0, index + 1)
    .reduce((total, stop) => total + stop.legDistanceKm, 0);
  return addsReturnLeg(route, index)
    ? distanceToStop + route.returnLegKm
    : distanceToStop;
}
```

```ts
// index.ts
export { deliveryDistanceKm } from "./route";
export type { Order, OrderItem } from "./order";
export type { Route, Stop } from "./route";
```

One line changed in `index.ts`. Every test that was green before step 3 is green after it,
because nothing they import moved — only what it resolves to underneath.
