# Steps — total fare computed on demand

The route, in the order that keeps every step small and the suite green throughout. Terse
on purpose: keep this open in a split pane while you work. The reasoning behind each move -
and why the bug this removes is worth more than the readability - is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a value is stored on a long-lived object and kept correct by hand
at every site that changes the data it is derived from. If even one such site is missed -
now, or in six months when someone adds a new one - the stored value silently drifts from
the truth. A value with that shape has one correct move, which is why this is a drill.

**What it costs:** `totalFareCents` re-sums every trip on every call instead of reading a
field. Free for one rider's trip history checked occasionally; the wrong trade for an
account with years of trips read in a hot loop. See `WALKTHROUGH.md` for what you would
need to observe before reaching for a cache instead, and what shape a real one should take.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-09-03     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Change `totalFareCents` to sum `account.trips` directly, instead of reading `totalFareCentsCache` | `refactor: replace totalFareCentsCache read with a live sum` |
| 2 | Delete the now-dead `totalFareCentsCache` increment from `recordTrip` | `refactor: stop maintaining totalFareCentsCache in recordTrip` |
| 3 | Delete the `totalFareCentsCache` field itself, from `RiderAccount` and from `openAccount` | `refactor: remove totalFareCentsCache from RiderAccount` |

Step 1 goes first and alone, on purpose: it is the one commit where behaviour actually
changes for any caller that reaches `totalFareCents` after `applyLateReturnFee` - see
`WALKTHROUGH.md` for why the shipped suite cannot see that change, and why that is exactly
the point. Steps 2 and 3 are pure deletions of code nothing reads any more; neither one can
change what any test observes.

---

Where it lands:

```ts
// rider-account.ts
export interface RiderAccount {
  readonly riderId: string;
  readonly displayName: string;
  readonly trips: Trip[];
}

export function recordTrip(account: RiderAccount, trip: Trip): void {
  account.trips.push(trip);
}

export function totalFareCents(account: RiderAccount): number {
  return account.trips.reduce((sum, trip) => sum + trip.fareCents, 0);
}
```

No field anywhere claims to be the total. Anyone who asks `totalFareCents(account)` gets an
answer computed from the trips that exist right now - there is no second copy of the
number for a mutation to forget to update.
