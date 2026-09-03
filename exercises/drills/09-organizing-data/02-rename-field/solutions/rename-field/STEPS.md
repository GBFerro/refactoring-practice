# Steps — Trip renamed, the published log row frozen on purpose

The route, in the order that keeps every step small and lets the compiler find what you
missed. Terse on purpose: keep this open in a split pane while you work. The reasoning
behind each move — and where the one-step version of this refactoring stops being safe —
is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a field's name no longer says what it holds, and every
reader of that field is your own compiler-checked code. `dt`, `st`, and `en` are read
directly by `fare.ts`, `route-summary.ts`, and `trip-log.ts` — all three inside this
package, all three caught by `tsc` the instant a rename misses a site.

**What it costs:** `trip-log.ts` can no longer forward `trip` as-is into its published row
— once `Trip`'s fields are renamed, `tripLogRow` has to spell out `dt: trip.durationMinutes`
by hand for every field, because the row's own keys are frozen and no longer match `Trip`'s.
One field, renamed once, now has two names to keep straight forever: the domain name and
the warehouse name.

The field is not encapsulated first — this drill renames a plain record's fields directly,
because every internal reader is compiler-checked. If that weren't true — if a reader lived
outside this package, or the field were read through a raw object with no type at all —
Encapsulate Record (`drill-07-01`) would have to come first, so that every read and write
funnels through one place before you touch the name. See `WALKTHROUGH.md` for why.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-09-02     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Rename `dt` → `durationMinutes` in `Trip`, `newTrip`, and every internal reader | `refactor: rename dt to durationMinutes` |
| 2 | Rename `st` → `startStationId` in `Trip`, `newTrip`, and every internal reader | `refactor: rename st to startStationId` |
| 3 | Rename `en` → `endStationId` in `Trip`, `newTrip`, and every internal reader | `refactor: rename en to endStationId` |

Three commits, one field each, so a broken test after any one of them points at exactly
which rename did it. `tsc --noEmit` catches a missed call site before the tests even run —
see the compiler note in `WALKTHROUGH.md`.

**Not a step:** `TripLogRow`'s own `dt`, `st`, and `en` keys. They stay exactly as they are,
in every commit above. If your diff for any of the three steps touches
`trip-log.ts`'s `interface TripLogRow`, that line does not belong in this refactoring —
back it out.

---

Where it lands:

```ts
// trip.ts
export interface Trip {
  readonly durationMinutes: number;
  readonly startStationId: string;
  readonly endStationId: string;
}
```

```ts
// trip-log.ts — the published shape, unchanged; only the right-hand side moved
export interface TripLogRow {
  readonly dt: number;
  readonly st: string;
  readonly en: string;
}

export function tripLogRow(trip: Trip): TripLogRow {
  return { dt: trip.durationMinutes, st: trip.startStationId, en: trip.endStationId };
}
```

Everything on the left of `tripLogRow`'s return still says `dt`, `st`, `en` — that line is
the entire reason the rest of the rename was safe to do in one shot.
