# Steps — one rider record, trips that point at it

The route, in the order that keeps every step small and the suite green throughout. Terse
on purpose: keep this open in a split pane while you work. The reasoning behind each move -
and why the bug this removes can't show up in the shipped tests - is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** the same logical entity is copied into two or more owners, each
copy drifts independently, and correcting the entity means finding and updating every copy
by hand. `Rider` passes that test: it has an identity (`id`) a real person expects to stay
correct once fixed, and Riverline's whole reason to track riders at all is to reach them -
a stale phone number is not a cosmetic bug.

**What it costs:** every trip now depends on the `RiderDirectory` that owns its rider,
instead of being a fully self-contained record. See
[`drill-09-04`](../../../04-change-reference-to-value/README.en.md) for the opposite
problem: data that needs to be safe to copy freely, not tied to one shared owner.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-09-05     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Change `toTrip` to hold the `Rider` it was given directly, instead of routing it through `snapshotRider` first | `refactor: hold the rider itself on a trip, not a copy` |
| 2 | Delete the now-unreachable `snapshotRider` helper | `refactor: remove snapshotRider` |

Step 1 is the entire refactoring, mechanically, and the one no test can see change - see
`WALKTHROUGH.md` for why. Step 2 is pure deletion of code nothing calls any more.
`requireRider` and `toTrip` are pre-existing extractions this drill leaves alone; only the
one field inside `toTrip` is this refactoring's business.

---

Where it lands:

```ts
function toTrip(tripId: string, rider: Rider, input: TripBookingInput): Trip {
  return {
    id: tripId,
    rider,
    fromStationId: input.fromStationId,
    toStationId: input.toStationId,
  };
}

export function bookTrip(
  directory: RiderDirectory,
  tripId: string,
  input: TripBookingInput,
): Trip {
  return toTrip(tripId, requireRider(directory, input.riderId), input);
}
```

`rider`, not `snapshotRider(rider)`. Every trip a rider has ever taken now holds the same
`Rider` object the directory owns - correct their phone number once, in `correctRiderPhone`,
and every trip that already exists sees it, with nothing to loop over and nothing to forget.
