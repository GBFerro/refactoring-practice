[🌐 English](./README.en.md)

# Rename Field

`Chapter 9` · `Rename Field` · `●○○` · ~25 min

## Context

Riverline Bike Share closes out every completed trip in three places at once: a fare
calculation, a route summary shown to the rider, and a row written to an external
analytics warehouse that a batch job outside this repository reads by column name. All
three read the same `Trip` record.

## The smell

**Mysterious Name.** `Trip`'s three fields are `dt`, `st`, and `en` — a duration and two
station ids, abbreviated down to letters that say nothing about which is which without
opening the doc comment above each one. `fare.ts` and `route-summary.ts` both read them
directly, and both will keep being wrong to read until the fields say what they hold.

The complication: a third reader, `trip-log.ts`, also reads `trip.dt`, `trip.st`, and
`trip.en` — but writes them straight back out under a `TripLogRow` whose keys are a CSV
header already published to an external warehouse. Nothing in this repository consumes
`TripLogRow`; something outside it does, by those exact keys.

## The target

**Rename Field**: `Trip.dt`, `Trip.st`, and `Trip.en` become `durationMinutes`,
`startStationId`, and `endStationId` — and every reader inside this package moves with
them, in one commit per field, checked by `tsc` as you go. `TripLogRow`'s own `dt`, `st`,
and `en` keys do not move. They are a separate, published contract, and this drill is as
much about knowing which fields are safe to rename directly as it is about the rename
itself.

The record is not encapsulated first. It doesn't need to be here — every internal reader
is compiler-checked TypeScript, which is exactly the case Rename Field's own mechanics
say you can rename directly in. When that isn't true — a reader outside the package, or a
raw object read with no type at all — `drill-07-01`'s Encapsulate Record has to come
first. See `WALKTHROUGH.md` for where that line actually falls here.

## Done when

- `Trip` declares `durationMinutes`, `startStationId`, and `endStationId`; nothing in
  `fare.ts` or `route-summary.ts` reads `dt`, `st`, or `en` any more.
- `TripLogRow`, in `trip-log.ts`, still declares `dt`, `st`, and `en` — unchanged, on
  purpose.
- `npm run lint:strict -- exercises/drills/09-organizing-data/02-rename-field/src` is
  clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Rename one field at a time, starting with `dt`. Change its declaration in `Trip`, then let
`tsc --noEmit` name every call site you haven't fixed yet — it will fail on `trip.dt`
wherever it's still expected. Fix those, confirm the suite is green, then move to the next
field.
</details>

<details>
<summary>Do I need to encapsulate `Trip` first?</summary>

Check who reads it. If every reader is TypeScript inside this package, the compiler will
catch a missed rename for you, and a direct rename is exactly what the book's own mechanic
allows. `drill-07-01` is the move for when that isn't true — a reader the compiler can't
see, reading a field name it will never be told changed.
</details>

<details>
<summary>What about `TripLogRow`?</summary>

Read `trip-log.ts` before you rename anything. It reads `Trip`'s fields too, but its own
`dt`/`st`/`en` keys are a published shape — a CSV header something outside this repository
already depends on. Renaming those keys would compile, pass every test here, and still
break a consumer nothing in this codebase can see.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 9, *Rename Field*; chapter 3, *Mysterious Name*.
