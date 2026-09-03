[🌐 English](./README.en.md)

# Change Reference to Value

`Chapter 9` · `Change Reference to Value` · `●●○` · ~25 min

## Context

Riverline Bike Share prices every trip through a `Fare`: an amount in cents attached to the
ride. Riders often book a there-and-back pair at one dock in a single call - out to the
market, back home an hour later - and the system quotes both legs at one flat rate rather
than pricing them separately.

## The smell

**Mutable Data.** `Fare` is a class with a `cents` field you can edit after construction and
an `adjustBy` method built to do exactly that, in place. `bookRoundTrip`, reasonably enough,
prices both legs from a single `Fare` object instead of allocating two - they cost the
same, so why not. The trouble starts the day a dispatcher corrects one leg's fare:
`adjustTripFare` reaches into `trip.fare` and mutates whatever object it finds there, which
means the *other* leg's fare changes too, silently, because it was always the same object
answering to two names.

## The target

**Change Reference to Value**: make `Fare` immutable. `cents` is set once, at construction,
and a correction produces a *new* `Fare` rather than editing the old one. Once nothing can
mutate a `Fare` after it's built, sharing one between two trips stops being a hazard -
`bookRoundTrip` doesn't need to change at all, and `WALKTHROUGH.md` explains exactly why
that's the payoff and not an oversight.

## Done when

- `Fare.cents` is `readonly`, and nothing in the solution mutates a `Fare` after it is
  constructed.
- Correcting a trip's fare replaces the trip's own `Fare` reference; it never edits a
  `Fare` object in place.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters -
  `npm run lint:strict -- exercises/drills/09-organizing-data/04-change-reference-to-value/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Add a pure `adjustedBy(deltaCents)` method next to the existing `adjustBy`, without
deleting anything or touching a single caller yet. The suite stays green because nothing
calls the new method - you've added code, not changed behaviour. Only once it exists do you
redirect `adjustTripFare` to use it.
</details>

<details>
<summary>I don't see a test that fails against the un-refactored version. Is the bug real?</summary>

It's real - book a round trip, call `adjustTripFare` on the outbound leg, then check the
inbound leg's `fare.cents` against `src/`. They move together. The shipped tests can't
assert on that directly, because the same spec file has to pass against both the buggy
version and your fixed one, and no single expected number does both.
`WALKTHROUGH.md` explains why that absence is the point, not a gap - and what the tests
check instead.
</details>

<details>
<summary>Do I need to stop `bookRoundTrip` from sharing one Fare between the two legs?</summary>

No, and that's the part of this drill most people get wrong on a first pass. Once `Fare`
can't be mutated, handing the same instance to two trips is exactly as safe as handing out
two equal instances would have been - the sharing was never the bug. `WALKTHROUGH.md` walks
through why fixing the mutator, not the sharing, is the actual target.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 9, *Change Reference to Value*; chapter 3, *Mutable
Data*.
