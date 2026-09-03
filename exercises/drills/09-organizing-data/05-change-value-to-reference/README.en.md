[🌐 English](./README.en.md)

# Change Value to Reference

`Chapter 9` · `Change Value to Reference` · `●●○` · ~25 min

## Context

Riverline Bike Share keeps a directory of every rider - their name, phone, and email - and
books trips against it. Each trip needs to know who rode it and how to reach them, so
`bookTrip` looks the rider up and attaches their details to the trip it creates.

## The smell

**Shotgun Surgery.** `bookTrip` looks up the correct rider, then copies their name, phone,
and email into a brand new object before attaching it to the trip. Every trip a rider has
ever taken ends up holding its own independent copy of the same four fields. Correcting a
rider's phone number - `correctRiderPhone` - fixes the directory's own record and stops
there; every trip booked before that correction keeps its old, now-wrong copy, with nothing
that would find and update them. Multiplied across however many trips a regular rider takes,
that's a lot of copies for one conceptual fix to reach.

## The target

**Change Value to Reference**: stop copying the rider onto each trip. Give `Rider` a single
owner - the `RiderDirectory` - and have every trip hold the *same* `Rider` object the
directory owns, not a snapshot of it. Correcting a rider's phone number then updates every
trip that has ever referenced them, automatically, because there was never more than one
copy to begin with.

## Done when

- `bookTrip` attaches the `Rider` object returned by the directory directly to the trip -
  no field-by-field copy anywhere in the booking path.
- `correctRiderPhone` is the only place a rider's details change, and its effect is visible
  through every `Trip` that already references that rider.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters -
  `npm run lint:strict -- exercises/drills/09-organizing-data/05-change-value-to-reference/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Look at what `bookTrip` does with the `Rider` object `findRider` hands it. If it builds a
new object out of that rider's fields before attaching it to the trip, that construction is
the entire smell - and the entire fix is deleting it, not adding anything.
</details>

<details>
<summary>I don't see a test that fails against the un-refactored version. Is the bug real?</summary>

It's real - register a rider, book a trip, correct the rider's phone number through
`correctRiderPhone`, then check that *same, already-booked* trip's `rider.phone` against
`src/`. It's still the old number. The shipped tests can't assert on that directly, because
the same spec file has to pass against both the buggy version and your fixed one, and no
single expected value does both. `WALKTHROUGH.md` explains why that absence is the point,
not a gap - and what the tests check instead.
</details>

<details>
<summary>Should Trip store a riderId and look the rider up each time, instead of holding the object directly?</summary>

It's a real, defensible alternative - and it isn't what this drill asks for. Holding the
`Rider` object itself is the more direct reading of *Change Value to Reference*: the trip's
`rider` field keeps its exact shape and meaning, and only what gets assigned to it changes.
Relocating every call site to go through a lookup is a second decision riding on top of
this one. `WALKTHROUGH.md` says more about the trade.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 9, *Change Value to Reference*; chapter 3, *Shotgun
Surgery*.
